import { z } from 'zod'

export const ServicoPlaylistSchema = z.enum(['spotify', 'youtube'])
export type ServicoPlaylist = z.infer<typeof ServicoPlaylistSchema>

export const DecisaoPlaylistDestinoSchema = z.enum([
  'criar_nova',
  'atualizar_origem_para_destino',
  'atualizar_destino_para_origem',
  'so_vincular',
])
export type DecisaoPlaylistDestino = z.infer<typeof DecisaoPlaylistDestinoSchema>

export const StatusItemTransferenciaSchema = z.enum([
  'pendente',
  'casada',
  'duvidosa',
  'nao_encontrada',
  'ignorada',
  'transferida',
  'falha',
])
export type StatusItemTransferencia = z.infer<typeof StatusItemTransferenciaSchema>

export const StatusTransferenciaSchema = z.enum([
  'rascunho',
  'casando',
  'previa',
  'executando',
  'pausada_cota',
  'concluida',
  'falha',
])
export type StatusTransferencia = z.infer<typeof StatusTransferenciaSchema>

export const StatusContaYoutubeOAuthSchema = z.object({
  conectada: z.boolean(),
  email: z.string().nullable(),
  nomeCanal: z.string().nullable(),
  canalId: z.string().nullable(),
  atualizadoEm: z.string().optional().nullable(),
})
export type StatusContaYoutubeOAuth = z.infer<typeof StatusContaYoutubeOAuthSchema>

export const UrlYoutubeOAuthSchema = z.object({
  url: z.string(),
})
export type UrlYoutubeOAuth = z.infer<typeof UrlYoutubeOAuthSchema>

export const DesconectarYoutubeOAuthSchema = z.object({
  desconectado: z.boolean(),
})
export type DesconectarYoutubeOAuth = z.infer<typeof DesconectarYoutubeOAuthSchema>

export const PlaylistResumoSchema = z.object({
  id: z.string(),
  nome: z.string(),
  totalFaixas: z.number(),
  urlCapa: z.string().nullable(),
  snapshotId: z.string().nullable(),
  dono: z.string().nullable(),
})
export type PlaylistResumo = z.infer<typeof PlaylistResumoSchema>

export const ListaPlaylistsSchema = z.object({
  itens: z.array(PlaylistResumoSchema),
  total: z.number(),
})
export type ListaPlaylists = z.infer<typeof ListaPlaylistsSchema>

export const ParPlaylistSchema = z.object({
  origem: PlaylistResumoSchema,
  destino: PlaylistResumoSchema.nullable(),
  similaridade: z.number(),
})
export type ParPlaylist = z.infer<typeof ParPlaylistSchema>

export const ListaParesSchema = z.array(ParPlaylistSchema)
export type ListaPares = z.infer<typeof ListaParesSchema>

export const TransferenciaResumoSchema = z.object({
  uuid: z.string(),
  origem: ServicoPlaylistSchema,
  destino: ServicoPlaylistSchema,
  status: StatusTransferenciaSchema,
  statusDescricao: z.string(),
  totalFaixas: z.number(),
  totalCasadas: z.number(),
  totalDuvidosas: z.number(),
  totalNaoEncontradas: z.number(),
  totalTransferidas: z.number(),
  totalFalhas: z.number(),
  mensagemErro: z.string().nullable(),
  criadoEm: z.string(),
  atualizadoEm: z.string(),
})
export type TransferenciaResumo = z.infer<typeof TransferenciaResumoSchema>

export const PlaylistSelecionadaSchema = z.object({
  uuid: z.string(),
  idExternoOrigem: z.string(),
  nomeOrigem: z.string(),
  totalFaixasOrigem: z.number(),
  urlCapaOrigem: z.string().nullable(),
  snapshotIdOrigem: z.string().nullable(),
  idExternoDestinoExistente: z.string().nullable(),
  nomeDestinoExistente: z.string().nullable(),
  decisao: DecisaoPlaylistDestinoSchema,
  idExternoDestinoFinal: z.string().nullable(),
  progressoFaixas: z.number(),
})
export type PlaylistSelecionada = z.infer<typeof PlaylistSelecionadaSchema>

export const ItemTransferenciaSchema = z.object({
  uuid: z.string(),
  playlistSelecionadaUuid: z.string().nullable().optional(),
  ordem: z.number(),
  idExternoOrigem: z.string(),
  tituloOrigem: z.string(),
  artistasOrigem: z.string().nullable(),
  duracaoMsOrigem: z.number().nullable().optional(),
  urlCapaOrigem: z.string().nullable(),
  idExternoDestino: z.string().nullable(),
  tituloDestino: z.string().nullable(),
  artistasDestino: z.string().nullable(),
  pontuacao: z.number().nullable().optional(),
  status: StatusItemTransferenciaSchema,
  statusDescricao: z.string(),
  musicaCatalogoUuid: z.string().nullable().optional(),
})
export type ItemTransferencia = z.infer<typeof ItemTransferenciaSchema>

export const TransferenciaDetalheSchema = TransferenciaResumoSchema.extend({
  playlists: z.array(PlaylistSelecionadaSchema),
  itens: z.array(ItemTransferenciaSchema),
  itensResumo: z.boolean().optional().default(false),
})
export type TransferenciaDetalhe = z.infer<typeof TransferenciaDetalheSchema>

export const ListaTransferenciasSchema = z.object({
  itens: z.array(TransferenciaResumoSchema),
})
export type ListaTransferencias = z.infer<typeof ListaTransferenciasSchema>

export const VinculoPlaylistSchema = z.object({
  uuid: z.string(),
  idSpotify: z.string(),
  nomeSpotify: z.string(),
  snapshotIdSpotify: z.string().nullable(),
  idYoutube: z.string(),
  nomeYoutube: z.string(),
  modo: z.string(),
  modoDescricao: z.string(),
  ativo: z.boolean(),
  ultimaSincronizacaoEm: z.string().nullable(),
  criadoEm: z.string(),
  atualizadoEm: z.string(),
})
export type VinculoPlaylist = z.infer<typeof VinculoPlaylistSchema>

export const ListaVinculosSchema = z.array(VinculoPlaylistSchema)
export type ListaVinculos = z.infer<typeof ListaVinculosSchema>

export const PlaylistInicioSchema = z.object({
  idExterno: z.string(),
  decisao: DecisaoPlaylistDestinoSchema.optional(),
  idDestinoExistente: z.string().optional().nullable(),
})
export type PlaylistInicio = z.infer<typeof PlaylistInicioSchema>

export const IniciarTransferenciaPayloadSchema = z.object({
  origem: ServicoPlaylistSchema,
  destino: ServicoPlaylistSchema,
  playlists: z.array(PlaylistInicioSchema).min(1),
})
export type IniciarTransferenciaPayload = z.infer<typeof IniciarTransferenciaPayloadSchema>

export const ItemConfirmacaoPreviaSchema = z.object({
  uuid: z.string(),
  status: z.enum(['casada', 'duvidosa', 'nao_encontrada', 'ignorada']),
  idExternoDestino: z.string().optional().nullable(),
  tituloDestino: z.string().optional().nullable(),
  artistasDestino: z.string().optional().nullable(),
})
export type ItemConfirmacaoPrevia = z.infer<typeof ItemConfirmacaoPreviaSchema>

export const ConfirmarPreviaPayloadSchema = z.object({
  itens: z.array(ItemConfirmacaoPreviaSchema).optional().default([]),
  uuidsIgnorados: z.array(z.string()).optional().default([]),
})
export type ConfirmarPreviaPayload = z.infer<typeof ConfirmarPreviaPayloadSchema>
