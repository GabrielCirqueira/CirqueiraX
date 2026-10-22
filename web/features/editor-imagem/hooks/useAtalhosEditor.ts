import { addToast } from '@/shared/components/ui/toaster'
import { useMountEffect } from '@/shared/hooks'
import { useRef } from 'react'
import type { ComandoAtalho } from '../types'
import { extrairImagemDaTransferencia, isCampoDeTexto } from '../utils/areaTransferencia'
import { interpretarAtalho } from '../utils/atalhosTeclado'

interface AcoesAtalhosEditor {
  aoColarImagem: (arquivo: File) => void
  aoExecutarComando: (comando: ComandoAtalho) => void
}

export function useAtalhosEditor(acoes: AcoesAtalhosEditor) {
  const acoesRef = useRef(acoes)
  acoesRef.current = acoes

  useMountEffect(() => {
    function aoColar(evento: ClipboardEvent) {
      if (isCampoDeTexto(evento.target)) return
      const arquivo = extrairImagemDaTransferencia(evento.clipboardData)
      if (!arquivo) {
        addToast({
          title: 'Nenhuma imagem para colar',
          description: 'Copie um print ou uma imagem e use Ctrl + V aqui.',
          color: 'info',
        })
        return
      }
      evento.preventDefault()
      acoesRef.current.aoColarImagem(arquivo)
    }

    function aoTeclar(evento: KeyboardEvent) {
      const comando = interpretarAtalho(evento)
      if (!comando) return
      evento.preventDefault()
      acoesRef.current.aoExecutarComando(comando)
    }

    document.addEventListener('paste', aoColar)
    document.addEventListener('keydown', aoTeclar)
    return () => {
      document.removeEventListener('paste', aoColar)
      document.removeEventListener('keydown', aoTeclar)
    }
  })
}
