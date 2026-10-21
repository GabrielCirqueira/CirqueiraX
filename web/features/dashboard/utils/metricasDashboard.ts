import type {
  CategoriaMetrica,
  MetricasVideosDashboard,
  MidiaRecenteDashboard,
  OrigemMedia,
  ResumoDashboard,
  StatusMediaItem,
} from '../types'

export type TomMetrica = 'neutro' | 'sucesso' | 'alerta' | 'erro'

export const COR_TOKEN: Record<'marca' | 'azul' | 'ambar' | 'roxo' | 'ciano', string> = {
  marca: 'var(--chakra-colors-cirqueira-brand-500)',
  azul: 'var(--chakra-colors-cirqueira-blue-500)',
  ambar: 'var(--chakra-colors-cirqueira-amber-500)',
  roxo: 'var(--chakra-colors-cirqueira-purple-500)',
  ciano: 'var(--chakra-colors-cirqueira-cyan-500)',
}

export const ROTULO_ORIGEM: Record<OrigemMedia, string> = {
  print_empresa: 'Prints Empresa',
  print_pessoal: 'Prints Celular',
  download: 'Downloads de Vídeo',
  bot_telegram: 'Telegram',
  manual: 'Upload Manual',
}

const COR_ORIGEM: Record<OrigemMedia, string> = {
  print_empresa: COR_TOKEN.azul,
  print_pessoal: COR_TOKEN.marca,
  download: COR_TOKEN.ambar,
  bot_telegram: COR_TOKEN.ciano,
  manual: COR_TOKEN.roxo,
}

const STATUS_CONCLUIDOS: StatusMediaItem[] = ['concluido', 'distribuido_local']

const STATUS_EM_PROCESSAMENTO: StatusMediaItem[] = [
  'baixando',
  'recebido',
  'em_fila',
  'classificado',
  'distribuindo',
  'enviando_google_fotos',
]

export const STATUS_MIDIA: Record<StatusMediaItem, { rotulo: string; tom: TomMetrica }> = {
  concluido: { rotulo: 'Concluído', tom: 'sucesso' },
  distribuido_local: { rotulo: 'Distribuído', tom: 'sucesso' },
  sem_categoria: { rotulo: 'Sem categoria', tom: 'alerta' },
  classificado: { rotulo: 'Classificado', tom: 'neutro' },
  distribuindo: { rotulo: 'Distribuindo', tom: 'neutro' },
  baixando: { rotulo: 'Baixando', tom: 'neutro' },
  recebido: { rotulo: 'Recebido', tom: 'neutro' },
  em_fila: { rotulo: 'Em fila', tom: 'neutro' },
  enviando_google_fotos: { rotulo: 'Enviando backup', tom: 'neutro' },
  erro: { rotulo: 'Falha', tom: 'erro' },
  arquivo_removido: { rotulo: 'Arquivo removido', tom: 'neutro' },
  arquivo_expurgado: { rotulo: 'Arquivo removido', tom: 'neutro' },
}

const PALETA_TOM: Record<TomMetrica, string> = {
  neutro: 'gray',
  sucesso: 'green',
  alerta: 'amber',
  erro: 'red',
}

const COR_TEXTO_TOM: Record<TomMetrica, string> = {
  neutro: 'fg',
  sucesso: 'cirqueira.green.500',
  alerta: 'cirqueira.amber.500',
  erro: 'cirqueira.red.500',
}

const BYTES_POR_MEGABYTE = 1024 * 1024

export interface ResumoPipeline {
  total: number
  concluidos: number
  taxaConclusao: number
  emProcessamento: number
  semCategoria: number
  erros: number
}

export interface ResumoVideos {
  totalBaixados: number
  permanecem: number
  percentualPermanecem: number
  removidosHoje: number
  totalRemovidos: number
  percentualRemovidos: number
  tamanhoPermanecem: string
  espacoLiberado: string
}

export interface FatiaOrigem {
  chave: OrigemMedia
  rotulo: string
  valor: number
  percentual: number
  cor: string
}

export interface BarraCategoria {
  nome: string
  tamanhoMb: number
  tamanhoFormatado: string
  totalItens: number
  percentual: number
}

function somarStatus(
  mapa: Partial<Record<StatusMediaItem, number>>,
  lista: StatusMediaItem[]
): number {
  return lista.reduce((acumulado, status) => acumulado + (mapa[status] ?? 0), 0)
}

function percentual(parte: number, total: number): number {
  return total > 0 ? Math.round((parte / total) * 100) : 0
}

export function paletaDoTom(tom: TomMetrica): string {
  return PALETA_TOM[tom]
}

export function corTextoDoTom(tom: TomMetrica): string {
  return COR_TEXTO_TOM[tom]
}

export function calcularResumoPipeline(resumo?: ResumoDashboard): ResumoPipeline {
  const mapa: Partial<Record<StatusMediaItem, number>> = resumo?.porStatus ?? resumo?.status ?? {}
  const total = resumo?.totalGeral ?? 0
  const concluidos = somarStatus(mapa, STATUS_CONCLUIDOS)

  return {
    total,
    concluidos,
    taxaConclusao: total > 0 ? percentual(concluidos, total) : 100,
    emProcessamento: somarStatus(mapa, STATUS_EM_PROCESSAMENTO),
    semCategoria: mapa.sem_categoria ?? 0,
    erros: resumo?.totalErros ?? mapa.erro ?? 0,
  }
}

export function calcularResumoVideos(metricas?: MetricasVideosDashboard): ResumoVideos {
  const totalBaixados = metricas?.totalBaixados ?? 0
  const permanecem = metricas?.permanecemSistema ?? 0
  const totalRemovidos = metricas?.totalRemovidos ?? 0

  return {
    totalBaixados,
    permanecem,
    percentualPermanecem: totalBaixados > 0 ? percentual(permanecem, totalBaixados) : 100,
    removidosHoje: metricas?.removidosHoje ?? 0,
    totalRemovidos,
    percentualRemovidos: percentual(totalRemovidos, totalBaixados),
    tamanhoPermanecem: metricas?.tamanhoPermanecemFormatado ?? '0 B',
    espacoLiberado: metricas?.espacoLiberadoFormatado ?? '0 B',
  }
}

export function montarFatiasOrigem(resumo?: ResumoDashboard): FatiaOrigem[] {
  const mapa = resumo?.porOrigem ?? resumo?.origem ?? {}
  const total = resumo?.totalGeral ?? 0

  return (Object.keys(ROTULO_ORIGEM) as OrigemMedia[])
    .map((chave) => ({
      chave,
      rotulo: ROTULO_ORIGEM[chave],
      valor: mapa[chave] ?? 0,
      percentual: percentual(mapa[chave] ?? 0, total),
      cor: COR_ORIGEM[chave],
    }))
    .filter((fatia) => fatia.valor > 0)
}

export function montarBarrasCategorias(categorias: CategoriaMetrica[]): BarraCategoria[] {
  const espacoTotal = categorias.reduce(
    (acumulado, categoria) => acumulado + categoria.tamanhoBytes,
    0
  )

  return categorias.map((categoria) => ({
    nome: categoria.nome,
    tamanhoMb: Number((categoria.tamanhoBytes / BYTES_POR_MEGABYTE).toFixed(2)),
    tamanhoFormatado: categoria.tamanhoFormatado,
    totalItens: categoria.totalItens,
    percentual: percentual(categoria.tamanhoBytes, espacoTotal),
  }))
}

export function nomeExibicaoMidia(midia: MidiaRecenteDashboard): string {
  const nomeOriginal = midia.metadata?.original_filename
  const titulo = midia.metadata?.title
  if (typeof nomeOriginal === 'string' && nomeOriginal) return nomeOriginal
  if (typeof titulo === 'string' && titulo) return titulo
  return midia.caminhoLocal?.split('/').pop() || `Mídia ${midia.hash.substring(0, 10)}`
}

export function tempoRelativoCurto(dataIso?: string): string {
  if (!dataIso) return ''
  const data = new Date(dataIso)
  if (Number.isNaN(data.getTime())) return ''
  const segundos = Math.floor((Date.now() - data.getTime()) / 1000)
  if (segundos < 60) return 'agora'
  const minutos = Math.floor(segundos / 60)
  if (minutos < 60) return `há ${minutos} min`
  const horas = Math.floor(minutos / 60)
  if (horas < 24) return `há ${horas} h`
  const dias = Math.floor(horas / 24)
  return `há ${dias} ${dias === 1 ? 'dia' : 'dias'}`
}

export function pluralizar(quantidade: number, singular: string, plural: string): string {
  return `${quantidade} ${quantidade === 1 ? singular : plural}`
}

export interface LinhaServico {
  nome: string
  detalhe: string
  estado: string
  tom: TomMetrica
}

export interface EstadoServicos {
  syncthingOnline: boolean
  totalPastas: number
  totalErros: number
  googleFotosConectado: boolean
  googleFotosEmail: string | null
  totalCategorias: number
  tamanhoTotal: string
}

export function montarServicosIntegracao(estado: EstadoServicos): LinhaServico[] {
  return [
    {
      nome: 'Syncthing',
      detalhe: pluralizar(estado.totalPastas, 'pasta monitorada', 'pastas monitoradas'),
      estado: estado.syncthingOnline ? 'Conectado' : 'Offline',
      tom: estado.syncthingOnline ? 'sucesso' : 'erro',
    },
    {
      nome: 'Pipeline',
      detalhe: 'Workers do Messenger',
      estado: estado.totalErros > 0 ? pluralizar(estado.totalErros, 'erro', 'erros') : 'Estável',
      tom: estado.totalErros > 0 ? 'erro' : 'sucesso',
    },
    {
      nome: 'Google Fotos',
      detalhe: estado.googleFotosEmail ?? 'Backup e álbuns na nuvem',
      estado: estado.googleFotosConectado ? 'Conectado' : 'Desconectado',
      tom: estado.googleFotosConectado ? 'sucesso' : 'erro',
    },
    {
      nome: 'Armazenamento',
      detalhe: pluralizar(estado.totalCategorias, 'categoria', 'categorias'),
      estado: estado.tamanhoTotal,
      tom: 'neutro',
    },
  ]
}

export function filtrarCategorias(
  categorias: CategoriaMetrica[],
  busca: string
): CategoriaMetrica[] {
  const termo = busca.toLowerCase().trim()
  if (!termo) return categorias
  return categorias.filter(
    (categoria) =>
      categoria.nome.toLowerCase().includes(termo) ||
      categoria.pastaLocal.toLowerCase().includes(termo)
  )
}

export function isCategoriaEditavel(categoria: CategoriaMetrica): boolean {
  return Boolean(categoria.uuid) && categoria.uuid !== 'sem_categoria'
}
