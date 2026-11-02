import { useQuery } from '@tanstack/react-query'
import { type PDFDocumentProxy, carregarDocumentoPdf } from '../utils/pdf'

export function useDocumentoPdf(url: string | null | undefined) {
  return useQuery<PDFDocumentProxy>({
    queryKey: ['documento-pdf', url],
    queryFn: () => {
      if (!url) throw new Error('URL do PDF não informada.')
      return carregarDocumentoPdf(url)
    },
    enabled: Boolean(url),
    staleTime: Number.POSITIVE_INFINITY,
    gcTime: 1000 * 60 * 30,
    retry: 1,
  })
}
