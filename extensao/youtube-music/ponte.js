;(() => {
  if (globalThis.__cirqueiraxPonte) return
  globalThis.__cirqueiraxPonte = true
  const ORIGEM_SITE = 'cirqueirax-site'
  const ORIGEM_EXTENSAO = 'cirqueirax-extensao'
  const TIPOS_ACEITOS = ['ping', 'tocar']
  const VERSAO = chrome.runtime.getManifest().version

  function responder(pedidoId, resposta) {
    window.postMessage(
      { origem: ORIGEM_EXTENSAO, tipo: 'resposta', pedidoId, versao: VERSAO, ...resposta },
      location.origin
    )
  }

  window.addEventListener('message', (evento) => {
    if (evento.source !== window || evento.origin !== location.origin) return
    const dados = evento.data
    if (dados?.origem !== ORIGEM_SITE || !TIPOS_ACEITOS.includes(dados.tipo)) return
    if (dados.tipo === 'ping') {
      responder(dados.pedidoId, { ok: true })
      return
    }
    chrome.runtime
      .sendMessage({ tipo: 'tocar', videoId: dados.videoId })
      .then((resposta) => responder(dados.pedidoId, resposta ?? { ok: false }))
      .catch(() =>
        responder(dados.pedidoId, {
          ok: false,
          mensagem: 'A extensão foi atualizada. Recarregue esta página (F5).',
        })
      )
  })
})()
