import type { LivroAudioBloco } from '../types'

export interface AjustesDownloadAutomatico {
  ativo: boolean
  horas: number
  liberarOuvidas: boolean
  soWifi: boolean
}

export const HORAS_DOWNLOAD = [1, 2, 5] as const

const PADRAO: AjustesDownloadAutomatico = {
  ativo: false,
  horas: 2,
  liberarOuvidas: false,
  soWifi: true,
}

function chave(livroUuid: string): string {
  return `livros-audio:offline-automatico:${livroUuid}`
}

export function lerAjustesDownloadAutomatico(livroUuid: string): AjustesDownloadAutomatico {
  try {
    const salvo = localStorage.getItem(chave(livroUuid))
    return salvo
      ? { ...PADRAO, ...(JSON.parse(salvo) as Partial<AjustesDownloadAutomatico>) }
      : PADRAO
  } catch {
    return PADRAO
  }
}

export function salvarAjustesDownloadAutomatico(
  livroUuid: string,
  ajustes: AjustesDownloadAutomatico
) {
  try {
    localStorage.setItem(chave(livroUuid), JSON.stringify(ajustes))
  } catch {}
}

export function estaEmRedeMovel(): boolean {
  const conexao = (navigator as Navigator & { connection?: { type?: string; saveData?: boolean } })
    .connection
  return conexao?.type === 'cellular' || conexao?.saveData === true
}

export function selecionarPartesPorHoras(
  blocos: LivroAudioBloco[],
  numeroInicial: number,
  horas: number | null
): LivroAudioBloco[] {
  const prontos = blocos.filter((bloco) => bloco.isPronto && bloco.numeroBloco >= numeroInicial)
  if (horas === null) return prontos
  const limite = horas * 3600
  const escolhidos: LivroAudioBloco[] = []
  let total = 0
  for (const bloco of prontos) {
    if (total >= limite) break
    escolhidos.push(bloco)
    total += bloco.duracaoSegundos ?? 0
  }
  return escolhidos
}

export function somarPartes(blocos: LivroAudioBloco[]): { segundos: number; bytes: number } {
  return blocos.reduce(
    (total, bloco) => ({
      segundos: total.segundos + (bloco.duracaoSegundos ?? 0),
      bytes: total.bytes + (bloco.tamanhoBytes ?? 0),
    }),
    { segundos: 0, bytes: 0 }
  )
}
