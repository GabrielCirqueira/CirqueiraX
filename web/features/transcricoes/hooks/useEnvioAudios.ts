import { addToast } from '@/shared/components/ui/toaster'
import { useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { enviarAudioTranscricao } from '../api'
import type { EnvioAudio, IdiomaTranscricao, TranscricaoResumo } from '../types'
import {
  ENVIOS_SIMULTANEOS,
  criarEnvio,
  executarComLimite,
  extrairMensagemErroApi,
  isEnvioFinalizado,
  separarArquivosAceitos,
} from '../utils'
import { TRANSCRICOES_QUERY_KEYS } from './chavesQueryTranscricoes'

export function useEnvioAudios(aoEnviar: (transcricao: TranscricaoResumo) => void) {
  const queryClient = useQueryClient()
  const [envios, setEnvios] = useState<EnvioAudio[]>([])

  function atualizarEnvio(id: string, mudancas: Partial<EnvioAudio>) {
    setEnvios((atuais) =>
      atuais.map((envio) => (envio.id === id ? { ...envio, ...mudancas } : envio))
    )
  }

  async function enviarUm(
    { envio, arquivo }: { envio: EnvioAudio; arquivo: File },
    idioma: IdiomaTranscricao
  ) {
    atualizarEnvio(envio.id, { situacao: 'enviando' })
    try {
      const transcricao = await enviarAudioTranscricao(arquivo, idioma, (percentual) =>
        atualizarEnvio(envio.id, { percentual })
      )
      atualizarEnvio(envio.id, { situacao: 'enviado', percentual: 100 })
      queryClient.invalidateQueries({ queryKey: TRANSCRICOES_QUERY_KEYS.todas })
      aoEnviar(transcricao)
    } catch (erro) {
      atualizarEnvio(envio.id, {
        situacao: 'falhou',
        erro: extrairMensagemErroApi(erro, 'Falha ao enviar o arquivo.'),
      })
    }
  }

  async function enviar(arquivos: File[], idioma: IdiomaTranscricao) {
    const { aceitos, recusados } = separarArquivosAceitos(arquivos)
    if (recusados.length > 0) {
      addToast({
        title:
          recusados.length === 1 ? 'Arquivo ignorado' : `${recusados.length} arquivos ignorados`,
        description: recusados.slice(0, 3).join(' · '),
        type: 'warning',
      })
    }
    if (aceitos.length === 0) return

    const itens = aceitos.map((arquivo, indice) => ({
      envio: criarEnvio(arquivo, indice),
      arquivo,
    }))
    setEnvios((atuais) => [
      ...itens.map((item) => item.envio),
      ...atuais.filter((e) => !isEnvioFinalizado(e)),
    ])
    await executarComLimite(itens, ENVIOS_SIMULTANEOS, (item) => enviarUm(item, idioma))
  }

  function limparFinalizados() {
    setEnvios((atuais) => atuais.filter((envio) => !isEnvioFinalizado(envio)))
  }

  const enviando = envios.some((envio) => !isEnvioFinalizado(envio))

  return { envios, enviando, enviar, limparFinalizados }
}
