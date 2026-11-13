;(() => {
  if (window.__cirqueiraxPagina) return
  window.__cirqueiraxPagina = true
  const ORIGEM = 'cirqueirax-youtube-music'
  const INTERVALO_MS = 1000

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
      anuncio:
        player.classList.contains('ad-showing') || player.classList.contains('ad-interrupting'),
    }
  }

  setInterval(() => {
    const dados = lerDadosDoPlayer()
    if (dados) window.postMessage({ origem: ORIGEM, dados }, location.origin)
  }, INTERVALO_MS)
})()
