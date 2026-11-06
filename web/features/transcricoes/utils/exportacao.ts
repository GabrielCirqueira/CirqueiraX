import type { FormatoExportacao, SegmentoTranscricao, TranscricaoDetalhe } from '../types'
import { formatarCarimboTempo, formatarDuracao } from './formatacao'

const PADRAO_NOME_INVALIDO = /[\\/:*?"<>|]+/g
const NOME_PADRAO = 'transcricao'

const TIPOS_MIME: Record<FormatoExportacao, string> = {
  txt: 'text/plain;charset=utf-8',
  srt: 'application/x-subrip;charset=utf-8',
  vtt: 'text/vtt;charset=utf-8',
  md: 'text/markdown;charset=utf-8',
}

export const OPCOES_EXPORTACAO: {
  formato: FormatoExportacao
  rotulo: string
  descricao: string
}[] = [
  { formato: 'txt', rotulo: 'Texto (.txt)', descricao: 'Texto corrido, pronto para colar' },
  { formato: 'md', rotulo: 'Markdown (.md)', descricao: 'Com título e marcações de tempo' },
  { formato: 'srt', rotulo: 'Legenda (.srt)', descricao: 'Para vídeos e players' },
  { formato: 'vtt', rotulo: 'Legenda web (.vtt)', descricao: 'Para players na web' },
]

function gerarLegendaSrt(segmentos: SegmentoTranscricao[]): string {
  return segmentos
    .map(
      (segmento, indice) =>
        `${indice + 1}\n${formatarCarimboTempo(segmento.inicio, ',')} --> ${formatarCarimboTempo(segmento.fim, ',')}\n${segmento.texto}\n`
    )
    .join('\n')
}

function gerarLegendaVtt(segmentos: SegmentoTranscricao[]): string {
  const blocos = segmentos.map(
    (segmento) =>
      `${formatarCarimboTempo(segmento.inicio, '.')} --> ${formatarCarimboTempo(segmento.fim, '.')}\n${segmento.texto}\n`
  )
  return `WEBVTT\n\n${blocos.join('\n')}`
}

function gerarMarkdown(transcricao: TranscricaoDetalhe): string {
  const linhas = transcricao.segmentos.map(
    (segmento) => `**[${formatarDuracao(segmento.inicio)}]** ${segmento.texto}`
  )
  return `# ${transcricao.titulo}\n\n${linhas.join('\n\n')}\n`
}

export function gerarConteudoExportacao(
  transcricao: TranscricaoDetalhe,
  formato: FormatoExportacao
): string {
  if (formato === 'srt') return gerarLegendaSrt(transcricao.segmentos)
  if (formato === 'vtt') return gerarLegendaVtt(transcricao.segmentos)
  if (formato === 'md') return gerarMarkdown(transcricao)
  return `${transcricao.texto ?? ''}\n`
}

export function baixarExportacao(
  transcricao: TranscricaoDetalhe,
  formato: FormatoExportacao
): void {
  const conteudo = gerarConteudoExportacao(transcricao, formato)
  const nomeBase = transcricao.titulo.replace(PADRAO_NOME_INVALIDO, ' ').trim() || NOME_PADRAO
  const url = URL.createObjectURL(new Blob([conteudo], { type: TIPOS_MIME[formato] }))
  const link = document.createElement('a')
  link.href = url
  link.download = `${nomeBase}.${formato}`
  link.click()
  URL.revokeObjectURL(url)
}
