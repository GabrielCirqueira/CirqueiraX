;(() => {
  if (window.__cirqueiraxPagina) return
  window.__cirqueiraxPagina = true
  const ORIGEM = 'cirqueirax-youtube-music'
  const INTERVALO_MS = 1000
  const ESTADO_ANUNCIO_TOCANDO = 1
  const CLASSES_ANUNCIO = ['ad-showing', 'ad-interrupting']
  const SELETORES_ANUNCIO = '.ytp-ad-player-overlay, .ytp-ad-player-overlay-layout'

  function emAnuncio(player) {
    if (CLASSES_ANUNCIO.some((classe) => player.classList.contains(classe))) return true
    if (typeof player.getAdState === 'function' && player.getAdState() === ESTADO_ANUNCIO_TOCANDO)
      return true
    const sobreposicao = player.querySelector(SELETORES_ANUNCIO)
    return Boolean(sobreposicao && sobreposicao.offsetWidth > 0 && sobreposicao.offsetHeight > 0)
  }

  function lerDadosDoPlayer() {
    const player = document.querySelector('#movie_player')
    if (!player || typeof player.getVideoData !== 'function') return null
    const dados = player.getVideoData()
    if (!dados || !dados.video_id) return null
    const posicao = typeof player.getCurrentTime === 'function' ? player.getCurrentTime() : null
    const duracao = typeof player.getDuration === 'function' ? player.getDuration() : null
    const estado = typeof player.getPlayerState === 'function' ? player.getPlayerState() : null
    return {
      posicaoS: Number.isFinite(posicao) && posicao >= 0 ? posicao : null,
      duracaoS: Number.isFinite(duracao) && duracao > 0 ? duracao : null,
      estadoPlayer: Number.isInteger(estado) ? estado : null,
      videoId: dados.video_id,
      titulo: dados.title || '',
      autor: dados.author || '',
      anuncio: emAnuncio(player),
      lidoEmMs: Date.now(),
    }
  }

  function publicar() {
    const dados = lerDadosDoPlayer()
    if (dados) window.postMessage({ origem: ORIGEM, dados }, location.origin)
  }

  setInterval(publicar, INTERVALO_MS)
  for (const evento of ['play', 'pause', 'seeked', 'ended', 'loadedmetadata']) {
    document.addEventListener(evento, publicar, true)
  }
})()
