import { formatarHoraBrasilia } from '@/shared/utils/formatarData'
import axios from 'axios'

export function extrairMensagemErroApi(erro: unknown, padrao: string): string {
  if (axios.isAxiosError(erro)) {
    const corpo = erro.response?.data as { error?: string; message?: string } | undefined
    return corpo?.error || corpo?.message || padrao
  }
  return padrao
}

export function mensagemBloqueioSpotify(bloqueadoAte: string): string {
  return `O Spotify bloqueou o app até ${formatarHoraBrasilia(bloqueadoAte)} (horário de Brasília). A coleta está pausada. O Spotify só guarda as últimas 50 músicas, então o que passar disso nesse período pode não ser coletado.`
}
