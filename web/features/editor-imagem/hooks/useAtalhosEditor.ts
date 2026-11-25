import { addToast } from '@/shared/components/ui/toaster'
import { useMountEffect } from '@/shared/hooks'
import { useRef } from 'react'
import type { Anotacao, ComandoAtalho } from '../types'
import { extrairImagemDaTransferencia, isCampoDeTexto } from '../utils/areaTransferencia'
import {
  TIPO_AREA_TRANSFERENCIA_ANOTACAO,
  lerAnotacaoSerializada,
} from '../utils/areaTransferenciaAnotacoes'
import { interpretarAtalho } from '../utils/atalhosTeclado'

interface AcoesAtalhosEditor {
  aoColarImagem: (arquivo: File) => void
  aoExecutarComando: (comando: ComandoAtalho) => void
  /** Devolve o item serializado, ou null quando nada está selecionado. */
  aoCopiarSelecao: (recortar: boolean) => string | null
  aoColarAnotacao: (anotacao: Anotacao | null) => boolean
  aoColarTexto: (texto: string) => void
}

function isSelecaoDeTextoNaPagina(alvo: EventTarget | null): boolean {
  return isCampoDeTexto(alvo) || Boolean(window.getSelection()?.toString())
}

export function useAtalhosEditor(acoes: AcoesAtalhosEditor) {
  const acoesRef = useRef(acoes)
  acoesRef.current = acoes

  useMountEffect(() => {
    function aoCopiarOuRecortar(evento: ClipboardEvent, recortar: boolean) {
      if (isSelecaoDeTextoNaPagina(evento.target)) return
      evento.preventDefault()
      const conteudo = acoesRef.current.aoCopiarSelecao(recortar)
      if (conteudo) {
        // Grava o item e limpa o resto, para o próximo Ctrl + V colar a forma e não um print antigo.
        evento.clipboardData?.setData(TIPO_AREA_TRANSFERENCIA_ANOTACAO, conteudo)
        return
      }
      if (!recortar) acoesRef.current.aoExecutarComando({ tipo: 'copiar' })
    }

    function aoColar(evento: ClipboardEvent) {
      if (isCampoDeTexto(evento.target)) return
      const dados = evento.clipboardData
      const anotacao = lerAnotacaoSerializada(
        dados?.getData(TIPO_AREA_TRANSFERENCIA_ANOTACAO) ?? ''
      )
      if (anotacao) {
        evento.preventDefault()
        acoesRef.current.aoColarAnotacao(anotacao)
        return
      }
      const arquivo = extrairImagemDaTransferencia(dados)
      if (arquivo) {
        evento.preventDefault()
        acoesRef.current.aoColarImagem(arquivo)
        return
      }
      const texto = dados?.getData('text/plain') ?? ''
      if (texto.trim()) {
        evento.preventDefault()
        acoesRef.current.aoColarTexto(texto)
        return
      }
      if (acoesRef.current.aoColarAnotacao(null)) {
        evento.preventDefault()
        return
      }
      addToast({
        title: 'Nada para colar',
        description: 'Copie um print, uma imagem, um texto ou um item do editor e use Ctrl + V.',
        color: 'info',
      })
    }

    const copiar = (evento: ClipboardEvent) => aoCopiarOuRecortar(evento, false)
    const recortar = (evento: ClipboardEvent) => aoCopiarOuRecortar(evento, true)

    function aoTeclar(evento: KeyboardEvent) {
      const comando = interpretarAtalho(evento)
      if (!comando) return
      evento.preventDefault()
      acoesRef.current.aoExecutarComando(comando)
    }

    document.addEventListener('copy', copiar)
    document.addEventListener('cut', recortar)
    document.addEventListener('paste', aoColar)
    document.addEventListener('keydown', aoTeclar)
    return () => {
      document.removeEventListener('copy', copiar)
      document.removeEventListener('cut', recortar)
      document.removeEventListener('paste', aoColar)
      document.removeEventListener('keydown', aoTeclar)
    }
  })
}
