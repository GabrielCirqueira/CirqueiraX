export type StatusAudio = 'pendente' | 'baixando' | 'disponivel' | 'erro' | 'expirado'

export interface Audio {
  uuid: string
  url: string
  status: StatusAudio
  statusDescricao: string
  titulo: string | null
  autor: string | null
  duracaoSegundos: number | null
  thumbnailUrl: string | null
  tamanhoBytes: number | null
  erroMotivo: string | null
  isDisponivel: boolean
  isRebaixavel: boolean
  isEmProcessamento: boolean
  criadoEm: string
  baixadoEm: string | null
  expiraEm: string | null
  expiradoEm: string | null
}

export interface PaginaAudios {
  audios: Audio[]
  total: number
  pagina: number
  porPagina: number
}

export interface ResultadoSolicitacaoAudios {
  enfileirados: number
  falhas: string[]
}

export type PaletaStatusAudio = 'gray' | 'amber' | 'green' | 'red'

export interface AparenciaStatusAudio {
  rotulo: string
  paleta: PaletaStatusAudio
}
