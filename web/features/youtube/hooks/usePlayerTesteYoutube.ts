import { useCallback, useEffect, useRef, useState } from 'react'

const URL_API = 'https://www.youtube.com/iframe_api'
export const VIDEO_TESTE_PADRAO = 'M7lc1UVf-VE'
const TEMPO_LIMITE_API_MS = 15000
const TEMPO_LIMITE_PLAYER_MS = 20000
const TEMPO_LIMITE_AUDIO_MS = 25000
const TEMPO_LIMITE_REDE_MS = 8000
const INTERVALO_PROGRESSO_MS = 1000
const SEGUNDOS_PARA_CONFIRMAR_AUDIO = 2
const LARGURA_PLAYER = 356
const ALTURA_PLAYER = 200
const ESTADO_TOCANDO = 1
const ESTADO_PAUSADO = 2
const ENDERECOS_YOUTUBE = [
  { nome: 'Biblioteca do player (iframe_api)', url: URL_API },
  { nome: 'Site do YouTube', url: 'https://www.youtube.com/' },
  { nome: 'YouTube Music', url: 'https://music.youtube.com/' },
  { nome: 'Imagens e capas (i.ytimg.com)', url: 'https://i.ytimg.com/vi/M7lc1UVf-VE/default.jpg' },
  { nome: 'Vídeo e áudio (googlevideo.com)', url: 'https://redirector.googlevideo.com/' },
  { nome: 'Anúncios e métricas (doubleclick)', url: 'https://googleads.g.doubleclick.net/' },
]
const MENSAGENS_ERRO_PLAYER: Record<number, string> = {
  2: 'O código do vídeo é inválido.',
  5: 'O navegador não conseguiu tocar esse vídeo (erro do player HTML5).',
  100: 'O vídeo não existe ou é privado.',
  101: 'O dono do vídeo não permite tocar fora do YouTube.',
  150: 'O dono do vídeo não permite tocar fora do YouTube.',
}

export type EtapaPlayerTesteYoutube = 'api' | 'player' | 'audio'
export type SituacaoEtapaYoutube = 'aguardando' | 'executando' | 'ok' | 'falhou'

export interface EstadoEtapaYoutube {
  situacao: SituacaoEtapaYoutube
  detalhe: string | null
}

export interface ReproducaoTesteYoutube {
  titulo: string
  canal: string
  segundos: number
  duracao: number
  pausado: boolean
}

interface DadosVideoYoutube {
  title?: string
  author?: string
}

interface PlayerYoutube {
  playVideo: () => void
  pauseVideo: () => void
  loadVideoById: (id: string) => void
  getCurrentTime: () => number
  getDuration: () => number
  getPlayerState: () => number
  getVideoData?: () => DadosVideoYoutube
  destroy: () => void
}

interface ApiYoutube {
  Player: new (
    elemento: HTMLElement,
    opcoes: {
      width: number
      height: number
      videoId: string
      playerVars: Record<string, number | string>
      events: {
        onReady: () => void
        onError: (evento: { data: number }) => void
        onStateChange: (evento: { data: number }) => void
      }
    }
  ) => PlayerYoutube
}

declare global {
  interface Window {
    YT?: ApiYoutube & { loaded?: number }
    onYouTubeIframeAPIReady?: () => void
  }
}

const ETAPAS_INICIAIS: Record<EtapaPlayerTesteYoutube, EstadoEtapaYoutube> = {
  api: { situacao: 'aguardando', detalhe: null },
  player: { situacao: 'aguardando', detalhe: null },
  audio: { situacao: 'aguardando', detalhe: null },
}

export function extrairIdVideoYoutube(texto: string): string | null {
  const limpo = texto.trim()
  if (/^[\w-]{11}$/.test(limpo)) return limpo
  const encontrado =
    limpo.match(/[?&]v=([\w-]{11})/) ??
    limpo.match(/youtu\.be\/([\w-]{11})/) ??
    limpo.match(/\/(?:embed|shorts|live)\/([\w-]{11})/)
  return encontrado?.[1] ?? null
}

async function testarEndereco(url: string): Promise<string> {
  const controle = new AbortController()
  const limite = window.setTimeout(() => controle.abort(), TEMPO_LIMITE_REDE_MS)
  const inicio = performance.now()
  try {
    await fetch(url, { mode: 'no-cors', cache: 'no-store', signal: controle.signal })
    return `alcançável (${Math.round(performance.now() - inicio)} ms)`
  } catch (erro) {
    return controle.signal.aborted
      ? 'sem resposta em 8 s (provável bloqueio)'
      : `bloqueado (${String(erro)})`
  } finally {
    window.clearTimeout(limite)
  }
}

function carregarApi(): Promise<ApiYoutube> {
  if (window.YT?.Player) return Promise.resolve(window.YT)

  return new Promise((resolve, reject) => {
    const limite = window.setTimeout(
      () => reject(new Error('A biblioteca do player não carregou em 15 s.')),
      TEMPO_LIMITE_API_MS
    )
    window.onYouTubeIframeAPIReady = () => {
      window.clearTimeout(limite)
      if (window.YT) resolve(window.YT)
    }
    const script = document.createElement('script')
    script.src = URL_API
    script.async = true
    script.onerror = () => {
      window.clearTimeout(limite)
      reject(new Error(`O navegador não conseguiu baixar ${URL_API}.`))
    }
    document.body.appendChild(script)
  })
}

export function usePlayerTesteYoutube() {
  const [etapas, setEtapas] = useState(ETAPAS_INICIAIS)
  const [registros, setRegistros] = useState<string[]>([])
  const [reproducao, setReproducao] = useState<ReproducaoTesteYoutube | null>(null)
  const [playerPronto, setPlayerPronto] = useState(false)
  const playerRef = useRef<PlayerYoutube | null>(null)
  const containerRef = useRef<HTMLDivElement | null>(null)
  const progressoRef = useRef<number | null>(null)
  const limiteAudioRef = useRef<number | null>(null)
  const inicioAudioRef = useRef<number | null>(null)

  const registrar = useCallback((mensagem: string) => {
    const hora = new Date().toLocaleTimeString('pt-BR')
    setRegistros((atuais) => [...atuais, `${hora}  ${mensagem}`])
  }, [])

  const marcar = useCallback(
    (
      etapa: EtapaPlayerTesteYoutube,
      situacao: SituacaoEtapaYoutube,
      detalhe: string | null = null
    ) => {
      setEtapas((atuais) => ({ ...atuais, [etapa]: { situacao, detalhe } }))
    },
    []
  )

  const testarEnderecos = useCallback(async () => {
    registrar('Testando os endereços do YouTube a partir deste navegador…')
    for (const endereco of ENDERECOS_YOUTUBE) {
      registrar(`${endereco.nome}: ${await testarEndereco(endereco.url)}`)
    }
  }, [registrar])

  const pararAcompanhamento = useCallback(() => {
    if (progressoRef.current !== null) window.clearInterval(progressoRef.current)
    if (limiteAudioRef.current !== null) window.clearTimeout(limiteAudioRef.current)
    progressoRef.current = null
    limiteAudioRef.current = null
  }, [])

  const acompanharProgresso = useCallback(() => {
    pararAcompanhamento()
    inicioAudioRef.current = null
    limiteAudioRef.current = window.setTimeout(() => {
      limiteAudioRef.current = null
      registrar('O áudio não andou em 25 s.')
      marcar(
        'audio',
        'falhou',
        'O vídeo não começou. O proxy pode estar bloqueando googlevideo.com (de onde vem o som).'
      )
      void testarEnderecos()
    }, TEMPO_LIMITE_AUDIO_MS)

    progressoRef.current = window.setInterval(() => {
      const player = playerRef.current
      if (!player) return
      const segundos = player.getCurrentTime()
      const dados = player.getVideoData?.() ?? {}
      const pausado = player.getPlayerState() !== ESTADO_TOCANDO
      setReproducao({
        titulo: dados.title || 'Sem título',
        canal: dados.author || 'Canal desconhecido',
        segundos,
        duracao: player.getDuration(),
        pausado,
      })
      if (pausado || limiteAudioRef.current === null) return
      inicioAudioRef.current ??= segundos
      if (segundos - inicioAudioRef.current < SEGUNDOS_PARA_CONFIRMAR_AUDIO) return
      window.clearTimeout(limiteAudioRef.current)
      limiteAudioRef.current = null
      registrar(`Tocando de verdade: ${dados.title ?? 'vídeo'} (${Math.round(segundos)} s)`)
      marcar('audio', 'ok', 'O vídeo está andando nesta aba. Confira se o som sai.')
    }, INTERVALO_PROGRESSO_MS)
  }, [marcar, pararAcompanhamento, registrar, testarEnderecos])

  const criarPlayer = useCallback(
    (api: ApiYoutube, idVideo: string) =>
      new Promise<void>((resolve, reject) => {
        const container = containerRef.current
        if (!container) {
          reject(new Error('A área do player não está na tela.'))
          return
        }
        container.replaceChildren()
        const alvo = document.createElement('div')
        container.appendChild(alvo)
        const limite = window.setTimeout(
          () => reject(new Error('O player não ficou pronto em 20 s.')),
          TEMPO_LIMITE_PLAYER_MS
        )
        playerRef.current = new api.Player(alvo, {
          width: LARGURA_PLAYER,
          height: ALTURA_PLAYER,
          videoId: idVideo,
          playerVars: { playsinline: 1, rel: 0, origin: window.location.origin },
          events: {
            onReady: () => {
              window.clearTimeout(limite)
              registrar('Player pronto.')
              resolve()
            },
            onError: ({ data }) => {
              const mensagem =
                MENSAGENS_ERRO_PLAYER[data] ?? `Erro desconhecido do player (${data}).`
              registrar(`Erro do player ${data}: ${mensagem}`)
              marcar('audio', 'falhou', mensagem)
              pararAcompanhamento()
            },
            onStateChange: ({ data }) => {
              if (data === ESTADO_TOCANDO) registrar('Estado: tocando.')
              if (data === ESTADO_PAUSADO) registrar('Estado: pausado.')
            },
          },
        })
      }),
    [marcar, pararAcompanhamento, registrar]
  )

  const iniciar = useCallback(
    async (idVideo: string) => {
      pararAcompanhamento()
      playerRef.current?.destroy()
      playerRef.current = null
      setPlayerPronto(false)
      setReproducao(null)
      setEtapas(ETAPAS_INICIAIS)
      setRegistros([])

      marcar('api', 'executando')
      registrar(`Baixando ${URL_API}…`)
      let api: ApiYoutube
      try {
        api = await carregarApi()
      } catch (erro) {
        const mensagem = erro instanceof Error ? erro.message : 'Falha desconhecida.'
        registrar(mensagem)
        marcar('api', 'falhou', `${mensagem} Provavelmente o proxy bloqueia o YouTube.`)
        await testarEnderecos()
        return
      }
      marcar('api', 'ok', 'O navegador conseguiu baixar a biblioteca do player.')

      marcar('player', 'executando')
      try {
        await criarPlayer(api, idVideo)
      } catch (erro) {
        const mensagem = erro instanceof Error ? erro.message : 'Falha desconhecida.'
        registrar(mensagem)
        marcar('player', 'falhou', mensagem)
        await testarEnderecos()
        return
      }
      setPlayerPronto(true)
      marcar('player', 'ok', 'O player do YouTube abriu nesta aba.')
    },
    [criarPlayer, marcar, pararAcompanhamento, registrar, testarEnderecos]
  )

  const tocar = useCallback(() => {
    const player = playerRef.current
    if (!player) return
    marcar('audio', 'executando')
    registrar('Pedindo para tocar…')
    player.playVideo()
    acompanharProgresso()
  }, [acompanharProgresso, marcar, registrar])

  const trocarVideo = useCallback(
    (idVideo: string) => {
      const player = playerRef.current
      if (!player) return
      marcar('audio', 'executando')
      registrar(`Carregando o vídeo ${idVideo}…`)
      player.loadVideoById(idVideo)
      acompanharProgresso()
    },
    [acompanharProgresso, marcar, registrar]
  )

  const alternarPausa = useCallback(() => {
    const player = playerRef.current
    if (!player) return
    if (player.getPlayerState() === ESTADO_TOCANDO) {
      player.pauseVideo()
      return
    }
    player.playVideo()
  }, [])

  useEffect(
    () => () => {
      pararAcompanhamento()
      playerRef.current?.destroy()
    },
    [pararAcompanhamento]
  )

  return {
    containerRef,
    etapas,
    registros,
    reproducao,
    playerPronto,
    iniciar,
    tocar,
    trocarVideo,
    alternarPausa,
    testarEnderecos,
  }
}
