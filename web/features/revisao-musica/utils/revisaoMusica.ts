import { urlCapaExibicao } from '@/features/musica/utils/capaMusica'
import type {
  ComponenteMashupEntrada,
  ContagensRevisao,
  CorrecaoVideoPayload,
  LeituraIa,
  MidiaSugestao,
  MusicaCatalogo,
  MusicaDuplicata,
  PaginaRevisao,
  TipoRevisao,
  VideoRevisao,
} from '../types'

export interface AbaRevisao {
  tipo: TipoRevisao
  rotulo: string
  descricao: string
  instrucao: string
}

export const ABAS_REVISAO: AbaRevisao[] = [
  {
    tipo: 'sem_vinculo',
    rotulo: 'Sem vínculo',
    descricao: 'Vídeos que ainda não estão ligados a nenhuma música.',
    instrucao:
      'Para cada vídeo, confirme a música sugerida ou escolha a certa. Se não for música, marque como "Não é música".',
  },
  {
    tipo: 'ambiguo',
    rotulo: 'Ambíguos',
    descricao: 'O título pode ser de mais de uma música.',
    instrucao: 'Toque na leitura certa. Se nenhuma servir, busque a música ou crie uma nova.',
  },
  {
    tipo: 'compilacao',
    rotulo: 'Compilações',
    descricao: 'Vídeos com várias músicas seguidas.',
    instrucao: 'Mantenha como compilação ou informe as músicas que tocam no vídeo.',
  },
  {
    tipo: 'canal_novo',
    rotulo: 'Canais novos',
    descricao: 'Canais que ainda não têm regra.',
    instrucao:
      'Diga se o canal só posta música. A regra vale para todos os vídeos dele, inclusive os próximos.',
  },
  {
    tipo: 'possivel_duplicata',
    rotulo: 'Possíveis duplicadas',
    descricao: 'Músicas com o mesmo título e artistas parecidos.',
    instrucao:
      'Para cada par, escolha qual é a principal (a outra vira versão dela e as reproduções somam), ligue as duas a uma música oficial, ou diga que são músicas diferentes (o par sai da lista e não volta).',
  },
  {
    tipo: 'indisponivel',
    rotulo: 'Indisponíveis',
    descricao: 'Vídeos removidos ou privados no YouTube.',
    instrucao:
      'Se você lembrar qual música era, informe. Se não, marque como "Não é música" para tirar da lista.',
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
const URL_VIDEO_YOUTUBE = 'https://www.youtube.com/watch?v='
const URL_VIDEO_YOUTUBE_MUSIC = 'https://music.youtube.com/watch?v='
const URL_CANAL_YOUTUBE = 'https://www.youtube.com/channel/'
const URL_BUSCA_YOUTUBE = 'https://www.youtube.com/results?search_query='
const URL_BUSCA_SPOTIFY = 'https://open.spotify.com/search/'
const ROTA_DETALHE_MUSICA = '/musica/faixa?uuid='
const FORMATO_MINIATURA_YOUTUBE = 'https://i.ytimg.com/vi/{id}/hqdefault.jpg'
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
  return `${URL_VIDEO_YOUTUBE}${encodeURIComponent(videoId)}`
}

export function urlVideoYoutubeMusicRevisao(videoId: string): string {
  return `${URL_VIDEO_YOUTUBE_MUSIC}${encodeURIComponent(videoId)}`
}

export function miniaturaVideoYoutube(videoId: string): string {
  return FORMATO_MINIATURA_YOUTUBE.replace('{id}', encodeURIComponent(videoId))
}

export function urlCanalYoutube(canalId: string | null | undefined, canal: string): string {
  if (canalId) return `${URL_CANAL_YOUTUBE}${encodeURIComponent(canalId)}`
  return `${URL_BUSCA_YOUTUBE}${encodeURIComponent(canal)}`
}

export function urlSpotifyDuplicata(musica: MusicaDuplicata): string {
  return musica.spotify?.urlSpotify ?? urlBuscaSpotify(musica)
}

export function descreverOuvidasDuplicata(musica: MusicaDuplicata): string | null {
  const partes = [
    musica.spotify ? `${musica.spotify.reproducoes}x no Spotify` : null,
    musica.videoPrincipal ? `${musica.videoPrincipal.reproducoes}x no YouTube Music` : null,
  ].filter((parte): parte is string => parte !== null)
  return partes.length > 0 ? `Ouvida ${partes.join(' · ')}` : null
}

export function urlBuscaSpotify(musica: MusicaCatalogo): string {
  const termo = `${musica.titulo} ${nomesArtistasCatalogo(musica)}`.trim()
  return `${URL_BUSCA_SPOTIFY}${encodeURIComponent(termo)}`
}

export function rotaDetalheMusica(uuid: string): string {
  return `${ROTA_DETALHE_MUSICA}${encodeURIComponent(uuid)}`
}

export function capaMusicaDuplicata(musica: MusicaDuplicata): string | null {
  const videoId = musica.videoPrincipal?.videoId ?? musica.videoOficialId
  return urlCapaExibicao(
    musica.urlCapa ??
      musica.spotify?.urlCapa ??
      musica.videoPrincipal?.urlCapa ??
      (videoId ? miniaturaVideoYoutube(videoId) : null)
  )
}

export function videoDaMusicaDuplicata(musica: MusicaDuplicata): string | null {
  return musica.videoPrincipal?.videoId ?? musica.videoOficialId
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

export interface NivelConfianca {
  rotulo: string
  cor: string
}

const CONFIANCA_ALTA = 80
const CONFIANCA_MEDIA = 50

export function nivelConfianca(confianca: number | null): NivelConfianca | null {
  if (confianca === null) return null
  if (confianca >= CONFIANCA_ALTA) {
    return { rotulo: `Alta certeza · ${confianca}%`, cor: 'cirqueira.musica.verde' }
  }
  if (confianca >= CONFIANCA_MEDIA) {
    return { rotulo: `Média certeza · ${confianca}%`, cor: 'cirqueira.musica.amarelo' }
  }
  return { rotulo: `Baixa certeza · ${confianca}%`, cor: 'cirqueira.red.400' }
}

export function rotuloVersao(versao: string | null | undefined): string | null {
  if (!versao || versao === 'original') return null
  return OPCOES_VERSAO_MUSICA.find((opcao) => opcao.valor === versao)?.rotulo ?? null
}

export interface OpcaoLeituraVideo {
  chave: string
  titulo: string
  detalhe: string
  sugerida: boolean
  payload: CorrecaoVideoPayload
  urlCapa: string | null
  urlSpotify: string
  urlYoutube: string
  rotaMusica: string | null
}

function urlBuscaTermoYoutube(termo: string): string {
  return `${URL_BUSCA_YOUTUBE}${encodeURIComponent(termo)}`
}

function urlBuscaTermoSpotify(termo: string): string {
  return `${URL_BUSCA_SPOTIFY}${encodeURIComponent(termo)}`
}

function midiaDaLeitura(
  video: VideoRevisao,
  leitura: LeituraIa | undefined
): Pick<OpcaoLeituraVideo, 'urlCapa' | 'urlSpotify' | 'urlYoutube' | 'rotaMusica'> {
  const titulo = leitura?.titulo ?? ''
  const artista = leitura?.artistas[0] ?? ''
  const termo = `${titulo} ${artista}`.trim()
  const midia: MidiaSugestao | undefined = video.midiaSugestoes.find(
    (item) =>
      item.titulo.toLowerCase() === titulo.trim().toLowerCase() &&
      item.artista.toLowerCase() === artista.trim().toLowerCase()
  )
  return {
    urlCapa: midia?.urlCapa ?? null,
    urlSpotify: midia?.urlSpotify ?? urlBuscaTermoSpotify(termo),
    urlYoutube: urlBuscaTermoYoutube(termo),
    rotaMusica: null,
  }
}

function midiaDoCatalogo(
  musica: MusicaCatalogo
): Pick<OpcaoLeituraVideo, 'urlCapa' | 'urlSpotify' | 'urlYoutube' | 'rotaMusica'> {
  const termo = `${musica.titulo} ${nomesArtistasCatalogo(musica)}`.trim()
  return {
    urlCapa:
      musica.urlCapa ??
      (musica.videoOficialId
        ? FORMATO_MINIATURA_YOUTUBE.replace('{id}', musica.videoOficialId)
        : null),
    urlSpotify: urlBuscaSpotify(musica),
    urlYoutube: musica.videoOficialId
      ? urlVideoYoutube(musica.videoOficialId)
      : urlBuscaTermoYoutube(termo),
    rotaMusica: rotaDetalheMusica(musica.uuid),
  }
}

function descreverComponentes(leituras: LeituraIa[]): string {
  return leituras.map((leitura) => leitura.titulo).join(' + ')
}

function descreverArtistasComponentes(leituras: LeituraIa[]): string {
  return leituras.map((leitura) => juntarArtistas(leitura.artistas)).join(' + ')
}

export function opcoesLeituraVideo(video: VideoRevisao): OpcaoLeituraVideo[] {
  const versao = video.sugestaoIa?.versao ?? video.tipoVersao
  const opcoes: OpcaoLeituraVideo[] = []
  const sugestao = payloadDaSugestao(video)
  if (sugestao && video.musica) {
    opcoes.push({
      chave: `catalogo-${video.musica.uuid}`,
      titulo: video.musica.titulo,
      detalhe: nomesArtistasCatalogo(video.musica),
      sugerida: true,
      payload: sugestao,
      ...midiaDoCatalogo(video.musica),
    })
  }
  if (sugestao && !video.musica) {
    const leituras = leiturasSugeridas(video).filter((leitura) => leitura.artistas.length > 0)
    const mashup = sugestao.acao === 'definir_mashup'
    opcoes.push({
      chave: `sugestao-${descreverComponentes(leituras)}`,
      titulo: descreverComponentes(leituras),
      detalhe: mashup
        ? `Mashup · ${descreverArtistasComponentes(leituras)}`
        : descreverArtistasComponentes(leituras),
      sugerida: true,
      payload: sugestao,
      ...midiaDaLeitura(video, leituras[0]),
    })
  }
  const vistas = new Set(opcoes.map((opcao) => `${opcao.titulo}|${opcao.detalhe}`))
  for (const alternativa of alternativasSugeridas(video)) {
    const detalhe = juntarArtistas(alternativa.artistas)
    const chave = `${alternativa.titulo}|${detalhe}`
    if (alternativa.artistas.length === 0 || vistas.has(chave)) continue
    vistas.add(chave)
    opcoes.push({
      chave: `alternativa-${chave}`,
      titulo: alternativa.titulo,
      detalhe,
      sugerida: false,
      payload: payloadDaLeitura(alternativa, versao),
      ...midiaDaLeitura(video, alternativa),
    })
  }
  return opcoes
}

export function totalPendentes(contagens: ContagensRevisao | undefined): number {
  if (!contagens) return 0
  return ABAS_REVISAO.reduce((soma, aba) => soma + (contagens[aba.tipo] ?? 0), 0)
}

export function proximaAbaComPendencias(
  contagens: ContagensRevisao | undefined,
  atual: TipoRevisao
): AbaRevisao | null {
  return ABAS_REVISAO.find((aba) => aba.tipo !== atual && (contagens?.[aba.tipo] ?? 0) > 0) ?? null
}

export const PASSOS_REVISAO: { titulo: string; texto: string }[] = [
  {
    titulo: 'Escolha uma categoria',
    texto: 'O número amarelo mostra quantos itens esperam por você em cada uma.',
  },
  {
    titulo: 'Confirme ou corrija',
    texto:
      'Toque em “É esta” na música certa. Se nenhuma servir, busque, crie ou marque como não música.',
  },
  {
    titulo: 'Pronto',
    texto: 'O item sai da lista e as reproduções passam a contar nos seus relatórios.',
  },
]

const PADRAO_SUFIXO_VERSAO = /\s*(?:[-–—|•(\[]).*$/u

export function tituloBaseVersoes(titulos: string[]): string {
  const [primeiro = ''] = titulos
  const base = primeiro.replace(PADRAO_SUFIXO_VERSAO, '').trim()
  return base || primeiro.trim()
}
