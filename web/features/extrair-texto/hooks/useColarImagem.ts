import {
  extrairImagemDaTransferencia,
  isCampoDeTexto,
} from '@/features/editor-imagem/utils/areaTransferencia'
import { addToast } from '@/shared/components/ui/toaster'
import { useMountEffect } from '@/shared/hooks'
import { useRef } from 'react'

export function useColarImagem(aoColarImagem: (arquivo: File) => void) {
  const aoColarRef = useRef(aoColarImagem)
  aoColarRef.current = aoColarImagem

  useMountEffect(() => {
    function aoColar(evento: ClipboardEvent) {
      const arquivo = extrairImagemDaTransferencia(evento.clipboardData)
      if (arquivo) {
        evento.preventDefault()
        aoColarRef.current(arquivo)
        return
      }
      if (isCampoDeTexto(evento.target)) return
      addToast({
        title: 'Nenhuma imagem para colar',
        description: 'Copie um print ou uma imagem e use Ctrl + V aqui.',
        type: 'info',
      })
    }

    document.addEventListener('paste', aoColar)
    return () => document.removeEventListener('paste', aoColar)
  })
}
