import axios from 'axios'
import type { RegistroEnvioGoogleFotos, StatusEnvioGoogleFotos } from '../types'

export interface AparenciaStatusEnvio {
  rotulo: string
  paleta: 'green' | 'teal' | 'red' | 'amber'
}

const APARENCIA_STATUS_ENVIO: Record<StatusEnvioGoogleFotos, AparenciaStatusEnvio> = {
  enviado: { rotulo: 'Enviado', paleta: 'green' },
  reaproveitado: { rotulo: 'Já existia', paleta: 'teal' },
  falha: { rotulo: 'Falha', paleta: 'red' },
  enviando: { rotulo: 'Enviando', paleta: 'amber' },
}

export const FILTROS_STATUS_ENVIO: { valor: StatusEnvioGoogleFotos | null; rotulo: string }[] = [
  { valor: null, rotulo: 'Todos' },
  { valor: 'enviado', rotulo: 'Enviados' },
  { valor: 'falha', rotulo: 'Falhas' },
  { valor: 'reaproveitado', rotulo: 'Já existiam' },
  { valor: 'enviando', rotulo: 'Enviando' },
]

const LIMITE_RESUMO_ERRO = 160

export function obterAparenciaStatusEnvio(status: StatusEnvioGoogleFotos): AparenciaStatusEnvio {
  return APARENCIA_STATUS_ENVIO[status]
}

export function formatarDuracaoEnvio(duracaoMs: number | null): string {
  if (duracaoMs === null) return '—'
  if (duracaoMs < 1000) return `${duracaoMs} ms`
  const segundos = duracaoMs / 1000
  if (segundos < 60) return `${segundos.toFixed(1)} s`
  return `${Math.floor(segundos / 60)} min ${Math.round(segundos % 60)} s`
}

export function formatarTamanhoArquivo(bytes: number | null): string {
  if (!bytes || bytes <= 0) return '—'
  const kb = bytes / 1024
  if (kb < 1024) return `${kb.toFixed(0)} KB`
  const mb = kb / 1024
  if (mb < 1024) return `${mb.toFixed(1)} MB`
  return `${(mb / 1024).toFixed(2)} GB`
}

export function formatarDataHoraCurta(dataIso: string | null): string {
  if (!dataIso) return '—'
  const data = new Date(dataIso)
  if (Number.isNaN(data.getTime())) return dataIso
  return data.toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function nomeExibicaoEnvio(registro: RegistroEnvioGoogleFotos): string {
  return registro.nomeArquivo || `Mídia ${registro.mediaItemUuid.substring(0, 8)}`
}

export function resumirErroEnvio(erroMotivo: string | null): string {
  if (!erroMotivo) return ''
  if (erroMotivo.includes('invalid_grant')) {
    return 'A conta do Google foi desconectada ou o acesso expirou. Reconecte a conta e reenvie.'
  }
  if (erroMotivo.length <= LIMITE_RESUMO_ERRO) return erroMotivo
  return `${erroMotivo.substring(0, LIMITE_RESUMO_ERRO)}…`
}

export function envioFalhou(registro: RegistroEnvioGoogleFotos): boolean {
  return registro.status === 'falha'
}

export function envioEmAndamento(registro: RegistroEnvioGoogleFotos): boolean {
  return registro.status === 'enviando'
}

export function podeReenviarRegistro(registro: RegistroEnvioGoogleFotos): boolean {
  return envioFalhou(registro)
}

export function extrairMensagemErroApi(erro: unknown, padrao: string): string {
  if (axios.isAxiosError(erro)) {
    const corpo = erro.response?.data as { error?: string; message?: string } | undefined
    return corpo?.error || corpo?.message || padrao
  }
  return padrao
}
