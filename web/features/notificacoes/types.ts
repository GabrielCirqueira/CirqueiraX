import { z } from 'zod'

export const TipoNotificacaoSchema = z.enum(['melhoria', 'correcao', 'novidade', 'aviso'])

export type TipoNotificacao = z.infer<typeof TipoNotificacaoSchema>

export const NotificacaoSchema = z.object({
  uuid: z.string(),
  tipo: TipoNotificacaoSchema,
  tipoDescricao: z.string(),
  titulo: z.string(),
  mensagem: z.string(),
  lida: z.boolean(),
  lidaEm: z.string().nullable(),
  criadoEm: z.string(),
})

export type Notificacao = z.infer<typeof NotificacaoSchema>

export const ListaNotificacoesSchema = z.object({
  itens: z.array(NotificacaoSchema),
  naoLidas: z.number(),
})

export type ListaNotificacoes = z.infer<typeof ListaNotificacoesSchema>
