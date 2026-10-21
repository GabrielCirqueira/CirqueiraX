import { addToast } from '@/shared/components/ui/toaster'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  concluirOAuthGoogleFotos,
  desconectarGoogleFotos,
  listarEnviosGoogleFotos,
  listarTodasCategorias,
  obterAlbunsGoogleFotos,
  obterResumoEnviosGoogleFotos,
  obterStatusGoogleFotos,
  obterUrlOAuthGoogleFotos,
  reenviarGoogleFotos,
  vincularAlbumCategoria,
} from '../api'
import type { StatusEnvioGoogleFotos } from '../types'
import { extrairMensagemErroApi } from '../utils/enviosGoogleFotos'

export const GOOGLE_FOTOS_QUERY_KEYS = {
  status: ['google-fotos', 'status'] as const,
  oauthUrl: ['google-fotos', 'oauth-url'] as const,
  albuns: ['google-fotos', 'albuns'] as const,
  categorias: ['google-fotos', 'todas-categorias'] as const,
  envios: ['google-fotos', 'envios'] as const,
  listaEnvios: (pagina: number, limite: number, status: StatusEnvioGoogleFotos | null) =>
    ['google-fotos', 'envios', 'lista', pagina, limite, status] as const,
  resumoEnvios: ['google-fotos', 'envios', 'resumo'] as const,
}

const INTERVALO_ATUALIZACAO_ENVIOS_MS = 15_000

export function useStatusGoogleFotos() {
  return useQuery({
    queryKey: GOOGLE_FOTOS_QUERY_KEYS.status,
    queryFn: obterStatusGoogleFotos,
    staleTime: 30_000,
  })
}

export function useAlbunsGoogleFotos(habilitado = true) {
  return useQuery({
    queryKey: GOOGLE_FOTOS_QUERY_KEYS.albuns,
    queryFn: obterAlbunsGoogleFotos,
    enabled: habilitado,
    staleTime: 60_000,
  })
}

export function useTodasCategorias() {
  return useQuery({
    queryKey: GOOGLE_FOTOS_QUERY_KEYS.categorias,
    queryFn: listarTodasCategorias,
    staleTime: 30_000,
  })
}

export interface VincularAlbumVariaveis {
  uuidCategoria: string
  googlePhotosAlbumId: string
  nomeCategoria?: string
}

export function useVincularAlbum() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ uuidCategoria, googlePhotosAlbumId }: VincularAlbumVariaveis) =>
      vincularAlbumCategoria(uuidCategoria, googlePhotosAlbumId),
    onSuccess: (_, variaveis) => {
      queryClient.invalidateQueries({ queryKey: GOOGLE_FOTOS_QUERY_KEYS.albuns })
      queryClient.invalidateQueries({ queryKey: ['categorias'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard', 'categorias'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard', 'resumo'] })

      addToast({
        title: 'Álbum vinculado com sucesso',
        description: variaveis.nomeCategoria
          ? `O álbum foi associado à categoria "${variaveis.nomeCategoria}".`
          : 'O álbum foi associado à categoria.',
        type: 'success',
      })
    },
    onError: (error: Error) => {
      addToast({
        title: 'Erro ao vincular álbum',
        description: error.message || 'Não foi possível vincular o álbum à categoria.',
        type: 'error',
      })
    },
  })
}

export function useUrlOAuthGoogleFotos(habilitado = false) {
  return useQuery({
    queryKey: GOOGLE_FOTOS_QUERY_KEYS.oauthUrl,
    queryFn: obterUrlOAuthGoogleFotos,
    enabled: habilitado,
    staleTime: Number.POSITIVE_INFINITY,
  })
}

export function useConectarGoogleFotos() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (codigoOuUrl: string) => concluirOAuthGoogleFotos(codigoOuUrl),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: GOOGLE_FOTOS_QUERY_KEYS.status })
      queryClient.invalidateQueries({ queryKey: GOOGLE_FOTOS_QUERY_KEYS.albuns })
      addToast({
        title: 'Google Fotos conectado com sucesso!',
        description: `A conta ${data.email} foi autorizada e está pronta para uso.`,
        type: 'success',
      })
    },
    onError: (error: Error) => {
      addToast({
        title: 'Erro ao conectar Google Fotos',
        description: error.message || 'Não foi possível concluir a autorização da conta.',
        type: 'error',
      })
    },
  })
}

export function useDesconectarGoogleFotos() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: desconectarGoogleFotos,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: GOOGLE_FOTOS_QUERY_KEYS.status })
      queryClient.invalidateQueries({ queryKey: GOOGLE_FOTOS_QUERY_KEYS.albuns })
      addToast({
        title: 'Conta desconectada',
        description: 'A conta do Google Fotos foi desconectada do CirqueiraX.',
        type: 'info',
      })
    },
    onError: (error: Error) => {
      addToast({
        title: 'Erro ao desconectar',
        description: error.message || 'Não foi possível desconectar a conta.',
        type: 'error',
      })
    },
  })
}

export function useEnviosGoogleFotos(
  pagina: number,
  limite: number,
  status: StatusEnvioGoogleFotos | null
) {
  return useQuery({
    queryKey: GOOGLE_FOTOS_QUERY_KEYS.listaEnvios(pagina, limite, status),
    queryFn: () => listarEnviosGoogleFotos(pagina, limite, status),
    placeholderData: (anterior) => anterior,
    refetchInterval: INTERVALO_ATUALIZACAO_ENVIOS_MS,
    refetchIntervalInBackground: false,
  })
}

export function useResumoEnviosGoogleFotos() {
  return useQuery({
    queryKey: GOOGLE_FOTOS_QUERY_KEYS.resumoEnvios,
    queryFn: obterResumoEnviosGoogleFotos,
    refetchInterval: INTERVALO_ATUALIZACAO_ENVIOS_MS,
    refetchIntervalInBackground: false,
  })
}

export function useReenviarGoogleFotos() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (uuidRegistro: string) => reenviarGoogleFotos(uuidRegistro),
    onSuccess: (registro) => {
      queryClient.invalidateQueries({ queryKey: GOOGLE_FOTOS_QUERY_KEYS.envios })
      addToast({
        title: 'Reenvio para o Google Fotos iniciado',
        description: registro.nomeArquivo
          ? `"${registro.nomeArquivo}" voltou para a fila de envio.`
          : 'A mídia voltou para a fila de envio.',
        type: 'success',
      })
    },
    onError: (erro: unknown) => {
      addToast({
        title: 'Não foi possível reenviar',
        description: extrairMensagemErroApi(
          erro,
          'Falha ao colocar a mídia de volta na fila de envio.'
        ),
        type: 'error',
      })
    },
  })
}
