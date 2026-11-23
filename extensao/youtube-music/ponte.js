;(() => {
  if (globalThis.__cirqueiraxPonte) return
  globalThis.__cirqueiraxPonte = true
  const ORIGEM_SITE = 'cirqueirax-site'
  const ORIGEM_EXTENSAO = 'cirqueirax-extensao'
  const TIPOS_ACEITOS = ['ping', 'tocar', 'estado-agora']
  const VALIDADE_ESTADO_MS = 15000
  const VERSAO = chrome.runtime.getManifest().version

  function responder(pedidoId, resposta) {
    window.postMessage(
      { origem: ORIGEM_EXTENSAO, tipo: 'resposta', pedidoId, versao: VERSAO, ...resposta },
      location.origin
    )
  }

  function publicarTocandoAgora(estado) {
    window.postMessage(
      { origem: ORIGEM_EXTENSAO, tipo: 'tocando-agora', versao: VERSAO, estado },
      location.origin
    )
  }

  chrome.runtime.onMessage.addListener((mensagem) => {
    if (mensagem?.tipo === 'agora') publicarTocandoAgora(mensagem.estado ?? null)
    return false
  })

  window.addEventListener('message', (evento) => {
    if (evento.source !== window || evento.origin !== location.origin) return
    const dados = evento.data
    if (dados?.origem !== ORIGEM_SITE || !TIPOS_ACEITOS.includes(dados.tipo)) return
    if (dados.tipo === 'ping') {
      responder(dados.pedidoId, { ok: true })
      return
    }
    if (dados.tipo === 'estado-agora') {
      chrome.runtime
        .sendMessage({ tipo: 'estado-agora' })
        .then((registro) => {
          const recente = registro && Date.now() - registro.enviadoEmMs < VALIDADE_ESTADO_MS
          if (recente) publicarTocandoAgora(registro.estado)
        })
        .catch(() => undefined)
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
