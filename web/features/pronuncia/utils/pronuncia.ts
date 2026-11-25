import axios from 'axios'
import type {
  ConsultaDetalhe,
  DirecaoTraducao,
  ItemSentenca,
  ModoPronuncia,
  PalavraPronunciada,
  SentencaPronunciada,
} from '../types'

export const LIMITE_CARACTERES = 3000

export const OPCOES_DIRECAO: Array<{ valor: DirecaoTraducao; rotulo: string; descricao: string }> =
  [
    {
      valor: 'auto',
      rotulo: 'Automático',
      descricao: 'Detecta se você escreveu em português ou inglês',
    },
    { valor: 'pt_en', rotulo: 'PT → EN', descricao: 'Português para inglês' },
    { valor: 'en_pt', rotulo: 'EN → PT', descricao: 'Inglês para português' },
  ]

export const OPCOES_MODO: Array<{ valor: ModoPronuncia; rotulo: string; descricao: string }> = [
  { valor: 'clara', rotulo: 'Clara', descricao: 'Cada palavra pronunciada por inteiro' },
  {
    valor: 'natural',
    rotulo: 'Fala natural',
    descricao: 'Como o nativo fala rápido: palavras curtas reduzidas e emendadas',
  },
]

export const FRASES_RAPIDAS = [
  'eu não sei',
  'obrigado, de nada',
  'qual é o seu nome?',
  'onde fica o banheiro?',
  'quanto custa isso?',
  'pode repetir, por favor?',
  'prazer em te conhecer',
  'estou só olhando',
]

export const VELOCIDADE_NORMAL = 1
export const VELOCIDADE_LENTA = 0.7

export function extrairMensagemErroApi(erro: unknown, padrao: string): string {
  if (axios.isAxiosError(erro)) {
    const corpo = erro.response?.data as
      | { error?: string; details?: Record<string, string> }
      | undefined
    const detalhe = corpo?.details ? Object.values(corpo.details)[0] : undefined
    return detalhe || corpo?.error || padrao
  }
  return padrao
}

export function isPalavra(item: ItemSentenca): item is PalavraPronunciada & { tipo: 'palavra' } {
  return item.tipo === 'palavra'
}

export function palavrasDaSentenca(sentenca: SentencaPronunciada): PalavraPronunciada[] {
  return sentenca.itens.filter(isPalavra)
}

export function pronunciaNoModo(consulta: ConsultaDetalhe, modo: ModoPronuncia): string {
  return modo === 'natural' ? consulta.analise.falaNatural : consulta.analise.pronuncia
}

export function contarCaracteres(texto: string): number {
  return texto.trim().length
}

export function formatarNumero(valor: number): string {
  return valor.toLocaleString('pt-BR')
}

export function percentualUso(usados: number, limite: number): number {
  if (limite <= 0) return 0
  return Math.min(100, Math.round((usados / limite) * 100))
}

export function formatarDataCurta(iso: string): string {
  const data = new Date(iso)
  return data.toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export interface TrechoTexto {
  texto: string
  inicio: number
  palavra: boolean
}

export function dividirEmTrechos(texto: string): TrechoTexto[] {
  const trechos: TrechoTexto[] = []
  const expressao = /[\p{L}\p{N}'’]+|[^\p{L}\p{N}'’]+/gu
  for (const encontrado of texto.matchAll(expressao)) {
    const valor = encontrado[0]
    trechos.push({
      texto: valor,
      inicio: encontrado.index ?? 0,
      palavra: /[\p{L}\p{N}]/u.test(valor),
    })
  }
  return trechos
}

export function isTrechoAtivo(trecho: TrechoTexto, indiceFala: number | null): boolean {
  if (indiceFala === null || !trecho.palavra) return false
  return indiceFala >= trecho.inicio && indiceFala < trecho.inicio + trecho.texto.length
}

export function normalizarPronunciaDigitada(valor: string): string {
  return valor.trim().replace(/\s+/g, '-')
}

export function chavesUnicasDaAnalise(consulta: ConsultaDetalhe): string[] {
  const chaves = consulta.analise.sentencas.flatMap((sentenca) =>
    palavrasDaSentenca(sentenca).map((palavra) => palavra.chave)
  )
  return [...new Set(chaves)]
}

export const PERCENTUAL_LETRA_OUTRO_IDIOMA = 25
export const PASSO_AJUSTE_SINCRONIA_MS = 500
export const LIMITE_AJUSTE_SINCRONIA_MS = 10_000

export function indiceLinhaAtiva(
  linhas: Array<{ inicioMs: number | null }>,
  posicaoMs: number
): number {
  let ativa = -1
  for (let indice = 0; indice < linhas.length; indice++) {
    const inicio = linhas[indice]?.inicioMs
    if (inicio === null || inicio === undefined || inicio > posicaoMs) break
    ativa = indice
  }
  return ativa
}

export function formatarTempoMusica(ms: number): string {
  const totalSegundos = Math.floor(ms / 1000)
  const minutos = Math.floor(totalSegundos / 60)
  const segundos = totalSegundos % 60
  return `${minutos}:${String(segundos).padStart(2, '0')}`
}

export function formatarAjusteSincronia(ms: number): string {
  if (ms === 0) return 'Sincronia: no tempo'
  const segundos = (Math.abs(ms) / 1000).toLocaleString('pt-BR', { maximumFractionDigits: 1 })
  return ms > 0 ? `Letra adiantada ${segundos}s` : `Letra atrasada ${segundos}s`
}
