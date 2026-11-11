import { type FonteMusica, FonteMusicaSchema, type FonteReproducao } from '../types'

export const FONTE_MUSICA_PADRAO: FonteMusica = 'todas'

export interface OpcaoFonteMusica {
  chave: FonteMusica
  rotulo: string
}

export const OPCOES_FONTE_MUSICA: OpcaoFonteMusica[] = [
  { chave: 'todas', rotulo: 'Todos' },
  { chave: 'spotify', rotulo: 'Spotify' },
  { chave: 'youtube_music', rotulo: 'YouTube Music' },
]

export const ROTULOS_FONTE_REPRODUCAO: Record<FonteReproducao, string> = {
  spotify: 'Spotify',
  youtube_music: 'YouTube Music',
}

export const CORES_FONTE_REPRODUCAO: Record<FonteReproducao, string> = {
  spotify: 'cirqueira.musica.fonteSpotify',
  youtube_music: 'cirqueira.musica.fonteYoutubeMusic',
}

export function lerFonteMusica(valor: string | null): FonteMusica {
  const resultado = FonteMusicaSchema.safeParse(valor)
  return resultado.success ? resultado.data : FONTE_MUSICA_PADRAO
}

export function anexarFonteNaRota(rota: string, fonte: FonteMusica): string {
  if (fonte === FONTE_MUSICA_PADRAO) return rota
  const separador = rota.includes('?') ? '&' : '?'
  return `${rota}${separador}fonte=${fonte}`
}

export function incluiYoutubeMusic(fonte: FonteMusica): boolean {
  return fonte !== 'spotify'
}

export interface TextosEstadoVazioMusica {
  titulo: string
  descricao: string
  mostrarSpotify: boolean
  mostrarYoutubeMusic: boolean
  mostrarImportacaoSpotify: boolean
}

export function textosEstadoVazioMusica(
  spotifyConectado: boolean,
  fonte: FonteMusica
): TextosEstadoVazioMusica {
  if (fonte === 'youtube_music') {
    return {
      titulo: 'Nenhuma música do YouTube Music ainda',
      descricao:
        'Conecte o YouTube Music para registrar o que você ouve a partir de agora ou importe o histórico do Google Takeout para trazer o passado.',
      mostrarSpotify: false,
      mostrarYoutubeMusic: true,
      mostrarImportacaoSpotify: false,
    }
  }

  if (spotifyConectado) {
    return {
      titulo: 'Nenhum histórico registrado ainda',
      descricao:
        'Importe o histórico completo exportado do Spotify, conecte o YouTube Music ou comece a ouvir para acumular dados pela sincronização automática.',
      mostrarSpotify: false,
      mostrarYoutubeMusic: fonte === 'todas',
      mostrarImportacaoSpotify: true,
    }
  }

  return {
    titulo: 'Sua Cápsula Sonora está pronta para reviver suas músicas',
    descricao:
      'Conecte o Spotify para a coleta automática a cada 5 minutos, conecte o YouTube Music ou importe seus históricos para acessar os meses anteriores.',
    mostrarSpotify: true,
    mostrarYoutubeMusic: fonte === 'todas',
    mostrarImportacaoSpotify: true,
  }
}

const ID_CONEXAO_YOUTUBE_MUSIC = 'conexao-youtube-music'

export function rolarParaConexaoYoutubeMusic(): void {
  document
    .getElementById(ID_CONEXAO_YOUTUBE_MUSIC)
    ?.scrollIntoView({ behavior: 'smooth', block: 'center' })
}
