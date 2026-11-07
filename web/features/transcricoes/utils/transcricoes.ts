import axios from 'axios'
import type {
  AparenciaStatusTranscricao,
  FiltroListagemTranscricao,
  IdiomaTranscricao,
  PaginaTranscricoes,
  ParteTextoDestacado,
  SegmentoTranscricao,
  StatusTranscricao,
  TranscricaoResumo,
} from '../types'

export const TRANSCRICOES_POR_PAGINA = 60
export const INTERVALO_ATUALIZACAO_LISTA_MS = 2000
export const INTERVALO_ATUALIZACAO_DETALHE_MS = 1500
export const INTERVALO_ATUALIZACAO_OCIOSO_MS = 30000
export const DIAS_RETENCAO_AUDIO = 7

const MILISSEGUNDOS_POR_HORA = 3_600_000
const HORAS_POR_DIA = 24
const PERCENTUAL_TOTAL = 100
const PERCENTUAL_VALIDADE_CRITICA = 25
const LIMITE_RESUMO_ERRO = 200
const PADRAO_ESCAPE_REGEX = /[.*+?^${}()|[\]\\]/g

const APARENCIA_STATUS: Record<StatusTranscricao, AparenciaStatusTranscricao> = {
  na_fila: { rotulo: 'Na fila', paleta: 'gray' },
  transcrevendo: { rotulo: 'Transcrevendo', paleta: 'brand' },
  concluida: { rotulo: 'Pronta', paleta: 'green' },
  erro: { rotulo: 'Erro', paleta: 'red' },
}

export const OPCOES_IDIOMA: { valor: IdiomaTranscricao; rotulo: string; bandeira: string }[] = [
  { valor: 'auto', rotulo: 'Detectar idioma', bandeira: '✨' },
  { valor: 'pt', rotulo: 'Português', bandeira: '🇧🇷' },
  { valor: 'en', rotulo: 'Inglês', bandeira: '🇺🇸' },
  { valor: 'es', rotulo: 'Espanhol', bandeira: '🇪🇸' },
]

const NOMES_IDIOMAS: Record<string, string> = {
  pt: 'Português',
  en: 'Inglês',
  es: 'Espanhol',
  fr: 'Francês',
  it: 'Italiano',
  de: 'Alemão',
  ja: 'Japonês',
}

export const OPCOES_FILTRO: { valor: FiltroListagemTranscricao; rotulo: string }[] = [
  { valor: 'todas', rotulo: 'Todas' },
  { valor: 'em_andamento', rotulo: 'Em andamento' },
  { valor: 'concluidas', rotulo: 'Prontas' },
  { valor: 'favoritas', rotulo: 'Favoritas' },
  { valor: 'com_erro', rotulo: 'Com erro' },
]

export function obterAparenciaStatus(status: StatusTranscricao): AparenciaStatusTranscricao {
  return APARENCIA_STATUS[status]
}

export function nomeIdioma(transcricao: TranscricaoResumo): string | null {
  const codigo = transcricao.idiomaDetectado ?? transcricao.idiomaSolicitado
  if (codigo === 'auto') return null
  return NOMES_IDIOMAS[codigo] ?? codigo.toUpperCase()
}

export function isIdiomaTranscricao(valor: string): valor is IdiomaTranscricao {
  return OPCOES_IDIOMA.some((opcao) => opcao.valor === valor)
}

export function isPaginaComTranscricaoEmAndamento(pagina: PaginaTranscricoes | undefined): boolean {
  return pagina?.transcricoes.some((transcricao) => transcricao.isEmAndamento) ?? false
}

export function encontrarTranscricoesConcluidasAgora(
  anterior: PaginaTranscricoes | undefined,
  atual: PaginaTranscricoes
): TranscricaoResumo[] {
  if (!anterior) return []
  const emAndamentoAntes = new Set(
    anterior.transcricoes.filter((item) => item.isEmAndamento).map((item) => item.uuid)
  )
  return atual.transcricoes.filter((item) => emAndamentoAntes.has(item.uuid) && !item.isEmAndamento)
}

export function encontrarIndiceSegmentoAtual(
  segmentos: SegmentoTranscricao[],
  tempoSegundos: number
): number {
  let inicio = 0
  let fim = segmentos.length - 1
  let encontrado = -1
  while (inicio <= fim) {
    const meio = Math.floor((inicio + fim) / 2)
    if ((segmentos[meio]?.inicio ?? Number.POSITIVE_INFINITY) <= tempoSegundos) {
      encontrado = meio
      inicio = meio + 1
    } else {
      fim = meio - 1
    }
  }
  return encontrado
}

export function dividirTextoDestacado(texto: string, termo: string): ParteTextoDestacado[] {
  const termoLimpo = termo.trim()
  if (!termoLimpo) return [{ texto, destaque: false }]
  const expressao = new RegExp(`(${termoLimpo.replace(PADRAO_ESCAPE_REGEX, '\\$&')})`, 'gi')
  return texto
    .split(expressao)
    .filter((parte) => parte.length > 0)
    .map((parte) => ({ texto: parte, destaque: parte.toLowerCase() === termoLimpo.toLowerCase() }))
}

export function contarOcorrencias(segmentos: SegmentoTranscricao[], termo: string): number {
  const termoLimpo = termo.trim().toLowerCase()
  if (!termoLimpo) return 0
  return segmentos.reduce(
    (total, segmento) => total + segmento.texto.toLowerCase().split(termoLimpo).length - 1,
    0
  )
}

export function calcularPercentualValidadeAudio(
  transcricao: TranscricaoResumo,
  agora: number
): number | null {
  if (!transcricao.audioExpiraEm) return null
  const restanteMs = new Date(transcricao.audioExpiraEm).getTime() - agora
  const totalMs = DIAS_RETENCAO_AUDIO * HORAS_POR_DIA * MILISSEGUNDOS_POR_HORA
  return Math.max(0, Math.min(PERCENTUAL_TOTAL, (restanteMs / totalMs) * PERCENTUAL_TOTAL))
}

export function isValidadeCritica(percentual: number): boolean {
  return percentual <= PERCENTUAL_VALIDADE_CRITICA
}

export function descreverValidadeAudio(transcricao: TranscricaoResumo, agora: number): string {
  if (transcricao.audioExpiradoEm || !transcricao.isAudioDisponivel) {
    return 'Áudio apagado, o texto continua salvo'
  }
  if (!transcricao.audioExpiraEm) return ''
  const horasRestantes = Math.max(
    0,
    Math.floor((new Date(transcricao.audioExpiraEm).getTime() - agora) / MILISSEGUNDOS_POR_HORA)
  )
  if (horasRestantes < 1) return 'Áudio será apagado em instantes'
  if (horasRestantes < HORAS_POR_DIA) return `Áudio apagado em ${horasRestantes} h`
  const dias = Math.floor(horasRestantes / HORAS_POR_DIA)
  return `Áudio guardado por mais ${dias} ${dias === 1 ? 'dia' : 'dias'}`
}

export function resumirErro(erroMotivo: string | null): string | null {
  if (!erroMotivo) return null
  return erroMotivo.length > LIMITE_RESUMO_ERRO
    ? `${erroMotivo.slice(0, LIMITE_RESUMO_ERRO)}…`
    : erroMotivo
}

export function extrairMensagemErroApi(erro: unknown, padrao: string): string {
  if (axios.isAxiosError(erro)) {
    const corpo = erro.response?.data as { error?: string } | undefined
    return corpo?.error || padrao
  }
  return padrao
}

export function tokenCorStatus(paleta: AparenciaStatusTranscricao['paleta'], tom: number): string {
  const escala = paleta === 'gray' ? 'grey' : paleta
  return `cirqueira.${escala}.${tom}`
}

export function proximaVelocidade(atual: number, velocidades: readonly number[]): number {
  const indice = velocidades.indexOf(atual)
  return velocidades[(indice + 1) % velocidades.length] ?? atual
}

export function rolarAteTrechoNoContainer(container: HTMLElement | null, indice: number): void {
  const elemento = container?.querySelector<HTMLElement>(`[data-trecho="${indice}"]`)
  if (!container || !elemento) return
  const deslocamento = elemento.getBoundingClientRect().top - container.getBoundingClientRect().top
  container.scrollTo({
    top: container.scrollTop + deslocamento - container.clientHeight / 3,
    behavior: 'smooth',
  })
}
