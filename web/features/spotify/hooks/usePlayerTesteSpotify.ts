import { useCallback, useEffect, useRef, useState } from 'react'
import { obterTokenPlayerSpotify, tocarMusicaTestePlayerSpotify } from '../api'
import { extrairMensagemErroApi } from '../utils'

const URL_SDK = 'https://sdk.scdn.co/spotify-player.js'
const TEMPO_LIMITE_SDK_MS = 15000
const TEMPO_LIMITE_PLAYER_MS = 40000
const TEMPO_LIMITE_AUDIO_MS = 20000
const NOME_DISPOSITIVO = 'CirqueiraX (teste)'
const VOLUME_INICIAL = 0.5
const TEMPO_LIMITE_REDE_MS = 8000
const ENDERECOS_SPOTIFY = [
  { nome: 'API do Spotify', url: 'https://api.spotify.com/v1' },
  {
    nome: 'Descoberta de servidores',
    url: 'https://apresolve.spotify.com/?type=dealer&type=spclient',
  },
  { nome: 'Conexão em tempo real (dealer)', url: 'https://dealer.spotify.com' },
  { nome: 'Servidor do player (spclient)', url: 'https://spclient.wg.spotify.com' },
  { nome: 'Licença do áudio (DRM)', url: 'https://gew1-spclient.spotify.com' },
  { nome: 'Áudio (CDN)', url: 'https://audio-ak-spotify-com.akamaized.net' },
]

export type EtapaPlayerTeste = 'sdk' | 'permissao' | 'player' | 'audio'
export type SituacaoEtapa = 'aguardando' | 'executando' | 'ok' | 'falhou'

export interface EstadoEtapa {
  situacao: SituacaoEtapa
  detalhe: string | null
}

export interface FaixaTocandoTeste {
  nome: string
  artistas: string
  pausado: boolean
}

interface ErroSdkSpotify {
  message: string
}

interface EstadoReproducaoSdk {
  paused: boolean
  track_window: {
    current_track: { name: string; artists: { name: string }[] }
  }
}

interface PlayerSdkSpotify {
  connect: () => Promise<boolean>
  disconnect: () => void
  togglePlay: () => Promise<void>
  activateElement: () => Promise<void>
  addListener: (evento: string, callback: (dados: never) => void) => boolean
}

interface SdkSpotify {
  Player: new (opcoes: {
    name: string
    getOAuthToken: (callback: (token: string) => void) => void
    volume: number
  }) => PlayerSdkSpotify
}

declare global {
  interface Window {
    Spotify?: SdkSpotify
    onSpotifyWebPlaybackSDKReady?: () => void
  }
}

const ETAPAS_INICIAIS: Record<EtapaPlayerTeste, EstadoEtapa> = {
  sdk: { situacao: 'aguardando', detalhe: null },
  permissao: { situacao: 'aguardando', detalhe: null },
  player: { situacao: 'aguardando', detalhe: null },
  audio: { situacao: 'aguardando', detalhe: null },
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

function suportaDrm(): Promise<boolean> {
  if (!navigator.requestMediaKeySystemAccess) return Promise.resolve(false)
  return navigator
    .requestMediaKeySystemAccess('com.widevine.alpha', [
      { audioCapabilities: [{ contentType: 'audio/mp4; codecs="mp4a.40.2"' }] },
    ])
    .then(() => true)
    .catch(() => false)
}

function carregarSdk(): Promise<SdkSpotify> {
  if (window.Spotify) return Promise.resolve(window.Spotify)

  return new Promise((resolve, reject) => {
    const limite = window.setTimeout(
      () => reject(new Error('A biblioteca não carregou em 15 s.')),
      TEMPO_LIMITE_SDK_MS
    )
    window.onSpotifyWebPlaybackSDKReady = () => {
      window.clearTimeout(limite)
      if (window.Spotify) resolve(window.Spotify)
    }
    const script = document.createElement('script')
    script.src = URL_SDK
    script.async = true
    script.onerror = () => {
      window.clearTimeout(limite)
      reject(new Error(`O navegador não conseguiu baixar ${URL_SDK}.`))
    }
    document.body.appendChild(script)
  })
}

export function usePlayerTesteSpotify() {
  const [etapas, setEtapas] = useState(ETAPAS_INICIAIS)
  const [registros, setRegistros] = useState<string[]>([])
  const [faixa, setFaixa] = useState<FaixaTocandoTeste | null>(null)
  const [precisaReconectar, setPrecisaReconectar] = useState(false)
  const [deviceId, setDeviceId] = useState<string | null>(null)
  const playerRef = useRef<PlayerSdkSpotify | null>(null)
  const limiteAudioRef = useRef<number | null>(null)

  const registrar = useCallback((mensagem: string) => {
    const hora = new Date().toLocaleTimeString('pt-BR')
    setRegistros((atuais) => [...atuais, `${hora}  ${mensagem}`])
  }, [])

  const marcar = useCallback(
    (etapa: EtapaPlayerTeste, situacao: SituacaoEtapa, detalhe: string | null = null) => {
      setEtapas((atuais) => ({ ...atuais, [etapa]: { situacao, detalhe } }))
    },
    []
  )

  const conectarPlayer = useCallback(
    (sdk: SdkSpotify) =>
      new Promise<string>((resolve, reject) => {
        const limite = window.setTimeout(
          () => reject(new Error('O player não ficou pronto em 40 s.')),
          TEMPO_LIMITE_PLAYER_MS
        )
        const player = new sdk.Player({
          name: NOME_DISPOSITIVO,
          volume: VOLUME_INICIAL,
          getOAuthToken: (callback) => {
            registrar('O player pediu o token ao CirqueiraX.')
            obterTokenPlayerSpotify()
              .then((token) => {
                callback(token.accessToken)
                registrar('Token entregue ao player. Aguardando o Spotify registrar o dispositivo…')
              })
              .catch(() => registrar('Falha ao buscar o token do player.'))
          },
        })
        const falhar = (tipo: string) => (erro: ErroSdkSpotify) => {
          window.clearTimeout(limite)
          registrar(`${tipo}: ${erro.message}`)
          reject(new Error(`${tipo}: ${erro.message}`))
        }
        player.addListener('initialization_error', falhar('Erro ao iniciar'))
        player.addListener('authentication_error', falhar('Erro de autenticação'))
        player.addListener('account_error', falhar('Erro de conta (precisa de Premium)'))
        player.addListener('playback_error', (erro: ErroSdkSpotify) =>
          registrar(`Erro de reprodução: ${erro.message}`)
        )
        player.addListener('not_ready', () => registrar('Dispositivo ficou offline.'))
        player.addListener('ready', ({ device_id }: { device_id: string }) => {
          window.clearTimeout(limite)
          registrar(`Dispositivo pronto: ${device_id}`)
          resolve(device_id)
        })
        player.addListener('player_state_changed', (estado: EstadoReproducaoSdk | null) => {
          if (!estado) return
          const atual = estado.track_window.current_track
          setFaixa({
            nome: atual.name,
            artistas: atual.artists.map((artista) => artista.name).join(', '),
            pausado: estado.paused,
          })
          if (estado.paused || limiteAudioRef.current === null) return
          window.clearTimeout(limiteAudioRef.current)
          limiteAudioRef.current = null
          registrar(`Tocando: ${atual.name}`)
          marcar('audio', 'ok', 'O som está saindo por esta aba.')
        })
        playerRef.current = player
        registrar('Chamando player.connect()…')
        player.connect().then((conectou) => {
          registrar(`player.connect() respondeu: ${conectou ? 'sim' : 'não'}`)
          if (conectou) return
          window.clearTimeout(limite)
          reject(new Error('O player recusou a conexão.'))
        })
      }),
    [marcar, registrar]
  )

  const iniciar = useCallback(async () => {
    setEtapas(ETAPAS_INICIAIS)
    setRegistros([])
    setPrecisaReconectar(false)
    playerRef.current?.disconnect()

    marcar('sdk', 'executando')
    registrar(`Baixando ${URL_SDK}…`)
    let sdk: SdkSpotify
    try {
      sdk = await carregarSdk()
    } catch (erro) {
      const mensagem = erro instanceof Error ? erro.message : 'Falha desconhecida.'
      registrar(mensagem)
      marcar('sdk', 'falhou', `${mensagem} Provavelmente o proxy bloqueia o Spotify.`)
      return
    }
    registrar('Biblioteca do Spotify carregada.')
    marcar('sdk', 'ok', 'O navegador conseguiu baixar a biblioteca do Spotify.')

    marcar('permissao', 'executando')
    try {
      const token = await obterTokenPlayerSpotify()
      if (!token.permissaoReproducao) {
        setPrecisaReconectar(true)
        registrar(`Faltam permissões: ${token.escoposFaltando.join(', ')}`)
        marcar('permissao', 'falhou', 'Reconecte o Spotify para liberar a reprodução.')
        return
      }
    } catch (erro) {
      const mensagem = extrairMensagemErroApi(erro, 'Não foi possível obter o token.')
      registrar(mensagem)
      marcar('permissao', 'falhou', mensagem)
      return
    }
    marcar('permissao', 'ok', 'A conta tem permissão de reprodução.')

    marcar('player', 'executando')
    registrar(
      `DRM Widevine no navegador: ${(await suportaDrm()) ? 'sim' : 'NÃO (o player não funciona sem ele)'}`
    )
    try {
      const id = await conectarPlayer(sdk)
      setDeviceId(id)
      marcar('player', 'ok', 'Esta aba virou um dispositivo do Spotify.')
    } catch (erro) {
      const mensagem = erro instanceof Error ? erro.message : 'Falha desconhecida.'
      registrar(mensagem)
      marcar(
        'player',
        'falhou',
        `${mensagem} Veja no registro quais endereços do Spotify estão bloqueados.`
      )
      registrar('Testando os endereços do Spotify a partir deste navegador…')
      for (const endereco of ENDERECOS_SPOTIFY) {
        registrar(`${endereco.nome}: ${await testarEndereco(endereco.url)}`)
      }
    }
  }, [conectarPlayer, marcar, registrar])

  const tocar = useCallback(async () => {
    const player = playerRef.current
    if (!player || !deviceId) return
    await player.activateElement()
    marcar('audio', 'executando')
    try {
      const musica = await tocarMusicaTestePlayerSpotify(deviceId)
      registrar(`Pedido para tocar: ${musica.nomeFaixa} · ${musica.artista}`)
    } catch (erro) {
      const mensagem = extrairMensagemErroApi(erro, 'O Spotify recusou o pedido para tocar.')
      registrar(mensagem)
      marcar('audio', 'falhou', mensagem)
      return
    }
    limiteAudioRef.current = window.setTimeout(() => {
      limiteAudioRef.current = null
      registrar('O áudio não começou em 20 s.')
      marcar('audio', 'falhou', 'O áudio não começou. O proxy pode estar bloqueando o streaming.')
    }, TEMPO_LIMITE_AUDIO_MS)
  }, [deviceId, marcar, registrar])

  const alternarPausa = useCallback(() => {
    void playerRef.current?.togglePlay()
  }, [])

  useEffect(
    () => () => {
      if (limiteAudioRef.current !== null) window.clearTimeout(limiteAudioRef.current)
      playerRef.current?.disconnect()
    },
    []
  )

  return {
    etapas,
    registros,
    faixa,
    precisaReconectar,
    playerPronto: deviceId !== null && etapas.player.situacao === 'ok',
    iniciar,
    tocar,
    alternarPausa,
  }
}
