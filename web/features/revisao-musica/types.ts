import { z } from 'zod'

export const TipoRevisaoSchema = z.enum([
  'sem_vinculo',
  'ambiguo',
  'compilacao',
  'canal_novo',
  'possivel_duplicata',
  'indisponivel',
])

export type TipoRevisao = z.infer<typeof TipoRevisaoSchema>

export const ArtistaCatalogoSchema = z.object({
  uuid: z.string(),
  nome: z.string(),
  unidoA: z.string().nullable().optional(),
})

export type ArtistaCatalogo = z.infer<typeof ArtistaCatalogoSchema>

export const ComponenteCatalogoSchema = z.object({
  texto: z.string(),
  musicaUuid: z.string().nullable(),
  musicaTitulo: z.string().nullable(),
})

export const MusicaCatalogoSchema = z.object({
  uuid: z.string(),
  titulo: z.string(),
  tipo: z.string(),
  artistas: z.array(ArtistaCatalogoSchema),
  album: z.string().nullable(),
  urlCapa: z.string().nullable(),
  videoOficialId: z.string().nullable(),
  confirmadaManualmente: z.boolean(),
  unidaA: z.string().nullable().optional(),
  componentes: z.array(ComponenteCatalogoSchema).default([]),
})

export type MusicaCatalogo = z.infer<typeof MusicaCatalogoSchema>

export const LeituraIaSchema = z.object({
  titulo: z.string(),
  artistas: z.array(z.string()).default([]),
})

export type LeituraIa = z.infer<typeof LeituraIaSchema>

export const SugestaoIaSchema = z.object({
  tipo: z.string().optional(),
  confianca: z.number().optional(),
  versao: z.string().optional(),
  ambiguo: z.boolean().optional(),
  componentes: z.array(LeituraIaSchema).default([]),
  alternativas: z.array(LeituraIaSchema).default([]),
})

export type SugestaoIa = z.infer<typeof SugestaoIaSchema>

export const VideoRevisaoSchema = z.object({
  uuid: z.string(),
  videoId: z.string(),
  titulo: z.string(),
  canal: z.string(),
  duracaoMs: z.number().nullable(),
  miniatura: z.string(),
  disponivel: z.boolean(),
  status: z.string(),
  statusDescricao: z.string(),
  origemClassificacao: z.string().nullable(),
  confianca: z.number().nullable(),
  tipoVersao: z.string().nullable(),
  sugestaoIa: SugestaoIaSchema.nullable(),
  classificadoEm: z.string().nullable(),
  musica: MusicaCatalogoSchema.nullable(),
})

export type VideoRevisao = z.infer<typeof VideoRevisaoSchema>

export const CanalRevisaoSchema = z.object({
  canal: z.string(),
  total: z.number(),
  exemplo: z.string(),
})

export type CanalRevisao = z.infer<typeof CanalRevisaoSchema>

export const DuplicataRevisaoSchema = z.object({
  musicas: z.tuple([MusicaCatalogoSchema, MusicaCatalogoSchema]),
})

export type DuplicataRevisao = z.infer<typeof DuplicataRevisaoSchema>

export const PaginaRevisaoBrutaSchema = z.object({
  tipo: TipoRevisaoSchema,
  itens: z.array(z.unknown()),
  total: z.number(),
  pagina: z.number(),
  porPagina: z.number(),
})

export interface PaginaRevisao {
  tipo: TipoRevisao
  total: number
  pagina: number
  porPagina: number
  videos: VideoRevisao[]
  canais: CanalRevisao[]
  duplicatas: DuplicataRevisao[]
}

export const ContagensRevisaoSchema = z.record(z.string(), z.number())

export type ContagensRevisao = z.infer<typeof ContagensRevisaoSchema>

export const VideosAfetadosSchema = z.object({ videosAfetados: z.number() })

export type AcaoRevisaoVideo =
  | 'definir_musica'
  | 'definir_mashup'
  | 'nao_musica'
  | 'manter_compilacao'

export type ClassificacaoCanal = 'musica' | 'nao_musica'

export interface ComponenteMashupEntrada {
  titulo: string
  artistas: string[]
}

export interface CorrecaoVideoPayload {
  acao: AcaoRevisaoVideo
  musicaUuid?: string
  titulo?: string
  artistas?: string[]
  versao?: string
  componentes?: ComponenteMashupEntrada[]
}
