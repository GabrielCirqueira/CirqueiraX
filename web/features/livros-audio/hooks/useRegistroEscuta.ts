import { useEffect, useRef } from 'react'
import { obterUrlRegistroEscuta, registrarEscutaLivro } from '../api'

const INTERVALO_ENVIO_SEGUNDOS = 30

function enviarAoSair(uuid: string, segundos: number) {
  const token = localStorage.getItem('token')
  fetch(obterUrlRegistroEscuta(uuid), {
    method: 'POST',
    keepalive: true,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({ segundos }),
  }).catch(() => {})
}

export function useRegistroEscuta(livroUuid: string, tocando: boolean) {
  const acumuladoRef = useRef(0)
  const uuidRef = useRef(livroUuid)
  uuidRef.current = livroUuid

  useEffect(() => {
    if (!tocando) return
    let ultimo = Date.now()
    const intervalo = window.setInterval(() => {
      const agora = Date.now()
      acumuladoRef.current += Math.min(5, (agora - ultimo) / 1000)
      ultimo = agora
      if (acumuladoRef.current >= INTERVALO_ENVIO_SEGUNDOS) {
        const segundos = Math.round(acumuladoRef.current)
        acumuladoRef.current = 0
        registrarEscutaLivro(uuidRef.current, segundos).catch(() => {
          acumuladoRef.current += segundos
        })
      }
    }, 1000)
    return () => {
      window.clearInterval(intervalo)
      acumuladoRef.current += Math.min(5, (Date.now() - ultimo) / 1000)
      const segundos = Math.round(acumuladoRef.current)
      if (segundos >= 1) {
        acumuladoRef.current = 0
        registrarEscutaLivro(uuidRef.current, segundos).catch(() => {})
      }
    }
  }, [tocando])

  useEffect(() => {
    function aoSair() {
      const segundos = Math.round(acumuladoRef.current)
      if (segundos >= 1) {
        acumuladoRef.current = 0
        enviarAoSair(uuidRef.current, segundos)
      }
    }
    window.addEventListener('pagehide', aoSair)
    return () => window.removeEventListener('pagehide', aoSair)
  }, [])
}
