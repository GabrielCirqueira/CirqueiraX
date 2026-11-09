import type { EnvioAudio } from '../types'

export const LIMITE_BYTES_ARQUIVO = 2 * 1024 * 1024 * 1024
export const ENVIOS_SIMULTANEOS = 2
export const TIPOS_ACEITOS =
  'audio/*,video/*,.mp3,.m4a,.wav,.ogg,.oga,.opus,.aac,.flac,.amr,.weba,.webm,.mp4,.mov,.mkv,.3gp,.avi,.wmv,.m4v,.flv,.mpeg,.mpg,.ts'

const EXTENSOES_ACEITAS = new Set([
  'mp3',
  'm4a',
  'wav',
  'ogg',
  'oga',
  'opus',
  'aac',
  'flac',
  'amr',
  'weba',
  'webm',
  'mp4',
  'mov',
  'mkv',
  '3gp',
  'wma',
  'aiff',
  'avi',
  'wmv',
  'm4v',
  'flv',
  'mpeg',
  'mpg',
  'ts',
])

function extensaoDe(nome: string): string {
  const partes = nome.toLowerCase().split('.')
  return partes.length > 1 ? (partes.at(-1) ?? '') : ''
}

export function isArquivoDeMidia(arquivo: File): boolean {
  if (arquivo.type.startsWith('audio/') || arquivo.type.startsWith('video/')) return true
  return EXTENSOES_ACEITAS.has(extensaoDe(arquivo.name))
}

export function separarArquivosAceitos(arquivos: File[]): { aceitos: File[]; recusados: string[] } {
  const aceitos: File[] = []
  const recusados: string[] = []
  for (const arquivo of arquivos) {
    if (!isArquivoDeMidia(arquivo)) {
      recusados.push(`${arquivo.name}: não é um áudio ou vídeo`)
      continue
    }
    if (arquivo.size > LIMITE_BYTES_ARQUIVO) {
      recusados.push(`${arquivo.name}: passa de 2 GB`)
      continue
    }
    aceitos.push(arquivo)
  }
  return { aceitos, recusados }
}

export function criarEnvio(arquivo: File, indice: number): EnvioAudio {
  return {
    id: `${Date.now()}-${indice}-${arquivo.name}`,
    nome: arquivo.name,
    tamanhoBytes: arquivo.size,
    percentual: 0,
    situacao: 'aguardando',
    erro: null,
  }
}

export function isEnvioFinalizado(envio: EnvioAudio): boolean {
  return envio.situacao === 'enviado' || envio.situacao === 'falhou'
}

export async function executarComLimite<T>(
  itens: T[],
  limite: number,
  tarefa: (item: T) => Promise<void>
): Promise<void> {
  let proximo = 0
  async function trabalhar(): Promise<void> {
    while (proximo < itens.length) {
      const item = itens[proximo]
      proximo += 1
      if (item !== undefined) await tarefa(item)
    }
  }
  await Promise.all(Array.from({ length: Math.min(limite, itens.length) }, trabalhar))
}
