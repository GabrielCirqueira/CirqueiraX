import { z } from 'zod'
import type { TocandoAgoraExtensao } from '../types'

const ORIGEM_EXTENSAO = 'cirqueirax-extensao'
const ORIGEM_SITE = 'cirqueirax-site'
const TIPO_TOCANDO_AGORA = 'tocando-agora'
const TIPO_PEDIR_ESTADO = 'estado-agora'
const VALIDADE_TEMPO_REAL_MS = 15_000

const EstadoTempoRealSchema = z
  .object({
    videoId: z.string().min(1),
    titulo: z.string(),
    canal: z.string().default(''),
    urlCapa: z.string().nullable().default(null),
    duracaoMs: z.number().nullable().default(null),
    posicaoMs: z.number(),
    tocando: z.boolean(),
    lidoEmMs: z.number(),
  })
  .nullable()

export type EstadoTempoRealExtensao = z.infer<typeof EstadoTempoRealSchema>

export interface RegistroTempoRealExtensao {
  estado: EstadoTempoRealExtensao
  recebidoEmMs: number
}

let registroAtual: RegistroTempoRealExtensao | null = null
let iniciado = false
const ouvintes = new Set<() => void>()

function aoReceberMensagem(evento: MessageEvent) {
  if (evento.source !== window || evento.origin !== window.location.origin) return
  const dados = evento.data
  if (dados?.origem !== ORIGEM_EXTENSAO || dados.tipo !== TIPO_TOCANDO_AGORA) return
  const resultado = EstadoTempoRealSchema.safeParse(dados.estado ?? null)
  if (!resultado.success) return
  registroAtual = { estado: resultado.data, recebidoEmMs: Date.now() }
  for (const ouvinte of ouvintes) ouvinte()
}

function iniciar() {
  if (iniciado || typeof window === 'undefined') return
  iniciado = true
  window.addEventListener('message', aoReceberMensagem)
  window.postMessage({ origem: ORIGEM_SITE, tipo: TIPO_PEDIR_ESTADO }, window.location.origin)
}

export function assinarTempoRealExtensao(ouvinte: () => void): () => void {
  iniciar()
  ouvintes.add(ouvinte)
  return () => {
    ouvintes.delete(ouvinte)
  }
}

export function lerTempoRealExtensao(): RegistroTempoRealExtensao | null {
  return registroAtual
}

export function tempoRealRecente(
  registro: RegistroTempoRealExtensao | null,
  agora: number
): registro is RegistroTempoRealExtensao {
  return registro !== null && agora - registro.recebidoEmMs <= VALIDADE_TEMPO_REAL_MS
}

export function videoTempoRealDiferente(
  registro: RegistroTempoRealExtensao | null,
  videoIdServidor: string | undefined,
  agora: number
): boolean {
  if (!tempoRealRecente(registro, agora) || !registro.estado) return false
  return registro.estado.videoId !== videoIdServidor
}

export function mesclarTocandoAgora(
  servidor: TocandoAgoraExtensao | null | undefined,
  registro: RegistroTempoRealExtensao | null,
  agora: number
): TocandoAgoraExtensao | null {
  if (!tempoRealRecente(registro, agora)) return servidor ?? null
  const estado = registro.estado
  if (!estado) return null

  const lidoEm = new Date(estado.lidoEmMs).toISOString()
  const atualizadoEm = new Date(registro.recebidoEmMs).toISOString()
  const tempoReal = {
    pausada: !estado.tocando,
    posicaoMs: estado.posicaoMs,
    posicaoEm: lidoEm,
    atualizadoEm,
  }

  if (servidor && servidor.videoId === estado.videoId) {
    return { ...servidor, ...tempoReal, duracaoMs: servidor.duracaoMs ?? estado.duracaoMs }
  }

  return {
    titulo: estado.titulo,
    canal: estado.canal,
    artistas: estado.canal ? [estado.canal] : [],
    album: null,
    urlCapa: estado.urlCapa,
    videoId: estado.videoId,
    identificada: false,
    inicioEm: lidoEm,
    msOuvidos: 0,
    duracaoMs: estado.duracaoMs,
    vezesOuvida: 0,
    primeiraVezEm: null,
    ...tempoReal,
  }
}
