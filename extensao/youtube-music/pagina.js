;(() => {
  const ORIGEM = 'cirqueirax-youtube-music'
  const INTERVALO_MS = 1000

  function lerDadosDoPlayer() {
    const player = document.querySelector('#movie_player')
    if (!player || typeof player.getVideoData !== 'function') return null
    const dados = player.getVideoData()
    if (!dados || !dados.video_id) return null
    return {
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
