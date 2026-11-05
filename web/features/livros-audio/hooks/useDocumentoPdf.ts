import { useQuery } from '@tanstack/react-query'
import { obterUrlPdfLivro } from '../api'
import { obterPdfOffline } from '../utils/offline'
import { type PDFDocumentProxy, carregarDocumentoPdf } from '../utils/pdf'

export function useDocumentoPdf(livroUuid: string | null | undefined) {
  return useQuery<PDFDocumentProxy>({
    queryKey: ['documento-pdf', livroUuid],
    queryFn: async () => {
      if (!livroUuid) throw new Error('Livro não informado.')
      const guardado = await obterPdfOffline(livroUuid).catch(() => null)
      if (guardado) return carregarDocumentoPdf(guardado)
      return carregarDocumentoPdf(obterUrlPdfLivro(livroUuid))
    },
    enabled: Boolean(livroUuid),
    staleTime: Number.POSITIVE_INFINITY,
    gcTime: 1000 * 60 * 30,
    retry: (falhas) => navigator.onLine && falhas < 1,
    networkMode: 'always',
  })
}
