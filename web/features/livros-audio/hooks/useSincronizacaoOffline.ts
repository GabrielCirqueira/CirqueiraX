import { useAuthStore } from '@/stores/useAuthStore'
import { useConexaoStore } from '@/stores/useConexaoStore'
import { useQueryClient } from '@tanstack/react-query'
import axios from 'axios'
import { useEffect, useState } from 'react'
import { registrarEscutaLivro, salvarPosicaoLivroAudio } from '../api'
import {
  contarPendencias,
  descontarEscutaPendente,
  lerEscutaPendente,
  lerPosicoesPendentes,
  removerPosicaoPendente,
} from '../utils/pendenciasOffline'
import { LIVROS_AUDIO_QUERY_KEY } from './useLivrosAudio'

const MAXIMO_ESCUTA_POR_ENVIO = 120
const INTERVALO_TENTATIVA_MS = 60_000

let enviando = false

function falhouPorRede(erro: unknown): boolean {
  if (!axios.isAxiosError(erro)) return false
  const status = erro.response?.status
  return !status || status >= 500 || status === 401 || status === 408 || status === 429
}

export async function enviarPendenciasOffline(): Promise<boolean> {
  if (enviando || !navigator.onLine) return false
  enviando = true
  let enviouAlgo = false
  try {
    for (const [uuid, posicao] of Object.entries(lerPosicoesPendentes())) {
      try {
        await salvarPosicaoLivroAudio(uuid, posicao)
        enviouAlgo = true
        removerPosicaoPendente(uuid, posicao.registradaEm)
      } catch (erro) {
        if (falhouPorRede(erro)) return enviouAlgo
        removerPosicaoPendente(uuid, posicao.registradaEm)
      }
    }

    for (const [uuid, total] of Object.entries(lerEscutaPendente())) {
      let restante = total
      while (restante >= 1) {
        const segundos = Math.min(MAXIMO_ESCUTA_POR_ENVIO, restante)
        try {
          await registrarEscutaLivro(uuid, segundos)
          enviouAlgo = true
        } catch (erro) {
          if (falhouPorRede(erro)) return enviouAlgo
        }
        descontarEscutaPendente(uuid, segundos)
        restante -= segundos
      }
    }
    return enviouAlgo
  } finally {
    enviando = false
  }
}

export function useSincronizacaoOffline() {
  const queryClient = useQueryClient()
  const navegadorOnline = useConexaoStore((estado) => estado.navegadorOnline)
  const autenticado = useAuthStore((estado) => estado.autenticado)

  useEffect(() => {
    if (!navegadorOnline || !autenticado) return
    let ativo = true
    const tentar = () =>
      enviarPendenciasOffline().then((enviou) => {
        if (enviou && ativo) {
          queryClient.invalidateQueries({ queryKey: LIVROS_AUDIO_QUERY_KEY })
        }
      })
    tentar()
    const intervalo = window.setInterval(tentar, INTERVALO_TENTATIVA_MS)
    return () => {
      ativo = false
      window.clearInterval(intervalo)
    }
  }, [navegadorOnline, autenticado, queryClient])
}

export function usePendenciasOffline(): number {
  const [total, setTotal] = useState(contarPendencias)
  useEffect(() => {
    const atualizar = () => setTotal(contarPendencias())
    window.addEventListener('livros-audio:pendencias', atualizar)
    window.addEventListener('storage', atualizar)
    return () => {
      window.removeEventListener('livros-audio:pendencias', atualizar)
      window.removeEventListener('storage', atualizar)
    }
  }, [])
  return total
}
