import { addToast } from '@/shared/components/ui/toaster'
import { create } from 'zustand'
import {
  baixarAudioBloco,
  baixarPdfLivro,
  listarBlocosLivroAudio,
  listarMarcacoesLivro,
  listarTrechosBlocoDaRede,
  listarVozesLivro,
  obterLivroAudio,
} from '../api'
import type { LivroAudioBloco } from '../types'
import { pedirArmazenamentoPersistente, salvarParteOffline, salvarPdfOffline } from './offline'

export interface ProgressoDownloadOffline {
  atual: number
  total: number
  fracaoParte: number
  baixandoPdf: boolean
}

export interface ParteParaBaixar {
  bloco: LivroAudioBloco
  voz: string | null
}

interface DownloadsOfflineStore {
  progresso: Record<string, ProgressoDownloadOffline>
  versao: number
}

export const useDownloadsOffline = create<DownloadsOfflineStore>()(() => ({
  progresso: {},
  versao: 0,
}))

const cancelados = new Set<string>()

function definirProgresso(livroUuid: string, progresso: ProgressoDownloadOffline | null) {
  useDownloadsOffline.setState((estado) => {
    const copia = { ...estado.progresso }
    if (progresso) copia[livroUuid] = progresso
    else delete copia[livroUuid]
    return { progresso: copia }
  })
}

export function cancelarDownloadOffline(livroUuid: string) {
  cancelados.add(livroUuid)
}

export function downloadEmAndamento(livroUuid: string): boolean {
  return Boolean(useDownloadsOffline.getState().progresso[livroUuid])
}

async function aquecerDadosDoLivro(livroUuid: string) {
  await Promise.allSettled([
    obterLivroAudio(livroUuid),
    listarBlocosLivroAudio(livroUuid),
    listarVozesLivro(livroUuid),
    listarMarcacoesLivro(livroUuid),
  ])
}

export async function baixarParaOffline(
  livroUuid: string,
  partes: ParteParaBaixar[],
  opcoes: { incluirPdf?: boolean; silencioso?: boolean } = {}
): Promise<number> {
  if (downloadEmAndamento(livroUuid)) return 0
  if (partes.length === 0 && !opcoes.incluirPdf) return 0

  cancelados.delete(livroUuid)
  await pedirArmazenamentoPersistente()
  let baixadas = 0
  try {
    if (opcoes.incluirPdf) {
      definirProgresso(livroUuid, {
        atual: 0,
        total: partes.length,
        fracaoParte: 0,
        baixandoPdf: true,
      })
      const pdf = await baixarPdfLivro(livroUuid, (fracaoParte) =>
        definirProgresso(livroUuid, {
          atual: 0,
          total: partes.length,
          fracaoParte,
          baixandoPdf: true,
        })
      )
      await salvarPdfOffline(livroUuid, pdf)
    }

    for (const [indice, { bloco, voz }] of partes.entries()) {
      if (cancelados.has(livroUuid)) break
      const atual = indice + 1
      definirProgresso(livroUuid, {
        atual,
        total: partes.length,
        fracaoParte: 0,
        baixandoPdf: false,
      })
      const [audio, trechos] = await Promise.all([
        baixarAudioBloco(livroUuid, bloco.numeroBloco, voz, (fracaoParte) =>
          definirProgresso(livroUuid, {
            atual,
            total: partes.length,
            fracaoParte,
            baixandoPdf: false,
          })
        ),
        bloco.possuiTrechos || voz
          ? listarTrechosBlocoDaRede(livroUuid, bloco.numeroBloco, voz)
          : Promise.resolve([]),
      ])
      await salvarParteOffline(
        livroUuid,
        bloco.numeroBloco,
        voz,
        bloco.atualizadoEm,
        audio,
        trechos
      )
      baixadas++
    }

    await aquecerDadosDoLivro(livroUuid)
    if (!opcoes.silencioso && !cancelados.has(livroUuid)) {
      addToast({
        title: 'Pronto para ouvir offline',
        description:
          baixadas > 0
            ? `${baixadas} parte(s) guardada(s) neste aparelho.`
            : 'As páginas do livro foram guardadas neste aparelho.',
        type: 'success',
      })
    }
  } catch (erro) {
    if (!opcoes.silencioso) {
      addToast({
        title: 'O download parou',
        description:
          erro instanceof Error && erro.name === 'QuotaExceededError'
            ? 'Acabou o espaço que o navegador libera para este site.'
            : 'Verifique a conexão e tente de novo. O que já baixou fica guardado.',
        type: 'error',
      })
    }
  } finally {
    cancelados.delete(livroUuid)
    definirProgresso(livroUuid, null)
    useDownloadsOffline.setState((estado) => ({ versao: estado.versao + 1 }))
  }
  return baixadas
}
