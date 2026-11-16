import { useMountEffect } from '@/shared/hooks'
import { useCallback, useRef, useState } from 'react'

const MARGEM_ANTECIPACAO = '280px'

export function useVisibilidadeSecao(habilitado = true) {
  const [visivel, setVisivel] = useState(false)
  const observadorRef = useRef<IntersectionObserver | null>(null)

  useMountEffect(() => () => {
    observadorRef.current?.disconnect()
    observadorRef.current = null
  })

  const ref = useCallback(
    (node: HTMLDivElement | null) => {
      observadorRef.current?.disconnect()
      observadorRef.current = null

      if (!node || !habilitado || visivel) {
        return
      }

      if (typeof IntersectionObserver === 'undefined') {
        setVisivel(true)
        return
      }

      const observador = new IntersectionObserver(
        ([entrada]) => {
          if (!entrada?.isIntersecting) {
            return
          }
          setVisivel(true)
          observador.disconnect()
          observadorRef.current = null
        },
        { rootMargin: MARGEM_ANTECIPACAO }
      )

      observador.observe(node)
      observadorRef.current = observador
    },
    [habilitado, visivel]
  )

  return { ref, carregavel: habilitado && visivel }
}
