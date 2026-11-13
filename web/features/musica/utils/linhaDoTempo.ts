import type { ItemArtistaLinhaDoTempo, ItemMusicaLinhaDoTempo, MesLinhaDoTempo } from '../types'
import { gerarRotaArtista, gerarRotaMusica } from './analiseMusica'

export type TipoLinhaDoTempo = 'musicas' | 'artistas'

export const OPCOES_TIPO_LINHA_DO_TEMPO: { chave: TipoLinhaDoTempo; rotulo: string }[] = [
  { chave: 'musicas', rotulo: 'Músicas' },
  { chave: 'artistas', rotulo: 'Artistas' },
]

export type MovimentoLinhaDoTempo =
  | { tipo: 'novo' }
  | { tipo: 'igual' }
  | { tipo: 'subiu'; valor: number }
  | { tipo: 'caiu'; valor: number }

export interface ItemLinhaDoTempo {
  chave: string
  titulo: string
  subtitulo: string
  imagemUrl: string | null
  rota: string
  posicao: number
  streams: number
  minutos: number
  movimento: MovimentoLinhaDoTempo
}

export interface PassagemTrilha {
  ano: number
  mes: number
  posicao: number
}

export interface TrilhaLinhaDoTempo {
  item: ItemLinhaDoTempo
  passagens: PassagemTrilha[]
  melhorPosicao: PassagemTrilha
  vezesNoTopo: number
  totalStreams: number
}

export function tipoLinhaDoTempo(chave: string): TipoLinhaDoTempo {
  return chave === 'artistas' ? 'artistas' : 'musicas'
}

export function descreverMovimento(
  posicao: number,
  posicaoAnterior: number | null
): MovimentoLinhaDoTempo {
  if (posicaoAnterior === null) return { tipo: 'novo' }
  if (posicaoAnterior === posicao) return { tipo: 'igual' }
  if (posicaoAnterior > posicao) return { tipo: 'subiu', valor: posicaoAnterior - posicao }
  return { tipo: 'caiu', valor: posicao - posicaoAnterior }
}

function chaveMusica(musica: ItemMusicaLinhaDoTempo): string {
  return musica.musicaUuid ?? `${musica.nomeFaixa}|${musica.artista}`.trim().toLowerCase()
}

function chaveArtista(artista: ItemArtistaLinhaDoTempo): string {
  return artista.artistaUuid ?? artista.nome.trim().toLowerCase()
}

function itemDaMusica(musica: ItemMusicaLinhaDoTempo): ItemLinhaDoTempo {
  return {
    chave: chaveMusica(musica),
    titulo: musica.nomeFaixa,
    subtitulo: musica.artista,
    imagemUrl: musica.imagemUrl,
    rota: gerarRotaMusica(musica.nomeFaixa, musica.artista, musica.musicaUuid),
    posicao: musica.posicao,
    streams: musica.streams,
    minutos: musica.minutos,
    movimento: descreverMovimento(musica.posicao, musica.posicaoAnterior),
  }
}

function itemDoArtista(artista: ItemArtistaLinhaDoTempo): ItemLinhaDoTempo {
  return {
    chave: chaveArtista(artista),
    titulo: artista.nome,
    subtitulo: `${artista.minutos.toLocaleString('pt-BR')} min`,
    imagemUrl: artista.imagemUrl,
    rota: gerarRotaArtista(artista.nome, artista.artistaUuid),
    posicao: artista.posicao,
    streams: artista.streams,
    minutos: artista.minutos,
    movimento: descreverMovimento(artista.posicao, artista.posicaoAnterior),
  }
}

export function itensDoMesLinhaDoTempo(
  mes: MesLinhaDoTempo,
  tipo: TipoLinhaDoTempo
): ItemLinhaDoTempo[] {
  return tipo === 'artistas' ? mes.artistas.map(itemDoArtista) : mes.musicas.map(itemDaMusica)
}

export function mesesParaFaixaLinhaDoTempo(meses: MesLinhaDoTempo[]): MesLinhaDoTempo[] {
  return [...meses].reverse()
}

export function idAnoLinhaDoTempo(ano: number): string {
  return `linha-do-tempo-${ano}`
}

export function anosDaLinhaDoTempo(meses: MesLinhaDoTempo[]): number[] {
  return [...new Set(meses.map((mes) => mes.ano))]
}

export function isPrimeiroMesDoAno(meses: MesLinhaDoTempo[], mes: MesLinhaDoTempo): boolean {
  return meses.find((outro) => outro.ano === mes.ano) === mes
}

export function rolarParaAnoLinhaDoTempo(ano: number): void {
  document
    .getElementById(idAnoLinhaDoTempo(ano))
    ?.scrollIntoView({ behavior: 'smooth', inline: 'start', block: 'nearest' })
}

export function resumirTrilhaLinhaDoTempo(
  meses: MesLinhaDoTempo[],
  tipo: TipoLinhaDoTempo,
  chave: string
): TrilhaLinhaDoTempo | null {
  const aparicoes = meses.flatMap((mes) =>
    itensDoMesLinhaDoTempo(mes, tipo)
      .filter((item) => item.chave === chave)
      .map((item) => ({ item, passagem: { ano: mes.ano, mes: mes.mes, posicao: item.posicao } }))
  )
  const ultima = aparicoes.at(-1)
  if (!ultima) return null

  const passagens = aparicoes.map((aparicao) => aparicao.passagem)
  const melhorPosicao = passagens.reduce((melhor, atual) =>
    atual.posicao < melhor.posicao ? atual : melhor
  )

  return {
    item: ultima.item,
    passagens,
    melhorPosicao,
    vezesNoTopo: passagens.filter((passagem) => passagem.posicao === 1).length,
    totalStreams: aparicoes.reduce((total, aparicao) => total + aparicao.item.streams, 0),
  }
}

export function descreverPassagensTrilha(trilha: TrilhaLinhaDoTempo): string {
  const meses = trilha.passagens.length
  const textoMeses = meses === 1 ? '1 mês no top 10' : `${meses} meses no top 10`
  const textoTopo =
    trilha.vezesNoTopo > 0
      ? ` · ${trilha.vezesNoTopo === 1 ? '1 vez' : `${trilha.vezesNoTopo} vezes`} em 1º`
      : ''
  return `${textoMeses}${textoTopo}`
}

export interface PontoTrilha {
  chave: string
  rotulo: string
  posicao: number | null
  alturaPercentual: number
}

const ALTURA_MINIMA_PONTO = 8
const TAMANHO_TOP_LINHA_DO_TEMPO = 10

export function pontosDaTrilha(
  meses: MesLinhaDoTempo[],
  trilha: TrilhaLinhaDoTempo
): PontoTrilha[] {
  return meses.map((mes) => {
    const passagem = trilha.passagens.find(
      (atual) => atual.ano === mes.ano && atual.mes === mes.mes
    )
    const posicao = passagem?.posicao ?? null
    const alturaPercentual =
      posicao === null
        ? ALTURA_MINIMA_PONTO
        : Math.round(
            ((TAMANHO_TOP_LINHA_DO_TEMPO + 1 - posicao) / TAMANHO_TOP_LINHA_DO_TEMPO) * 100
          )
    return {
      chave: `${mes.ano}-${mes.mes}`,
      rotulo: `${String(mes.mes).padStart(2, '0')}/${mes.ano}`,
      posicao,
      alturaPercentual,
    }
  })
}
