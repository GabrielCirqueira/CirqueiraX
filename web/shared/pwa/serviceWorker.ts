function enviarMensagem(mensagem: { tipo: string }) {
  if (!('serviceWorker' in navigator)) return
  navigator.serviceWorker.ready
    .then((registro) => registro.active?.postMessage(mensagem))
    .catch(() => {})
}

export function registrarServiceWorker() {
  if (!import.meta.env.PROD || !('serviceWorker' in navigator)) return

  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/sw.js', { scope: '/' })
      .then(() => enviarMensagem({ tipo: 'preparar-offline' }))
      .catch(() => {})
  })
}

export function limparDadosOffline() {
  enviarMensagem({ tipo: 'limpar-dados' })
}
