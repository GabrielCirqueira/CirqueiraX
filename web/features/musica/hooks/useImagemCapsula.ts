import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { obterCapsulaMusica } from '../api'
import {
  type OpcoesImagemCapsula,
  chavesImagensFaltantesCapsula,
  gerarImagemCapsula,
  montarImagensCapsula,
} from '../utils'
import { MUSICA_QUERY_KEYS } from './chavesQueryMusica'
import { useImagensMusica } from './useImagensMusica'

const TEMPO_DADOS_FRESCOS_MS = 60_000
const TEMPO_PREVIA_GUARDADA_MS = 30_000

export function usePreviaImagemCapsula(
  ano: number,
  mes: number,
  opcoes: OpcoesImagemCapsula,
  aberto: boolean
) {
  const capsula = useQuery({
    queryKey: MUSICA_QUERY_KEYS.capsulaDetalhe(opcoes.fonte, ano, mes),
    queryFn: () => obterCapsulaMusica(ano, mes, opcoes.fonte),
    enabled: aberto,
    staleTime: TEMPO_DADOS_FRESCOS_MS,
    retry: false,
  })
  const chaves = chavesImagensFaltantesCapsula(capsula.data)
  const mapaImagens = useImagensMusica(aberto ? chaves : [])
  const imagens = capsula.data ? montarImagensCapsula(capsula.data, mapaImagens.data) : null
  const imagensProntas = chaves.length === 0 || mapaImagens.data !== undefined

  const previa = useQuery({
    queryKey: MUSICA_QUERY_KEYS.imagemCapsula(ano, mes, opcoes, imagens ?? {}),
    queryFn: () => {
      if (!capsula.data || !imagens) throw new Error('Cápsula indisponível')
      return gerarImagemCapsula(capsula.data, imagens, opcoes)
    },
    enabled: aberto && Boolean(capsula.data) && imagensProntas,
    staleTime: Number.POSITIVE_INFINITY,
    gcTime: TEMPO_PREVIA_GUARDADA_MS,
    placeholderData: keepPreviousData,
    retry: false,
  })

  return {
    previa: previa.data,
    gerando: previa.isFetching || capsula.isLoading || (aberto && !imagensProntas),
    erro: capsula.isError || previa.isError,
    semDados: capsula.data?.totalStreams === 0,
  }
}
