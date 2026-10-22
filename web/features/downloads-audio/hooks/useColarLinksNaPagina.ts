import { extrairUrlsTexto } from '@/features/downloads-video/utils/extrairUrls'
import { useLatest, useMountEffect } from '@/shared/hooks'
import { isCampoDeTexto } from '../utils/audios'

export function useColarLinksNaPagina(onLinksColados: (urls: string[]) => void) {
  const callbackRef = useLatest(onLinksColados)

  useMountEffect(() => {
    function aoColar(evento: ClipboardEvent) {
      if (isCampoDeTexto(evento.target)) return
      const urls = extrairUrlsTexto(evento.clipboardData?.getData('text') ?? '')
      if (urls.length === 0) return
      evento.preventDefault()
      callbackRef.current(urls)
    }

    document.addEventListener('paste', aoColar)
    return () => document.removeEventListener('paste', aoColar)
  })
}
