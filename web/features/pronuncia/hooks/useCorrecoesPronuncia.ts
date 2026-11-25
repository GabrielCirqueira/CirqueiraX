import { addToast } from '@/shared/components/ui/toaster'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  apagarExcecaoPronuncia,
  aprovarRelatoPronuncia,
  gerarPreviaPronuncia,
  listarExcecoesPronuncia,
  listarRelatosPronuncia,
  rejeitarRelatoPronuncia,
  salvarExcecaoPronuncia,
  sugerirCorrecaoPronuncia,
} from '../api'
import type { AprovarRelatoPayload } from '../types'
import { extrairMensagemErroApi } from '../utils'
import { PRONUNCIA_QUERY_KEYS } from './chavesQueryPronuncia'

function avisarErro(titulo: string) {
  return (erro: unknown) => {
    addToast({
      title: titulo,
      description: extrairMensagemErroApi(erro, 'Tente novamente em instantes.'),
      type: 'error',
    })
  }
}

function useInvalidarCorrecoes() {
  const queryClient = useQueryClient()
  return () => {
    queryClient.invalidateQueries({ queryKey: PRONUNCIA_QUERY_KEYS.todas })
  }
}

export function useRelatosPronuncia(todos: boolean, habilitado: boolean) {
  return useQuery({
    queryKey: PRONUNCIA_QUERY_KEYS.relatos(todos),
    queryFn: () => listarRelatosPronuncia(todos),
    enabled: habilitado,
  })
}

export function useExcecoesPronuncia(busca: string, habilitado: boolean) {
  return useQuery({
    queryKey: PRONUNCIA_QUERY_KEYS.excecoes(busca),
    queryFn: () => listarExcecoesPronuncia(busca),
    enabled: habilitado,
  })
}

export function useSugerirCorrecao() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: sugerirCorrecaoPronuncia,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PRONUNCIA_QUERY_KEYS.relatosTodos })
    },
    onError: avisarErro('A IA não conseguiu sugerir'),
  })
}

export function useAprovarRelato() {
  const invalidar = useInvalidarCorrecoes()
  return useMutation({
    mutationFn: ({ uuid, payload }: { uuid: string; payload: AprovarRelatoPayload }) =>
      aprovarRelatoPronuncia(uuid, payload),
    onSuccess: () => {
      invalidar()
      addToast({
        title: 'Correção aplicada',
        description: 'As palavras corrigidas já valem para todas as frases.',
        type: 'success',
      })
    },
    onError: avisarErro('Não foi possível aplicar a correção'),
  })
}

export function useRejeitarRelato() {
  const invalidar = useInvalidarCorrecoes()
  return useMutation({
    mutationFn: rejeitarRelatoPronuncia,
    onSuccess: invalidar,
    onError: avisarErro('Não foi possível rejeitar'),
  })
}

export function useSalvarExcecao() {
  const invalidar = useInvalidarCorrecoes()
  return useMutation({
    mutationFn: salvarExcecaoPronuncia,
    onSuccess: (excecao) => {
      invalidar()
      addToast({
        title: 'Pronúncia salva',
        description: `"${excecao.palavra}" agora sai como ${excecao.pronuncia} em todas as frases.`,
        type: 'success',
      })
    },
    onError: avisarErro('Não foi possível salvar a pronúncia'),
  })
}

export function useApagarExcecao() {
  const invalidar = useInvalidarCorrecoes()
  return useMutation({
    mutationFn: apagarExcecaoPronuncia,
    onSuccess: invalidar,
    onError: avisarErro('Não foi possível apagar'),
  })
}

export function usePreviaPronuncia() {
  return useMutation({
    mutationFn: gerarPreviaPronuncia,
    onError: avisarErro('Não foi possível gerar a prévia'),
  })
}
