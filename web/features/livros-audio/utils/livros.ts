import type { LivroAudio, StatusLivroAudio } from '../types'

export interface AparenciaStatusLivro {
  rotulo: string
  paleta: 'green' | 'brand' | 'yellow' | 'red' | 'grey'
}

const APARENCIA_STATUS: Record<StatusLivroAudio, AparenciaStatusLivro> = {
  enviado: { rotulo: 'Enviado', paleta: 'grey' },
  extraindo: { rotulo: 'Extraindo texto', paleta: 'yellow' },
  gerando_audio: { rotulo: 'Gerando áudio', paleta: 'brand' },
  parcial: { rotulo: 'Áudio parcial', paleta: 'yellow' },
  pronto: { rotulo: 'Pronto', paleta: 'green' },
  erro: { rotulo: 'Erro', paleta: 'red' },
}

export function obterAparenciaStatusLivro(status: StatusLivroAudio): AparenciaStatusLivro {
  return APARENCIA_STATUS[status] ?? { rotulo: status, paleta: 'grey' }
}

export function calcularProgressoLeitura(paginaAtual: number, totalPaginas: number | null): number {
  if (!totalPaginas || totalPaginas <= 0) return 0
  const percentual = Math.round((paginaAtual / totalPaginas) * 100)
  return Math.min(100, Math.max(0, percentual))
}

export function formatarTamanhoLivro(bytes: number): string {
  if (bytes <= 0) return '0 B'
  const kb = bytes / 1024
  if (kb < 1024) return `${kb.toFixed(0)} KB`
  const mb = kb / 1024
  return `${mb.toFixed(1)} MB`
}

export function formatarDataRelativa(dataIso: string | null): string {
  if (!dataIso) return 'Nunca'
  const data = new Date(dataIso)
  const agora = Date.now()
  const diferencaSegundos = Math.floor((agora - data.getTime()) / 1000)

  if (diferencaSegundos < 60) return 'Agora há pouco'
  const minutos = Math.floor(diferencaSegundos / 60)
  if (minutos < 60) return `${minutos} min atrás`
  const horas = Math.floor(minutos / 60)
  if (horas < 24) return `${horas} h atrás`
  const dias = Math.floor(horas / 24)
  if (dias === 1) return 'Ontem'
  if (dias < 30) return `${dias} dias atrás`

  return data.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

export interface ContagemStatusLivros {
  total: number
  prontos: number
  emProcessamento: number
  comErro: number
}

export function contarLivrosPorStatus(livros: LivroAudio[] | undefined): ContagemStatusLivros {
  const lista = livros ?? []
  return {
    total: lista.length,
    prontos: lista.filter((l) => l.isPronto).length,
    emProcessamento: lista.filter((l) => l.isEmProcessamento).length,
    comErro: lista.filter((l) => l.isErro).length,
  }
}
