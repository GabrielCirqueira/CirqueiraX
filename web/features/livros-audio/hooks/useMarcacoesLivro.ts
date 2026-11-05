import { addToast } from '@/shared/components/ui/toaster'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import axios from 'axios'
import {
  atualizarMarcacaoLivro,
  criarMarcacaoLivro,
  listarMarcacoesLivro,
  removerMarcacaoLivro,
} from '../api'
import type { CriarMarcacaoPayload, MarcacaoLivro } from '../types'
import { LIVROS_AUDIO_QUERY_KEY } from './useLivrosAudio'

function chaveMarcacoes(uuid: string) {
  return [...LIVROS_AUDIO_QUERY_KEY, uuid, 'marcacoes']
}

function mensagemErro(erro: unknown, padrao: string): string {
  if (axios.isAxiosError(erro)) {
    const corpo = erro.response?.data as { error?: string } | undefined
    return corpo?.error || padrao
  }
  return padrao
}

function ordenar(marcacoes: MarcacaoLivro[]): MarcacaoLivro[] {
  return [...marcacoes].sort(
    (a, b) =>
      a.pagina - b.pagina ||
      (a.numeroBloco ?? 0) - (b.numeroBloco ?? 0) ||
      (a.indiceTrecho ?? 0) - (b.indiceTrecho ?? 0) ||
      a.criadoEm.localeCompare(b.criadoEm)
  )
}

export function useMarcacoesLivro(uuid: string) {
  return useQuery({
    queryKey: chaveMarcacoes(uuid),
    queryFn: () => listarMarcacoesLivro(uuid),
    enabled: Boolean(uuid),
    staleTime: 60_000,
  })
}

export function useCriarMarcacao(uuid: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: CriarMarcacaoPayload) => criarMarcacaoLivro(uuid, payload),
    onSuccess: (marcacao) => {
      queryClient.setQueryData<MarcacaoLivro[]>(chaveMarcacoes(uuid), (atuais = []) =>
        ordenar([...atuais, marcacao])
      )
      addToast({
        title: `Salvo: ${marcacao.tipoDescricao.toLowerCase()}`,
        description: `Página ${marcacao.pagina}`,
        type: 'success',
      })
    },
    onError: (erro) => {
      addToast({
        title: 'Não foi possível salvar',
        description: mensagemErro(erro, 'Tente novamente em instantes.'),
        type: 'error',
      })
    },
  })
}

export function useAtualizarMarcacao(uuid: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ marcacao, nota }: { marcacao: string; nota: string | null }) =>
      atualizarMarcacaoLivro(uuid, marcacao, nota),
    onSuccess: (marcacao) => {
      queryClient.setQueryData<MarcacaoLivro[]>(chaveMarcacoes(uuid), (atuais = []) =>
        atuais.map((item) => (item.uuid === marcacao.uuid ? marcacao : item))
      )
    },
    onError: (erro) => {
      addToast({
        title: 'Não foi possível salvar a nota',
        description: mensagemErro(erro, 'Tente novamente em instantes.'),
        type: 'error',
      })
    },
  })
}

export function useRemoverMarcacao(uuid: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (marcacao: string) => removerMarcacaoLivro(uuid, marcacao),
    onSuccess: (_, marcacao) => {
      queryClient.setQueryData<MarcacaoLivro[]>(chaveMarcacoes(uuid), (atuais = []) =>
        atuais.filter((item) => item.uuid !== marcacao)
      )
    },
    onError: (erro) => {
      addToast({
        title: 'Não foi possível apagar',
        description: mensagemErro(erro, 'Tente novamente em instantes.'),
        type: 'error',
      })
    },
  })
}
