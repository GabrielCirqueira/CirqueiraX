import type { QueryClient } from '@tanstack/react-query'
import { listarTrechosBloco } from '../api'
import type { LivroAudioBloco, TrechoNarracao } from '../types'
import { type LocalizacaoTrecho, localizarTrechos } from '../utils/localizacaoNarracao'
import { type PDFDocumentProxy, obterItensTextoPagina } from '../utils/pdf'
import { chaveTrechosBloco } from './useLivrosAudio'

export function chaveLocalizacaoBloco(
  livroUuid: string,
  bloco: LivroAudioBloco | null,
  voz: string | null,
  totalTrechos: number
) {
  return [
    'localizacao-trechos',
    livroUuid,
    bloco?.numeroBloco,
    bloco?.atualizadoEm,
    voz,
    totalTrechos,
  ]
}

export async function calcularLocalizacaoBloco(
  documento: PDFDocumentProxy,
  bloco: LivroAudioBloco,
  trechos: TrechoNarracao[]
): Promise<(LocalizacaoTrecho | null)[]> {
  const ultimaPagina = Math.min(bloco.paginaFim, documento.numPages)
  const numeros: number[] = []
  for (let numero = bloco.paginaInicio; numero <= ultimaPagina; numero++) {
    numeros.push(numero)
  }

  const paginas = await Promise.all(
    numeros.map(async (numero) => ({
      numero,
      itens: await obterItensTextoPagina(documento, numero),
    }))
  )

  return localizarTrechos(paginas, trechos)
}

export async function buscarLocalizacaoBloco(
  queryClient: QueryClient,
  livroUuid: string,
  bloco: LivroAudioBloco,
  voz: string | null,
  documento: PDFDocumentProxy
): Promise<{ trechos: TrechoNarracao[]; localizacoes: (LocalizacaoTrecho | null)[] }> {
  if (!bloco.isPronto || (!voz && !bloco.possuiTrechos)) {
    return { trechos: [], localizacoes: [] }
  }

  const trechos = await queryClient.fetchQuery({
    queryKey: chaveTrechosBloco(livroUuid, bloco.numeroBloco, voz, bloco.atualizadoEm),
    queryFn: () => listarTrechosBloco(livroUuid, bloco.numeroBloco, voz),
    staleTime: Number.POSITIVE_INFINITY,
  })

  const localizacoes = await queryClient.fetchQuery({
    queryKey: chaveLocalizacaoBloco(livroUuid, bloco, voz, trechos.length),
    queryFn: () => calcularLocalizacaoBloco(documento, bloco, trechos),
    staleTime: Number.POSITIVE_INFINITY,
  })

  return { trechos, localizacoes }
}
