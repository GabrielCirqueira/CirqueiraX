import type {
  ComponenteMashupEntrada,
  ContagensRevisao,
  CorrecaoVideoPayload,
  LeituraIa,
  MusicaCatalogo,
  PaginaRevisao,
  TipoRevisao,
  VideoRevisao,
} from '../types'

export interface AbaRevisao {
  tipo: TipoRevisao
  rotulo: string
  descricao: string
}

export const ABAS_REVISAO: AbaRevisao[] = [
  {
    tipo: 'sem_vinculo',
    rotulo: 'Sem vínculo',
    descricao: 'Vídeos que ainda não estão ligados a nenhuma música.',
  },
  {
    tipo: 'ambiguo',
    rotulo: 'Ambíguos',
    descricao: 'O título pode ser de mais de uma música. Escolha a leitura certa.',
  },
  {
    tipo: 'compilacao',
    rotulo: 'Compilações',
    descricao: 'Vídeos com várias músicas seguidas. Diga como tratar cada um.',
  },
  {
    tipo: 'canal_novo',
    rotulo: 'Canais novos',
    descricao: 'Canais ainda sem regra. Um clique resolve todos os vídeos do canal.',
  },
  {
    tipo: 'possivel_duplicata',
    rotulo: 'Possíveis duplicadas',
    descricao: 'Músicas com o mesmo título e artistas parecidos. Una as que forem a mesma.',
  },
  {
    tipo: 'indisponivel',
    rotulo: 'Indisponíveis',
    descricao: 'Vídeos removidos ou privados. Informe a música se souber qual era.',
  },
]

export const TIPO_REVISAO_PADRAO: TipoRevisao = 'sem_vinculo'

export const OPCOES_VERSAO_MUSICA: { valor: string; rotulo: string }[] = [
  { valor: 'original', rotulo: 'Original' },
  { valor: 'slowed', rotulo: 'Slowed' },
  { valor: 'sped_up', rotulo: 'Sped up' },
  { valor: 'reverb', rotulo: 'Reverb' },
  { valor: 'oito_d', rotulo: '8D' },
  { valor: 'nightcore', rotulo: 'Nightcore' },
  { valor: 'lyrics', rotulo: 'Lyrics' },
  { valor: 'video_oficial', rotulo: 'Vídeo oficial' },
  { valor: 'traducao', rotulo: 'Tradução' },
  { valor: 'remix', rotulo: 'Remix' },
  { valor: 'cover', rotulo: 'Cover' },
  { valor: 'instrumental', rotulo: 'Instrumental' },
  { valor: 'ao_vivo', rotulo: 'Ao vivo' },
  { valor: 'outro', rotulo: 'Outra versão' },
]

const MINIMO_BUSCA = 2
const MINIMO_COMPONENTES_MASHUP = 2
const SEPARADOR_ARTISTAS = /[,;]/

export function lerTipoRevisao(valor: string | null): TipoRevisao {
  return ABAS_REVISAO.find((aba) => aba.tipo === valor)?.tipo ?? TIPO_REVISAO_PADRAO
}

export function buscaValida(termo: string): boolean {
  return termo.trim().length >= MINIMO_BUSCA
}

export function separarArtistas(texto: string): string[] {
  return texto
    .split(SEPARADOR_ARTISTAS)
    .map((artista) => artista.trim())
    .filter((artista) => artista.length > 0)
}

export function juntarArtistas(artistas: string[]): string {
  return artistas.join(', ')
}

export function nomesArtistasCatalogo(musica: MusicaCatalogo): string {
  return musica.artistas.map((artista) => artista.nome).join(', ')
}

export function formatarDuracaoVideo(ms: number | null): string {
  if (!ms || ms <= 0) return '—'
  const totalSegundos = Math.round(ms / 1000)
  const horas = Math.floor(totalSegundos / 3600)
  const minutos = Math.floor((totalSegundos % 3600) / 60)
  const segundos = String(totalSegundos % 60).padStart(2, '0')
  if (horas > 0) return `${horas}:${String(minutos).padStart(2, '0')}:${segundos}`
  return `${minutos}:${segundos}`
}

export function urlVideoYoutube(videoId: string): string {
  return `https://www.youtube.com/watch?v=${encodeURIComponent(videoId)}`
}

export function descreverLeitura(leitura: LeituraIa): string {
  return leitura.artistas.length > 0
    ? `${leitura.titulo} — ${juntarArtistas(leitura.artistas)}`
    : leitura.titulo
}

export function leiturasSugeridas(video: VideoRevisao): LeituraIa[] {
  return video.sugestaoIa?.componentes ?? []
}

export function alternativasSugeridas(video: VideoRevisao): LeituraIa[] {
  return video.sugestaoIa?.alternativas ?? []
}

export function confiancaVideo(video: VideoRevisao): number | null {
  return video.sugestaoIa?.confianca ?? video.confianca
}

export function payloadDaLeitura(leitura: LeituraIa, versao: string | null): CorrecaoVideoPayload {
  return {
    acao: 'definir_musica',
    titulo: leitura.titulo,
    artistas: leitura.artistas,
    versao: versao ?? 'original',
  }
}

export function payloadDaSugestao(video: VideoRevisao): CorrecaoVideoPayload | null {
  const versao = video.sugestaoIa?.versao ?? video.tipoVersao ?? 'original'
  if (video.musica) {
    return { acao: 'definir_musica', musicaUuid: video.musica.uuid, versao }
  }
  const leituras = leiturasSugeridas(video).filter((leitura) => leitura.artistas.length > 0)
  if (leituras.length >= MINIMO_COMPONENTES_MASHUP) {
    return { acao: 'definir_mashup', componentes: leituras, versao }
  }
  const [unica] = leituras
  if (leituras.length === 1 && unica) {
    return payloadDaLeitura(unica, versao)
  }
  return null
}

export interface ComponenteRascunho {
  titulo: string
  artistas: string
}

export const LIMITE_COMPONENTES_MASHUP = 5

export function componentesIniciais(video: VideoRevisao | null): ComponenteRascunho[] {
  const leituras = video ? leiturasSugeridas(video) : []
  const iniciais = leituras
    .slice(0, LIMITE_COMPONENTES_MASHUP)
    .map((leitura) => ({ titulo: leitura.titulo, artistas: juntarArtistas(leitura.artistas) }))
  while (iniciais.length < MINIMO_COMPONENTES_MASHUP) {
    iniciais.push({ titulo: '', artistas: '' })
  }
  return iniciais
}

export function paraComponentesEntrada(rascunhos: ComponenteRascunho[]): ComponenteMashupEntrada[] {
  return rascunhos.map((rascunho) => ({
    titulo: rascunho.titulo.trim(),
    artistas: separarArtistas(rascunho.artistas),
  }))
}

export function componentesValidos(rascunhos: ComponenteRascunho[]): boolean {
  const componentes = paraComponentesEntrada(rascunhos)
  const preenchidos = componentes.filter(
    (componente) => componente.titulo !== '' && componente.artistas.length > 0
  )
  return (
    preenchidos.length >= MINIMO_COMPONENTES_MASHUP && preenchidos.length === componentes.length
  )
}

export function novaMusicaValida(titulo: string, artistas: string): boolean {
  return titulo.trim() !== '' && separarArtistas(artistas).length > 0
}

export function removerVideosDaPagina(
  pagina: PaginaRevisao | undefined,
  uuids: string[]
): PaginaRevisao | undefined {
  if (!pagina) return pagina
  const removidos = pagina.videos.filter((video) => uuids.includes(video.uuid)).length
  return {
    ...pagina,
    videos: pagina.videos.filter((video) => !uuids.includes(video.uuid)),
    total: Math.max(0, pagina.total - removidos),
  }
}

export function removerCanalDaPagina(
  pagina: PaginaRevisao | undefined,
  canal: string
): PaginaRevisao | undefined {
  if (!pagina) return pagina
  return {
    ...pagina,
    canais: pagina.canais.filter((item) => item.canal !== canal),
    total: Math.max(0, pagina.total - 1),
  }
}

export function removerDuplicataDaPagina(
  pagina: PaginaRevisao | undefined,
  uuids: string[]
): PaginaRevisao | undefined {
  if (!pagina) return pagina
  const restantes = pagina.duplicatas.filter(
    (par) => !par.musicas.some((musica) => uuids.includes(musica.uuid))
  )
  return {
    ...pagina,
    duplicatas: restantes,
    total: Math.max(0, pagina.total - (pagina.duplicatas.length - restantes.length)),
  }
}

export function descontarContagem(
  contagens: ContagensRevisao | undefined,
  tipo: TipoRevisao,
  quantidade: number
): ContagensRevisao | undefined {
  if (!contagens) return contagens
  return { ...contagens, [tipo]: Math.max(0, (contagens[tipo] ?? 0) - quantidade) }
}

export function totalPaginas(pagina: PaginaRevisao | undefined): number {
  if (!pagina || pagina.porPagina <= 0) return 1
  return Math.max(1, Math.ceil(pagina.total / pagina.porPagina))
}

export function aceitaLote(tipo: TipoRevisao): boolean {
  return tipo !== 'canal_novo' && tipo !== 'possivel_duplicata'
}
