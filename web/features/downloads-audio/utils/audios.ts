import {
  type PlataformaDetectada,
  identificarPlataforma,
} from '@/features/downloads-video/utils/plataformaVideo'
import axios from 'axios'
import { Globe, Instagram, type LucideIcon, Video, Youtube } from 'lucide-react'
import type {
  AparenciaStatusAudio,
  Audio,
  ContagemStatusAudios,
  PaginaAudios,
  StatusAudio,
} from '../types'

export const AUDIOS_POR_PAGINA = 20
export const INTERVALO_ATUALIZACAO_AUDIOS_MS = 2500

const MILISSEGUNDOS_POR_HORA = 3_600_000
const HORAS_POR_DIA = 24
const SEGUNDOS_POR_MINUTO = 60
const SEGUNDOS_POR_HORA = 3600
const LIMITE_RESUMO_ERRO = 180
const DIAS_RETENCAO_AUDIO = 7
const PERCENTUAL_TOTAL = 100
const PERCENTUAL_VALIDADE_CRITICA = 30

const APARENCIA_STATUS_AUDIO: Record<StatusAudio, AparenciaStatusAudio> = {
  pendente: { rotulo: 'Na fila', paleta: 'gray' },
  baixando: { rotulo: 'Convertendo', paleta: 'amber' },
  disponivel: { rotulo: 'Pronto', paleta: 'green' },
  erro: { rotulo: 'Erro', paleta: 'red' },
  expirado: { rotulo: 'Expirado', paleta: 'gray' },
}

export const PLATAFORMAS_SUPORTADAS_AUDIO: { nome: string; icone: LucideIcon; paleta: string }[] = [
  { nome: 'YouTube', icone: Youtube, paleta: 'red' },
  { nome: 'TikTok', icone: Video, paleta: 'cyan' },
  { nome: 'Instagram', icone: Instagram, paleta: 'pink' },
  { nome: 'X / Twitter', icone: Globe, paleta: 'blue' },
]

export function obterAparenciaStatusAudio(status: StatusAudio): AparenciaStatusAudio {
  return APARENCIA_STATUS_AUDIO[status]
}

export function isPaginaComAudioEmProcessamento(pagina: PaginaAudios | undefined): boolean {
  return pagina?.audios.some((audio) => audio.isEmProcessamento) ?? false
}

export function nomeExibicaoAudio(audio: Audio): string {
  if (audio.titulo) return audio.titulo
  try {
    const url = new URL(audio.url)
    return `${url.hostname.replace(/^www\./, '')}${url.pathname}`
  } catch {
    return audio.url
  }
}

function completarDoisDigitos(valor: number): string {
  return String(valor).padStart(2, '0')
}

export function formatarDuracaoAudio(segundos: number | null): string | null {
  if (segundos === null || segundos <= 0) return null
  const horas = Math.floor(segundos / SEGUNDOS_POR_HORA)
  const minutos = Math.floor((segundos % SEGUNDOS_POR_HORA) / SEGUNDOS_POR_MINUTO)
  const restante = completarDoisDigitos(segundos % SEGUNDOS_POR_MINUTO)
  if (horas > 0) return `${horas}:${completarDoisDigitos(minutos)}:${restante}`
  return `${minutos}:${restante}`
}

export function formatarTamanhoAudio(bytes: number | null): string | null {
  if (!bytes || bytes <= 0) return null
  const kb = bytes / 1024
  if (kb < 1024) return `${kb.toFixed(0)} KB`
  return `${(kb / 1024).toFixed(1)} MB`
}

export function descreverDetalhesAudio(audio: Audio): string {
  return [
    audio.autor,
    formatarDuracaoAudio(audio.duracaoSegundos),
    formatarTamanhoAudio(audio.tamanhoBytes),
  ]
    .filter(Boolean)
    .join(' • ')
}

export function descreverValidadeAudio(audio: Audio, agora: number): string | null {
  if (audio.status === 'expirado') return 'Arquivo removido após 7 dias'
  if (!audio.expiraEm) return null

  const horasRestantes = (new Date(audio.expiraEm).getTime() - agora) / MILISSEGUNDOS_POR_HORA
  if (horasRestantes <= 1) return 'Expira em instantes'
  if (horasRestantes < HORAS_POR_DIA) return `Expira em ${Math.ceil(horasRestantes)} h`
  const dias = Math.ceil(horasRestantes / HORAS_POR_DIA)
  return dias === 1 ? 'Expira amanhã' : `Expira em ${dias} dias`
}

export function calcularPercentualValidadeAudio(audio: Audio, agora: number): number | null {
  if (!audio.isDisponivel || !audio.expiraEm) return null
  const horasRestantes = (new Date(audio.expiraEm).getTime() - agora) / MILISSEGUNDOS_POR_HORA
  const horasTotais = DIAS_RETENCAO_AUDIO * HORAS_POR_DIA
  const percentual = (horasRestantes / horasTotais) * PERCENTUAL_TOTAL
  return Math.min(PERCENTUAL_TOTAL, Math.max(0, percentual))
}

export function isValidadeCritica(percentual: number): boolean {
  return percentual <= PERCENTUAL_VALIDADE_CRITICA
}

export function contarAudiosPorStatus(pagina: PaginaAudios | undefined): ContagemStatusAudios {
  const audios = pagina?.audios ?? []
  return {
    total: pagina?.total ?? 0,
    prontos: audios.filter((audio) => audio.isDisponivel).length,
    emProcessamento: audios.filter((audio) => audio.isEmProcessamento).length,
    comErro: audios.filter((audio) => audio.status === 'erro').length,
  }
}

export function identificarPlataformaAudio(audio: Audio): PlataformaDetectada | null {
  const plataforma = identificarPlataforma(audio.url)
  return plataforma?.conhecido ? plataforma : null
}

export function resumirErroAudio(erroMotivo: string | null): string | null {
  if (!erroMotivo) return null
  if (erroMotivo.length <= LIMITE_RESUMO_ERRO) return erroMotivo
  return `${erroMotivo.substring(0, LIMITE_RESUMO_ERRO)}…`
}

export function totalDePaginas(pagina: PaginaAudios | undefined): number {
  if (!pagina || pagina.total === 0) return 1
  return Math.ceil(pagina.total / pagina.porPagina)
}

export function extrairMensagemErroApi(erro: unknown, padrao: string): string {
  if (axios.isAxiosError(erro)) {
    const corpo = erro.response?.data as { error?: string } | undefined
    return corpo?.error || padrao
  }
  return padrao
}

export function isCampoDeTexto(alvo: EventTarget | null): boolean {
  return alvo instanceof HTMLInputElement || alvo instanceof HTMLTextAreaElement
}
