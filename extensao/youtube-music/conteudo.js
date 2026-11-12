;(() => {
  const ORIGEM = 'cirqueirax-youtube-music'
  const INTERVALO_MS = 1000
  const INTERVALO_PROGRESSO_MS = 20000
  const DELTA_MAXIMO_MS = 2500
  const MS_MINIMO_PARA_REGISTRAR = 3000
  const VALIDADE_DADOS_PLAYER_MS = 5000
  const FRACAO_OUVIDA_COMPLETA = 0.9
  const MS_FINAL_DA_MUSICA = 5000
  const SEGUNDOS_INICIO_DA_MUSICA = 3
  const SEPARADOR_BYLINE = '•'
  const PADRAO_VIDEO_ID = /^[A-Za-z0-9_-]{11}$/
  const PADRAO_CAPA =
    /^https:\/\/(lh3\.googleusercontent\.com|yt3\.googleusercontent\.com|yt3\.ggpht\.com|i\.ytimg\.com)\//

  let dadosPlayer = null
  let dadosPlayerEm = 0
  let atual = null
  let ultimoTick = Date.now()

  window.addEventListener('message', (evento) => {
    if (evento.source !== window || evento.data?.origem !== ORIGEM) return
    dadosPlayer = evento.data.dados
    dadosPlayerEm = Date.now()
  })

  function dadosPlayerRecentes() {
    return dadosPlayer && Date.now() - dadosPlayerEm < VALIDADE_DADOS_PLAYER_MS ? dadosPlayer : null
  }

  function texto(seletor) {
    return document.querySelector(seletor)?.textContent?.trim() ?? ''
  }

  function lerVideoId() {
    const doPlayer = dadosPlayerRecentes()?.videoId
    if (doPlayer && PADRAO_VIDEO_ID.test(doPlayer)) return doPlayer
    const daUrl = new URL(location.href).searchParams.get('v')
    return daUrl && PADRAO_VIDEO_ID.test(daUrl) ? daUrl : null
  }

  function lerCanal() {
    const primeiro = texto('ytmusic-player-bar .byline').split(SEPARADOR_BYLINE)[0]?.trim()
    return primeiro || dadosPlayerRecentes()?.autor || ''
  }

  function lerCapa() {
    const endereco = document.querySelector('ytmusic-player-bar img.image')?.src ?? ''
    return PADRAO_CAPA.test(endereco) ? endereco : null
  }

  function emAnuncio() {
    return (
      Boolean(dadosPlayerRecentes()?.anuncio) ||
      Boolean(document.querySelector('#movie_player.ad-showing'))
    )
  }

  function lerMusica(video) {
    const videoId = lerVideoId()
    const titulo = dadosPlayerRecentes()?.titulo || texto('ytmusic-player-bar .title')
    if (!videoId || !titulo) return null
    const duracaoMs =
      Number.isFinite(video.duration) && video.duration > 0
        ? Math.round(video.duration * 1000)
        : null
    return { videoId, titulo, canal: lerCanal(), urlCapa: lerCapa(), duracaoMs }
  }

  function novaReproducao(musica, video, agora) {
    return {
      ...musica,
      idReproducao: crypto.randomUUID(),
      iniciadoEmMs: agora - Math.round(video.currentTime * 1000),
      msOuvidos: 0,
      ultimaPosicaoMs: 0,
      terminou: false,
      enviada: false,
      ultimoEnvioMs: 0,
      msNoUltimoEnvio: 0,
    }
  }

  function reiniciou(reproducao, video) {
    return (
      Boolean(reproducao.duracaoMs) &&
      reproducao.ultimaPosicaoMs >= reproducao.duracaoMs - MS_FINAL_DA_MUSICA &&
      video.currentTime < SEGUNDOS_INICIO_DA_MUSICA
    )
  }

  function ouviuAteOFim(reproducao, repetiu) {
    if (repetiu || reproducao.terminou) return true
    if (!reproducao.duracaoMs) return false
    return reproducao.ultimaPosicaoMs >= reproducao.duracaoMs * FRACAO_OUVIDA_COMPLETA
  }

  function enviar(reproducao, tipo, pulada) {
    if (!chrome.runtime?.id) return
    const evento = {
      idReproducao: reproducao.idReproducao,
      tipo,
      videoId: reproducao.videoId,
      titulo: reproducao.titulo,
      canal: reproducao.canal,
      urlCapa: reproducao.urlCapa,
      duracaoMs: reproducao.duracaoMs,
      msOuvidos: Math.round(reproducao.msOuvidos),
      iniciadoEmMs: reproducao.iniciadoEmMs,
      pulada: pulada ?? null,
    }
    chrome.runtime.sendMessage({ tipo: 'evento', evento }).catch(() => undefined)
    reproducao.enviada = true
    reproducao.ultimoEnvioMs = Date.now()
    reproducao.msNoUltimoEnvio = reproducao.msOuvidos
  }

  function encerrar(reproducao, repetiu) {
    if (reproducao.msOuvidos < MS_MINIMO_PARA_REGISTRAR) return
    enviar(reproducao, 'fim', !ouviuAteOFim(reproducao, repetiu))
  }

  function tick() {
    const agora = Date.now()
    const delta = Math.min(Math.max(0, agora - ultimoTick), DELTA_MAXIMO_MS)
    ultimoTick = agora
    const video = document.querySelector('video')
    if (!video || emAnuncio()) return
    const musica = lerMusica(video)
    if (!musica) return

    if (atual && atual.videoId !== musica.videoId) {
      encerrar(atual, false)
      atual = null
    }
    if (atual && reiniciou(atual, video)) {
      encerrar(atual, true)
      atual = null
    }
    if (!atual) atual = novaReproducao(musica, video, agora)

    atual.titulo = musica.titulo
    atual.canal = musica.canal || atual.canal
    atual.urlCapa = musica.urlCapa ?? atual.urlCapa
    atual.duracaoMs = musica.duracaoMs ?? atual.duracaoMs
    if (!video.paused && !video.ended) atual.msOuvidos += delta
    atual.ultimaPosicaoMs = Math.round(video.currentTime * 1000)
    if (video.ended) atual.terminou = true

    if (atual.msOuvidos < MS_MINIMO_PARA_REGISTRAR) return
    if (!atual.enviada) enviar(atual, 'inicio')
    if (
      agora - atual.ultimoEnvioMs >= INTERVALO_PROGRESSO_MS &&
      atual.msOuvidos !== atual.msNoUltimoEnvio
    )
      enviar(atual, 'progresso')
  }

  window.addEventListener('pagehide', () => {
    if (atual && atual.msOuvidos >= MS_MINIMO_PARA_REGISTRAR) enviar(atual, 'progresso')
  })

  const temporizador = setInterval(() => {
    if (!chrome.runtime?.id) {
      clearInterval(temporizador)
      return
    }
    tick()
  }, INTERVALO_MS)
})()
