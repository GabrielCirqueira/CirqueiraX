import { addToast } from '@/shared/components/ui/toaster'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  concluirOAuthGoogleFotos,
  desconectarGoogleFotos,
  listarTodasCategorias,
  obterAlbunsGoogleFotos,
  obterStatusGoogleFotos,
  obterUrlOAuthGoogleFotos,
  vincularAlbumCategoria,
} from '../api'

export const GOOGLE_FOTOS_QUERY_KEYS = {
  status: ['google-fotos', 'status'] as const,
  oauthUrl: ['google-fotos', 'oauth-url'] as const,
  albuns: ['google-fotos', 'albuns'] as const,
  categorias: ['google-fotos', 'todas-categorias'] as const,
}

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
    staleTime: Infinity,
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

