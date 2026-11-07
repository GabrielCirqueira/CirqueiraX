import type { LoggerMessage, Worker } from 'tesseract.js'

const IDIOMAS_RECONHECIMENTO = ['por', 'eng']
const STATUS_RECONHECENDO = 'recognizing text'

export async function criarLeitorTexto(aoProgredir: (progresso: number) => void): Promise<Worker> {
  const { createWorker } = await import('tesseract.js')
  return createWorker(IDIOMAS_RECONHECIMENTO, undefined, {
    logger: (mensagem: LoggerMessage) => {
      if (mensagem.status === STATUS_RECONHECENDO) aoProgredir(mensagem.progress)
    },
  })
}

export function limparTextoReconhecido(texto: string): string {
  return texto
    .split('\n')
    .map((linha) => linha.trimEnd())
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}
