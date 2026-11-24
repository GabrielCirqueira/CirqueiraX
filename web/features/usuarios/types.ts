import type { Usuario } from '@/shared/types'
import type { FuncionalidadeSistema } from '@/shared/utils/funcionalidadesSistema'

export type UsuarioSistema = Usuario

export interface FuncionalidadeOpcao {
  codigo: FuncionalidadeSistema
  descricao: string
}

export interface CadastrarUsuarioInput {
  nomeCompleto: string
  username: string
  email: string
  senha: string
  administrador: boolean
  permissoes: FuncionalidadeSistema[]
}

export interface AtualizarUsuarioInput {
  nomeCompleto: string
  email: string
  administrador: boolean
  permissoes: FuncionalidadeSistema[]
  senha?: string
}

export interface FormularioUsuarioValores {
  nomeCompleto: string
  username: string
  email: string
  senha: string
  administrador: boolean
  permissoes: FuncionalidadeSistema[]
}

export type OrigemMidiaUsuario =
  | 'print_empresa'
  | 'print_pessoal'
  | 'bot_telegram'
  | 'download'
  | 'manual'

export type StatusContaIntegracao = 'conectada' | 'reconectar' | 'desconectada'

export interface ResumoOrigemMidiaUsuario {
  total: number
  concluidos: number
  erros: number
  bytes: number
  ultimo: string | null
}

export interface TotaisMusicaUsuario {
  minutos: number
  streams: number
  reproducoes: number
  artistas: number
  musicas: number
  dias: number
  primeira: string | null
  ultima: string | null
  porFonte: Record<string, { streams: number; minutos: number }>
  minutosEstimados: number
}

export interface MusicaTopoUsuario {
  nomeFaixa: string
  artista: string
  streams: number
  minutos: number
  imagemUrl: string | null
  musicaUuid: string | null
}

export interface ArtistaTopoUsuario {
  nome: string
  streams: number
  minutos: number
  imagemUrl: string | null
  artistaUuid: string | null
}

export interface ResumoAtividadeUsuario {
  midias: Record<OrigemMidiaUsuario, ResumoOrigemMidiaUsuario>
  audios: {
    total: number
    disponiveis: number
    erros: number
    bytes: number
    minutos: number
    ultimo: string | null
  }
  transcricoes: {
    total: number
    concluidas: number
    erros: number
    palavras: number
    minutos: number
    favoritas: number
    deVideo: number
    ultimo: string | null
  }
  livrosAudio: { total: number; prontos: number; paginas: number; ultimo: string | null }
  youtube: { reproducoes: number; videos: number; minutos: number; ultimo: string | null }
  ia: { chamadas: number; tokens: number; custoMicrodolares: number }
  transferencias: { total: number; faixasTransferidas: number }
  contas: {
    spotify: StatusContaIntegracao | null
    youtubeMusic: StatusContaIntegracao | null
    googleFotos: boolean
  }
  musica: {
    totais: TotaisMusicaUsuario
    mes: TotaisMusicaUsuario
    exclusividade: { spotify: number; youtube_music: number; ambas: number }
    topMusicas: MusicaTopoUsuario[]
    topArtistas: ArtistaTopoUsuario[]
  }
}
