import { YOUTUBE_MUSIC_QUERY_KEYS } from '@/features/youtube-music/hooks/chavesQueryYoutubeMusic'
import { extrairMensagemErroApi } from '@/features/youtube-music/utils'
import { addToast } from '@/shared/components/ui/toaster'
import { useDebounce } from '@/shared/hooks/useDebounce'
import {
  type QueryClient,
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query'
import {
  buscarArtistasCatalogo,
  buscarMusicasCatalogo,
  classificarCanal,
  corrigirVideo,
  definirMusicaEmLote,
  descartarDuplicata,
  listarRevisao,
  obterContagensRevisao,
  separarVideo,
  unirArtistas,
  unirMusicas,
  unirVariasMusicas,
} from '../api'
import type {
  ClassificacaoCanal,
  ContagensRevisao,
  CorrecaoVideoPayload,
  PaginaRevisao,
  TipoRevisao,
} from '../types'
import {
  buscaValida,
  descontarContagem,
  removerCanalDaPagina,
  removerDuplicataDaPagina,
  removerVideosDaPagina,
} from '../utils'
import { REVISAO_QUERY_KEYS } from './chavesQueryRevisao'

const TEMPO_DADOS_FRESCOS = 30_000
const ESPERA_BUSCA_MS = 300

interface InstantaneoRevisao {
  pagina: PaginaRevisao | undefined
  contagens: ContagensRevisao | undefined
}

async function aplicarOtimista(
  queryClient: QueryClient,
  tipo: TipoRevisao,
  numeroPagina: number,
  transformar: (pagina: PaginaRevisao | undefined) => PaginaRevisao | undefined,
  quantidade: number
): Promise<InstantaneoRevisao> {
  const chavePagina = REVISAO_QUERY_KEYS.lista(tipo, numeroPagina)
  await queryClient.cancelQueries({ queryKey: chavePagina })
  await queryClient.cancelQueries({ queryKey: REVISAO_QUERY_KEYS.contagens })
  const instantaneo = {
    pagina: queryClient.getQueryData<PaginaRevisao>(chavePagina),
    contagens: queryClient.getQueryData<ContagensRevisao>(REVISAO_QUERY_KEYS.contagens),
  }
  queryClient.setQueryData<PaginaRevisao | undefined>(chavePagina, transformar)
  queryClient.setQueryData<ContagensRevisao | undefined>(REVISAO_QUERY_KEYS.contagens, (atual) =>
    descontarContagem(atual, tipo, quantidade)
  )
  return instantaneo
}

function restaurar(
  queryClient: QueryClient,
  tipo: TipoRevisao,
  numeroPagina: number,
  instantaneo: InstantaneoRevisao | undefined
) {
  if (!instantaneo) return
  queryClient.setQueryData(REVISAO_QUERY_KEYS.lista(tipo, numeroPagina), instantaneo.pagina)
  queryClient.setQueryData(REVISAO_QUERY_KEYS.contagens, instantaneo.contagens)
}

function invalidarMusica(queryClient: QueryClient) {
  queryClient.invalidateQueries({ queryKey: ['musica'] })
  queryClient.invalidateQueries({ queryKey: YOUTUBE_MUSIC_QUERY_KEYS.resumoIdentificacao })
  queryClient.invalidateQueries({ queryKey: ['dashboard'] })
}

export function useContagensRevisao() {
  return useQuery({
    queryKey: REVISAO_QUERY_KEYS.contagens,
    queryFn: obterContagensRevisao,
    staleTime: TEMPO_DADOS_FRESCOS,
  })
}

export function useListaRevisao(tipo: TipoRevisao, pagina: number) {
  return useQuery({
    queryKey: REVISAO_QUERY_KEYS.lista(tipo, pagina),
    queryFn: () => listarRevisao(tipo, pagina),
    staleTime: TEMPO_DADOS_FRESCOS,
    placeholderData: keepPreviousData,
  })
}

export function useBuscaMusicasCatalogo(termo: string) {
  const termoAdiado = useDebounce(termo.trim(), ESPERA_BUSCA_MS)
  return useQuery({
    queryKey: REVISAO_QUERY_KEYS.busca('musicas', termoAdiado),
    queryFn: () => buscarMusicasCatalogo(termoAdiado),
    enabled: buscaValida(termoAdiado),
    staleTime: TEMPO_DADOS_FRESCOS,
  })
}

export function useBuscaArtistasCatalogo(termo: string) {
  const termoAdiado = useDebounce(termo.trim(), ESPERA_BUSCA_MS)
  return useQuery({
    queryKey: REVISAO_QUERY_KEYS.busca('artistas', termoAdiado),
    queryFn: () => buscarArtistasCatalogo(termoAdiado),
    enabled: buscaValida(termoAdiado),
    staleTime: TEMPO_DADOS_FRESCOS,
  })
}

export interface CorrecaoVideoVariaveis {
  videoUuid: string
  payload: CorrecaoVideoPayload
}

export function useCorrigirVideo(tipo: TipoRevisao, pagina: number) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ videoUuid, payload }: CorrecaoVideoVariaveis) =>
      corrigirVideo(videoUuid, payload),
    onMutate: ({ videoUuid }) =>
      aplicarOtimista(
        queryClient,
        tipo,
        pagina,
        (atual) => removerVideosDaPagina(atual, [videoUuid]),
        1
      ),
    onError: (erro, _variaveis, instantaneo) => {
      restaurar(queryClient, tipo, pagina, instantaneo)
      addToast({
        type: 'error',
        title: 'Não foi possível salvar a correção',
        description: extrairMensagemErroApi(erro, 'Tente de novo em instantes.'),
      })
    },
    onSuccess: (video) => {
      addToast({
        type: 'success',
        title: 'Correção salva',
        description: video.musica ? `Ligado a ${video.musica.titulo}.` : video.statusDescricao,
      })
    },
    onSettled: () => invalidarMusica(queryClient),
  })
}

export interface LoteVariaveis {
  videoUuids: string[]
  musicaUuid: string
}

export function useDefinirMusicaEmLote(tipo: TipoRevisao, pagina: number) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ videoUuids, musicaUuid }: LoteVariaveis) =>
      definirMusicaEmLote(videoUuids, musicaUuid),
    onMutate: ({ videoUuids }) =>
      aplicarOtimista(
        queryClient,
        tipo,
        pagina,
        (atual) => removerVideosDaPagina(atual, videoUuids),
        videoUuids.length
      ),
    onError: (erro, _variaveis, instantaneo) => {
      restaurar(queryClient, tipo, pagina, instantaneo)
      addToast({
        type: 'error',
        title: 'Não foi possível corrigir os vídeos',
        description: extrairMensagemErroApi(erro, 'Tente de novo em instantes.'),
      })
    },
    onSuccess: (afetados) => {
      addToast({
        type: 'success',
        title: 'Vídeos corrigidos',
        description: `${afetados} ${afetados === 1 ? 'vídeo ligado' : 'vídeos ligados'} à mesma música.`,
      })
    },
    onSettled: () => invalidarMusica(queryClient),
  })
}

export interface CanalVariaveis {
  canal: string
  classificacao: ClassificacaoCanal
}

export function useClassificarCanal(tipo: TipoRevisao, pagina: number) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ canal, classificacao }: CanalVariaveis) =>
      classificarCanal(canal, classificacao),
    onMutate: ({ canal }) =>
      tipo === 'canal_novo'
        ? aplicarOtimista(
            queryClient,
            tipo,
            pagina,
            (atual) => removerCanalDaPagina(atual, canal),
            1
          )
        : undefined,
    onError: (erro, _variaveis, instantaneo) => {
      restaurar(queryClient, tipo, pagina, instantaneo)
      addToast({
        type: 'error',
        title: 'Não foi possível salvar a regra do canal',
        description: extrairMensagemErroApi(erro, 'Tente de novo em instantes.'),
      })
    },
    onSuccess: (afetados, { canal, classificacao }) => {
      addToast({
        type: 'success',
        title:
          classificacao === 'musica'
            ? 'Canal marcado como música'
            : 'Canal marcado como não música',
        description: `${canal}: ${afetados} ${afetados === 1 ? 'vídeo atualizado' : 'vídeos atualizados'}.`,
      })
    },
    onSettled: () => invalidarMusica(queryClient),
  })
}

export interface UniaoVariaveis {
  origemUuid: string
  destinoUuid: string
}

export function useUnirMusicas(tipo: TipoRevisao | null = null, pagina = 1) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ origemUuid, destinoUuid }: UniaoVariaveis) =>
      unirMusicas(origemUuid, destinoUuid),
    onMutate: ({ origemUuid, destinoUuid }) =>
      tipo === 'possivel_duplicata'
        ? aplicarOtimista(
            queryClient,
            tipo,
            pagina,
            (atual) => removerDuplicataDaPagina(atual, [origemUuid, destinoUuid]),
            1
          )
        : undefined,
    onError: (erro, _variaveis, instantaneo) => {
      if (tipo) restaurar(queryClient, tipo, pagina, instantaneo)
      addToast({
        type: 'error',
        title: 'Não foi possível unir as músicas',
        description: extrairMensagemErroApi(erro, 'Tente de novo em instantes.'),
      })
    },
    onSuccess: (musica) => {
      addToast({
        type: 'success',
        title: 'Músicas unidas',
        description: `As reproduções agora contam para ${musica.titulo}.`,
      })
    },
    onSettled: () => invalidarMusica(queryClient),
  })
}

export function useDescartarDuplicata(pagina = 1) {
  const queryClient = useQueryClient()
  const tipo: TipoRevisao = 'possivel_duplicata'

  return useMutation({
    mutationFn: ({ origemUuid, destinoUuid }: UniaoVariaveis) =>
      descartarDuplicata(origemUuid, destinoUuid),
    onMutate: ({ origemUuid, destinoUuid }) =>
      aplicarOtimista(
        queryClient,
        tipo,
        pagina,
        (atual) => removerDuplicataDaPagina(atual, [origemUuid, destinoUuid]),
        1
      ),
    onError: (erro, _variaveis, instantaneo) => {
      restaurar(queryClient, tipo, pagina, instantaneo)
      addToast({
        type: 'error',
        title: 'Não foi possível salvar',
        description: extrairMensagemErroApi(erro, 'Tente de novo em instantes.'),
      })
    },
    onSuccess: () => {
      addToast({
        type: 'success',
        title: 'Marcadas como diferentes',
        description: 'As duas continuam separadas e este par não volta mais para a revisão.',
      })
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: REVISAO_QUERY_KEYS.todas }),
  })
}

export function useSepararVideo() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (videoUuid: string) => separarVideo(videoUuid),
    onError: (erro) => {
      addToast({
        type: 'error',
        title: 'Não foi possível separar a versão',
        description: extrairMensagemErroApi(erro, 'Tente de novo em instantes.'),
      })
    },
    onSuccess: () => {
      addToast({
        type: 'success',
        title: 'Versão separada',
        description: 'O vídeo saiu desta música e foi para a revisão.',
      })
    },
    onSettled: () => invalidarMusica(queryClient),
  })
}

export interface UniaoVariasVariaveis {
  origemUuids: string[]
  destinoUuid: string
}

export function useUnirVariasMusicas(tipo: TipoRevisao | null = null, pagina = 1) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ origemUuids, destinoUuid }: UniaoVariasVariaveis) =>
      unirVariasMusicas(origemUuids, destinoUuid),
    onMutate: ({ origemUuids }) =>
      tipo === 'possivel_duplicata'
        ? aplicarOtimista(
            queryClient,
            tipo,
            pagina,
            (atual) => removerDuplicataDaPagina(atual, origemUuids),
            1
          )
        : undefined,
    onError: (erro, _variaveis, instantaneo) => {
      if (tipo) restaurar(queryClient, tipo, pagina, instantaneo)
      addToast({
        type: 'error',
        title: 'Não foi possível ligar as versões',
        description: extrairMensagemErroApi(erro, 'Tente de novo em instantes.'),
      })
    },
    onSuccess: (musica) => {
      addToast({
        type: 'success',
        title: 'Versões ligadas',
        description: `As duas agora aparecem como versões de ${musica.titulo}, e as reproduções somam.`,
      })
    },
    onSettled: () => invalidarMusica(queryClient),
  })
}

export function useUnirArtistas() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ origemUuid, destinoUuid }: UniaoVariaveis) =>
      unirArtistas(origemUuid, destinoUuid),
    onError: (erro) => {
      addToast({
        type: 'error',
        title: 'Não foi possível unir os artistas',
        description: extrairMensagemErroApi(erro, 'Tente de novo em instantes.'),
      })
    },
    onSuccess: (artista) => {
      addToast({
        type: 'success',
        title: 'Artistas unidos',
        description: `O nome antigo virou um apelido de ${artista.nome}.`,
      })
    },
    onSettled: () => invalidarMusica(queryClient),
  })
}
