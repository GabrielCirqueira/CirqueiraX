import { api } from '@/config/api'
import type { RespostaApi } from '@/shared/types/api'
import { type ListaNotificacoes, ListaNotificacoesSchema } from './types'

const PREFIXO = '/api/v1/notificacoes'

export async function listarNotificacoes(somenteNaoLidas: boolean): Promise<ListaNotificacoes> {
  const { data } = await api.get<RespostaApi<unknown>>(PREFIXO, {
    params: { naoLidas: somenteNaoLidas ? 1 : 0 },
  })
  return ListaNotificacoesSchema.parse(data.data)
}

export async function marcarNotificacoesLidas(uuids: string[]): Promise<void> {
  await api.post(`${PREFIXO}/marcar-lidas`, { uuids })
}
