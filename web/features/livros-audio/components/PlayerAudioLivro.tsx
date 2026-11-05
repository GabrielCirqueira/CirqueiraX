import { addToast } from '@/shared/components/ui/toaster'
import { Badge, Box, Button, Flex, HStack, IconButton, Slider, Text } from '@chakra-ui/react'
import { keepPreviousData, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  Bookmark,
  BookmarkCheck,
  ChevronLeft,
  ChevronRight,
  CloudDownload,
  Download,
  Gauge,
  ListMusic,
  LoaderCircle,
  Mic,
  Minus,
  Moon,
  Pause,
  Play,
  Plus,
  RotateCcw,
  RotateCw,
  SlidersHorizontal,
  Trash2,
  Volume1,
  Volume2,
  VolumeX,
  X,
} from 'lucide-react'
import { type MouseEvent, memo, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { abrirPdfEmNovaAba, listarLinksBlocos, listarTrechosBloco } from '../api'
import {
  LIVROS_AUDIO_QUERY_KEY,
  chaveTrechosBloco,
  useConfigurarNarracaoLivro,
  useRemoverVozLivro,
  useSolicitarVozLivro,
  useVozesLivro,
} from '../hooks/useLivrosAudio'
import { useCriarMarcacao } from '../hooks/useMarcacoesLivro'
import { type NarracaoAtual, useNarracaoAtual } from '../hooks/useNarracaoAtual'
import { useOfflineLivro } from '../hooks/useOfflineLivro'
import { useRegistroEscuta } from '../hooks/useRegistroEscuta'
import type {
  AlvoReproducao,
  LivroAudio,
  LivroAudioBloco,
  ModoDestaqueNarracao,
  TrechoNarracao,
  VozLivroAudio,
} from '../types'
import { obterIndiceLivro } from '../utils/capitulos'
import { encontrarIndiceTrecho } from '../utils/localizacaoNarracao'
import { chaveParteOffline, obterUrlAudioOffline } from '../utils/offline'
import type { PDFDocumentProxy } from '../utils/pdf'
import { encontrarBlocoPorPagina, formatarTempoAudio } from '../utils/sincronizacao'
import { PainelNarracao } from './PainelNarracao'
import { PainelVozes } from './PainelVozes'

interface PlayerAudioLivroProps {
  livro: LivroAudio
  blocos: LivroAudioBloco[]
  documento?: PDFDocumentProxy | null
  modoDuplo?: boolean
  onNarracaoAtual?: (narracao: NarracaoAtual | null) => void
  paginaAtualLeitor: number
  totalPaginas: number
  marcadorSalvo?: number
  salvandoMarcador?: boolean
  acompanharAudio: boolean
  onAlternarAcompanharAudio: () => void
  modoDestaque?: ModoDestaqueNarracao
  onAlternarModoDestaque?: () => void
  onMudarPaginaLeitor: (pagina: number) => void
  onAvancarPaginaLeitor?: () => void
  onVoltarPaginaLeitor?: () => void
  onSalvarPosicao: (pagina: number, bloco?: number | null, segundos?: number) => void
  onSalvarMarcador?: () => void
  alvoReproducao?: AlvoReproducao | null
}

const VELOCIDADE_MINIMA = 0.5
const VELOCIDADE_MAXIMA = 3
const ATALHOS_VELOCIDADE = [0.8, 1, 1.2, 1.5, 1.8, 2, 2.5]
const PAUSA_LONGA_MS = 30_000
const INTERVALO_RENOVACAO_LINKS = 5 * 60_000
const RECUO_AO_RETOMAR_SEGUNDOS = 5
const FADE_TIMER_MS = 15_000
const FADE_FIM_PARTE_SEGUNDOS = 10
const OPCOES_TIMER_MINUTOS = [15, 30, 45, 60]

type TimerSono = { tipo: 'minutos'; restanteMs: number } | { tipo: 'fim_parte' } | null

function formatarDuracaoCurta(segundosTotais: number): string {
  const total = Math.max(0, Math.round(segundosTotais / 60))
  const horas = Math.floor(total / 60)
  const minutos = total % 60
  if (horas === 0) return `${minutos} min`
  return `${horas}h${minutos.toString().padStart(2, '0')}`
}

function duracaoEstimadaDosBlocos(blocos: LivroAudioBloco[]): Map<number, number> {
  let segundosConhecidos = 0
  let paginasConhecidas = 0
  for (const bloco of blocos) {
    if (bloco.duracaoSegundos && bloco.duracaoSegundos > 0) {
      segundosConhecidos += bloco.duracaoSegundos
      paginasConhecidas += bloco.paginaFim - bloco.paginaInicio + 1
    }
  }
  const segundosPorPagina = paginasConhecidas > 0 ? segundosConhecidos / paginasConhecidas : 0

  return new Map(
    blocos.map((bloco) => [
      bloco.numeroBloco,
      bloco.duracaoSegundos && bloco.duracaoSegundos > 0
        ? bloco.duracaoSegundos
        : (bloco.paginaFim - bloco.paginaInicio + 1) * segundosPorPagina,
    ])
  )
}

function ajustarVelocidade(valor: number): number {
  const limitada = Math.min(VELOCIDADE_MAXIMA, Math.max(VELOCIDADE_MINIMA, valor))
  return Math.round(limitada * 10) / 10
}

function formatarVelocidade(valor: number): string {
  return `${valor.toFixed(1).replace('.', ',')}x`
}

function chaveVelocidadeLivro(livroUuid: string): string {
  return `livros-audio:velocidade:${livroUuid}`
}

function lerVelocidadeSalva(livroUuid: string): number {
  try {
    const salva = Number(localStorage.getItem(chaveVelocidadeLivro(livroUuid)))
    return Number.isFinite(salva) && salva > 0 ? ajustarVelocidade(salva) : 1
  } catch {
    return 1
  }
}

function salvarVelocidade(livroUuid: string, velocidade: number) {
  try {
    localStorage.setItem(chaveVelocidadeLivro(livroUuid), String(velocidade))
  } catch {}
}

function chaveVozLivro(livroUuid: string): string {
  return `livros-audio:voz:${livroUuid}`
}

function lerVozSalva(livroUuid: string): string | null {
  try {
    return localStorage.getItem(chaveVozLivro(livroUuid))
  } catch {
    return null
  }
}

function salvarVozEscolhida(livroUuid: string, voz: string | null) {
  try {
    if (voz) {
      localStorage.setItem(chaveVozLivro(livroUuid), voz)
    } else {
      localStorage.removeItem(chaveVozLivro(livroUuid))
    }
  } catch {}
}

function calcularTempoEquivalente(
  trechosAtuais: TrechoNarracao[],
  trechosNovos: TrechoNarracao[],
  segundos: number
): number | null {
  const indice = encontrarIndiceTrecho(trechosAtuais, segundos)
  const atual = trechosAtuais[indice]
  const novo = trechosNovos[indice]
  if (!atual || !novo) return null

  const duracaoAtual = Math.max(atual.fim - atual.inicio, 0.01)
  const fracao = Math.min(1, Math.max(0, (segundos - atual.inicio) / duracaoAtual))
  return novo.inicio + fracao * (novo.fim - novo.inicio)
}

export const PlayerAudioLivro = memo(function PlayerAudioLivro({
  livro,
  blocos,
  documento = null,
  modoDuplo = false,
  onNarracaoAtual,
  paginaAtualLeitor,
  totalPaginas,
  marcadorSalvo,
  salvandoMarcador = false,
  acompanharAudio,
  onAlternarAcompanharAudio,
  modoDestaque = 'frase',
  onAlternarModoDestaque,
  onMudarPaginaLeitor,
  onAvancarPaginaLeitor,
  onVoltarPaginaLeitor,
  onSalvarPosicao,
  onSalvarMarcador,
  alvoReproducao = null,
}: PlayerAudioLivroProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const ultimoSalvamentoRef = useRef<number>(0)
  const ultimoTempoRef = useRef<number>(0)
  const posicaoRetomadaRef = useRef(false)
  const deveTocarAoCarregarRef = useRef(false)
  const [tocando, setTocando] = useState(false)
  const tocandoRef = useRef(false)
  tocandoRef.current = tocando
  useRegistroEscuta(livro.uuid, tocando)
  const alvoPendenteRef = useRef<{ alvo: AlvoReproducao; criadoEm: number } | null>(null)
  const [versaoAlvo, setVersaoAlvo] = useState(0)
  const [metadadosCarregados, setMetadadosCarregados] = useState(0)
  const criarMarcacaoMutation = useCriarMarcacao(livro.uuid)
  const [tempoAtual, setTempoAtual] = useState(0)
  const [duracao, setDuracao] = useState(0)
  const [volume, setVolume] = useState(1)
  const [mutado, setMutado] = useState(false)
  const [mostrarVolume, setMostrarVolume] = useState(false)
  const [velocidade, setVelocidade] = useState(() => lerVelocidadeSalva(livro.uuid))
  const [mostrarVelocidade, setMostrarVelocidade] = useState(false)
  const [mostrarOffline, setMostrarOffline] = useState(false)
  const [abaSumario, setAbaSumario] = useState<'capitulos' | 'partes' | null>(null)
  const [mostrarSumario, setMostrarSumario] = useState(false)
  const [mostrarVozes, setMostrarVozes] = useState(false)
  const [mostrarAjustes, setMostrarAjustes] = useState(false)
  const [mostrarTimer, setMostrarTimer] = useState(false)
  const [timerSono, setTimerSono] = useState<TimerSono>(null)
  const pausadoEmRef = useRef<number | null>(null)
  const configurarNarracaoMutation = useConfigurarNarracaoLivro(livro.uuid)
  const [vozEscolhida, setVozEscolhida] = useState<string | null>(() => lerVozSalva(livro.uuid))
  const [vozEmAcao, setVozEmAcao] = useState<string | null>(null)
  const retomarEmRef = useRef<{ segundos: number; tocar: boolean } | null>(null)
  const queryClient = useQueryClient()
  const { data: vozes = [], isLoading: carregandoVozes } = useVozesLivro(livro.uuid)
  const solicitarVozMutation = useSolicitarVozLivro(livro.uuid)
  const removerVozMutation = useRemoverVozLivro(livro.uuid)

  const blocoInicial = useMemo(() => {
    if (blocos.length === 0) return null
    if (livro.blocoAtual) {
      const b = blocos.find((item) => item.numeroBloco === livro.blocoAtual)
      if (b?.isPronto) return b
    }
    const bPagina = encontrarBlocoPorPagina(blocos, livro.paginaAtual)
    if (bPagina?.isPronto) return bPagina
    return blocos.find((item) => item.isPronto) ?? blocos[0] ?? null
  }, [blocos, livro.blocoAtual, livro.paginaAtual])

  const [blocoSelecionado, setBlocoAtivo] = useState<LivroAudioBloco | null>(blocoInicial ?? null)
  const blocoAtivo = useMemo(
    () =>
      (blocoSelecionado &&
        blocos.find((bloco) => bloco.numeroBloco === blocoSelecionado.numeroBloco)) ??
      blocoSelecionado,
    [blocos, blocoSelecionado]
  )

  useEffect(() => {
    if (!blocoSelecionado && blocoInicial) {
      setBlocoAtivo(blocoInicial)
    }
  }, [blocoSelecionado, blocoInicial])

  const vozPrincipal = vozes.find((voz) => voz.principal) ?? null
  const vozSelecionada =
    vozes.find((voz) => voz.id === vozEscolhida && voz.blocosProntos.length > 0) ?? vozPrincipal

  const vozDoBlocoPara = useCallback(
    (numeroBloco: number, idVoz: string | null): string | null => {
      const voz = vozes.find((item) => item.id === idVoz)
      if (!voz || voz.principal || !voz.blocosProntos.includes(numeroBloco)) return null
      return voz.id
    },
    [vozes]
  )

  const vozDesejada = blocoAtivo ? vozDoBlocoPara(blocoAtivo.numeroBloco, vozEscolhida) : null
  const [vozCarregada, setVozCarregada] = useState<{ bloco: number; voz: string | null } | null>(
    null
  )
  const blocoJaCarregado = Boolean(blocoAtivo && vozCarregada?.bloco === blocoAtivo.numeroBloco)
  const vozDoBloco = blocoJaCarregado ? (vozCarregada?.voz ?? null) : vozDesejada
  const vozDoBlocoPronta = Boolean(blocoAtivo) && (blocoJaCarregado || !carregandoVozes)

  useEffect(() => {
    if (carregandoVozes || !blocoAtivo) return
    const numeroBloco = blocoAtivo.numeroBloco
    if (vozCarregada?.bloco === numeroBloco && vozCarregada.voz === vozDesejada) return

    const audio = audioRef.current
    const mesmoBloco = vozCarregada?.bloco === numeroBloco
    if (!mesmoBloco || !audio || audio.currentTime === 0) {
      setVozCarregada({ bloco: numeroBloco, voz: vozDesejada })
      return
    }

    let cancelado = false
    const vozAnterior = vozCarregada?.voz ?? null
    const segundos = audio.currentTime
    const tocar = !audio.paused
    const duracaoAnterior = audio.duration || 0

    const buscarTrechos = (voz: string | null) =>
      queryClient.fetchQuery({
        queryKey: chaveTrechosBloco(livro.uuid, numeroBloco, voz, blocoAtivo.atualizadoEm),
        queryFn: () => listarTrechosBloco(livro.uuid, numeroBloco, voz),
        staleTime: Number.POSITIVE_INFINITY,
      })

    Promise.all([buscarTrechos(vozAnterior), buscarTrechos(vozDesejada)])
      .then(([trechosAnteriores, trechosNovos]) => {
        const duracaoNova = trechosNovos.at(-1)?.fim ?? 0
        return (
          calcularTempoEquivalente(trechosAnteriores, trechosNovos, segundos) ??
          (duracaoAnterior > 0 && duracaoNova > 0
            ? (segundos / duracaoAnterior) * duracaoNova
            : segundos)
        )
      })
      .catch(() => segundos)
      .then((destino) => {
        if (cancelado) return
        retomarEmRef.current = { segundos: Math.max(0, destino), tocar }
        setVozCarregada({ bloco: numeroBloco, voz: vozDesejada })
      })

    return () => {
      cancelado = true
    }
  }, [carregandoVozes, blocoAtivo, vozDesejada, vozCarregada, queryClient, livro.uuid])

  const offline = useOfflineLivro(livro.uuid)
  const chavesOfflineRef = useRef(offline.chaves)
  chavesOfflineRef.current = offline.chaves
  const chaveOfflineAtiva =
    blocoAtivo?.isPronto && vozDoBlocoPronta
      ? chaveParteOffline(blocoAtivo.numeroBloco, vozDoBloco, blocoAtivo.atualizadoEm)
      : null
  const [fonteOffline, setFonteOffline] = useState<{ chave: string; url: string | null } | null>(
    null
  )

  useEffect(() => {
    if (!chaveOfflineAtiva || !offline.carregado || !blocoAtivo) return
    if (fonteOffline?.chave === chaveOfflineAtiva) return
    if (!chavesOfflineRef.current.has(chaveOfflineAtiva)) {
      setFonteOffline({ chave: chaveOfflineAtiva, url: null })
      return
    }
    let cancelado = false
    obterUrlAudioOffline(livro.uuid, blocoAtivo.numeroBloco, vozDoBloco, blocoAtivo.atualizadoEm)
      .catch(() => null)
      .then((url) => {
        if (cancelado) {
          if (url) URL.revokeObjectURL(url)
          return
        }
        setFonteOffline({ chave: chaveOfflineAtiva, url })
      })
    return () => {
      cancelado = true
    }
  }, [chaveOfflineAtiva, offline.carregado, fonteOffline, blocoAtivo, vozDoBloco, livro.uuid])

  useEffect(() => {
    const url = fonteOffline?.url
    if (!url) return
    return () => URL.revokeObjectURL(url)
  }, [fonteOffline?.url])

  const totalPartesProntas = blocos.filter((bloco) => bloco.isPronto).length
  const totalPartesVozesExtras = vozes.reduce(
    (total, voz) => (voz.principal ? total : total + voz.blocosProntos.length),
    0
  )
  const chaveLinks = [
    ...LIVROS_AUDIO_QUERY_KEY,
    livro.uuid,
    'links',
    totalPartesProntas,
    totalPartesVozesExtras,
  ]
  const { data: linksBlocos } = useQuery({
    queryKey: chaveLinks,
    queryFn: () => listarLinksBlocos(livro.uuid),
    enabled: totalPartesProntas > 0,
    staleTime: INTERVALO_RENOVACAO_LINKS,
    refetchInterval: INTERVALO_RENOVACAO_LINKS,
    refetchOnWindowFocus: false,
    placeholderData: keepPreviousData,
  })
  const urlAtivaRef = useRef<{ chave: string; url: string } | null>(null)
  const [versaoLinkAtivo, setVersaoLinkAtivo] = useState(0)
  const ultimaRenovacaoRef = useRef(0)

  const urlDaRede = useCallback(
    (numeroBloco: number, voz: string | null) =>
      linksBlocos?.find((link) => link.numeroBloco === numeroBloco && link.voz === voz)?.url ?? '',
    [linksBlocos]
  )

  const audioUrl = useMemo(() => {
    if (!blocoAtivo || !blocoAtivo.isPronto || !vozDoBlocoPronta || versaoLinkAtivo < 0) return ''
    if (!chaveOfflineAtiva || fonteOffline?.chave !== chaveOfflineAtiva) return ''
    if (fonteOffline.url) return fonteOffline.url
    const chave = `${blocoAtivo.numeroBloco}|${vozDoBloco ?? ''}|${blocoAtivo.atualizadoEm}`
    if (urlAtivaRef.current?.chave === chave) return urlAtivaRef.current.url
    const url = urlDaRede(blocoAtivo.numeroBloco, vozDoBloco)
    if (url) urlAtivaRef.current = { chave, url }
    return url
  }, [
    blocoAtivo,
    vozDoBloco,
    vozDoBlocoPronta,
    chaveOfflineAtiva,
    fonteOffline,
    urlDaRede,
    versaoLinkAtivo,
  ])

  function renovarLinkAposErro() {
    const audio = audioRef.current
    if (!audio || !audioUrl || audioUrl.startsWith('blob:')) return
    const agora = Date.now()
    if (agora - ultimaRenovacaoRef.current < 15000) return
    ultimaRenovacaoRef.current = agora
    retomarEmRef.current = { segundos: ultimoTempoRef.current, tocar: tocandoRef.current }
    urlAtivaRef.current = null
    queryClient
      .refetchQueries({ queryKey: [...LIVROS_AUDIO_QUERY_KEY, livro.uuid, 'links'] })
      .finally(() => setVersaoLinkAtivo((versao) => versao + 1))
  }

  const proximoBlocoPronto = blocoAtivo
    ? (blocos.find((b) => b.numeroBloco === blocoAtivo.numeroBloco + 1 && b.isPronto) ?? null)
    : null
  const vozProximoBloco = proximoBlocoPronto
    ? vozDoBlocoPara(proximoBlocoPronto.numeroBloco, vozEscolhida)
    : null
  const proximoEstaOffline = Boolean(
    proximoBlocoPronto &&
      offline.chaves.has(
        chaveParteOffline(
          proximoBlocoPronto.numeroBloco,
          vozProximoBloco,
          proximoBlocoPronto.atualizadoEm
        )
      )
  )
  const urlProximoBloco =
    proximoBlocoPronto && !proximoEstaOffline
      ? urlDaRede(proximoBlocoPronto.numeroBloco, vozProximoBloco)
      : ''

  useEffect(() => {
    if (!tocando || !proximoBlocoPronto) return
    if (!vozProximoBloco && !proximoBlocoPronto.possuiTrechos) return
    const numero = proximoBlocoPronto.numeroBloco
    queryClient.prefetchQuery({
      queryKey: chaveTrechosBloco(
        livro.uuid,
        numero,
        vozProximoBloco,
        proximoBlocoPronto.atualizadoEm
      ),
      queryFn: () => listarTrechosBloco(livro.uuid, numero, vozProximoBloco),
      staleTime: Number.POSITIVE_INFINITY,
    })
  }, [tocando, proximoBlocoPronto, vozProximoBloco, queryClient, livro.uuid])

  useEffect(() => {
    if (!audioUrl) setTocando(false)
  }, [audioUrl])

  const duracoesBlocos = useMemo(() => duracaoEstimadaDosBlocos(blocos), [blocos])
  const duracaoLivro = useMemo(
    () => [...duracoesBlocos.values()].reduce((total, segundos) => total + segundos, 0),
    [duracoesBlocos]
  )
  const inicioBlocoNoLivro = useMemo(() => {
    if (!blocoAtivo) return 0
    let total = 0
    for (const bloco of blocos) {
      if (bloco.numeroBloco >= blocoAtivo.numeroBloco) break
      total += duracoesBlocos.get(bloco.numeroBloco) ?? 0
    }
    return total
  }, [blocos, blocoAtivo, duracoesBlocos])
  const duracaoBlocoNoLivro = blocoAtivo ? (duracoesBlocos.get(blocoAtivo.numeroBloco) ?? 0) : 0
  const fracaoNoBloco = duracao > 0 ? Math.min(1, tempoAtual / duracao) : 0
  const decorridoLivro = inicioBlocoNoLivro + fracaoNoBloco * duracaoBlocoNoLivro
  const fracaoLivro = duracaoLivro > 0 ? Math.min(1, decorridoLivro / duracaoLivro) : 0
  const restanteLivro = Math.max(0, duracaoLivro - decorridoLivro) / velocidade

  useEffect(() => {
    if (audioRef.current) audioRef.current.playbackRate = velocidade
  }, [velocidade, audioUrl])

  const fatorVolumeTimer = useMemo(() => {
    if (!timerSono) return 1
    if (timerSono.tipo === 'minutos') return Math.min(1, timerSono.restanteMs / FADE_TIMER_MS)
    if (duracao <= 0) return 1
    return Math.min(1, Math.max(0, (duracao - tempoAtual) / FADE_FIM_PARTE_SEGUNDOS))
  }, [timerSono, duracao, tempoAtual])

  useEffect(() => {
    const audio = audioRef.current
    if (audio) audio.volume = Math.max(0, Math.min(1, (mutado ? 0 : volume) * fatorVolumeTimer))
  }, [volume, mutado, fatorVolumeTimer, audioUrl])

  useEffect(() => {
    if (timerSono?.tipo !== 'minutos' || !tocando) return
    let ultimo = Date.now()
    const intervalo = window.setInterval(() => {
      const agora = Date.now()
      const passou = agora - ultimo
      ultimo = agora
      setTimerSono((atual) => {
        if (atual?.tipo !== 'minutos') return atual
        const restanteMs = atual.restanteMs - passou
        if (restanteMs <= 0) {
          audioRef.current?.pause()
          return null
        }
        return { tipo: 'minutos', restanteMs }
      })
    }, 250)
    return () => window.clearInterval(intervalo)
  }, [timerSono?.tipo, tocando])

  const obterTempoAtual = useCallback(() => audioRef.current?.currentTime ?? null, [])
  const narracao = useNarracaoAtual({
    livroUuid: livro.uuid,
    bloco: blocoAtivo,
    documento,
    voz: vozDoBloco,
    segundos: tempoAtual,
    tocando,
    obterTempoAtual,
  })
  const paginaNarrada = narracao?.pagina ?? null
  const paginaNarradaRef = useRef<number | null>(paginaNarrada)
  paginaNarradaRef.current = paginaNarrada
  const audioFoiUsadoRef = useRef(false)
  const onNarracaoAtualRef = useRef(onNarracaoAtual)
  onNarracaoAtualRef.current = onNarracaoAtual
  const paginaLeitorRef = useRef({ pagina: paginaAtualLeitor, modoDuplo, onMudarPaginaLeitor })
  paginaLeitorRef.current = { pagina: paginaAtualLeitor, modoDuplo, onMudarPaginaLeitor }

  useEffect(() => {
    onNarracaoAtualRef.current?.(audioFoiUsadoRef.current ? narracao : null)
  }, [narracao])

  useEffect(() => {
    if (!acompanharAudio || paginaNarrada === null || (!tocando && !audioFoiUsadoRef.current))
      return
    if (alvoPendenteRef.current) return
    const leitor = paginaLeitorRef.current
    const visivel =
      paginaNarrada === leitor.pagina || (leitor.modoDuplo && paginaNarrada === leitor.pagina + 1)
    if (!visivel) {
      leitor.onMudarPaginaLeitor(paginaNarrada)
    }
  }, [paginaNarrada, acompanharAudio, tocando])

  const salvarProgresso = useCallback(
    (segundos: number) => {
      if (!blocoAtivo) return
      const pagina = paginaNarradaRef.current ?? blocoAtivo.paginaInicio
      onSalvarPosicao(pagina, blocoAtivo.numeroBloco, Math.floor(segundos))
    },
    [blocoAtivo, onSalvarPosicao]
  )

  const salvarProgressoRef = useRef(salvarProgresso)
  salvarProgressoRef.current = salvarProgresso

  useEffect(() => {
    if (!acompanharAudio || !blocoAtivo || alvoPendenteRef.current) return
    const blocoDaPagina = encontrarBlocoPorPagina(blocos, paginaAtualLeitor)
    if (blocoDaPagina?.isPronto && blocoDaPagina.numeroBloco !== blocoAtivo.numeroBloco) {
      deveTocarAoCarregarRef.current = tocando
      setBlocoAtivo(blocoDaPagina)
      setTempoAtual(0)
    }
  }, [paginaAtualLeitor, acompanharAudio, blocos, blocoAtivo, tocando])

  useEffect(() => {
    if (!('mediaSession' in navigator) || !blocoAtivo) return

    navigator.mediaSession.metadata = new MediaMetadata({
      title: livro.titulo,
      artist: `Capítulo ${blocoAtivo.numeroBloco} (Págs. ${blocoAtivo.paginaInicio}-${blocoAtivo.paginaFim})`,
      album: 'CirqueiraX Livros',
    })

    navigator.mediaSession.setActionHandler('play', () => {
      const audio = audioRef.current
      if (!audio) return
      recuarAposPausaLonga(audio)
      audio.play()
    })
    navigator.mediaSession.setActionHandler('pause', () => {
      audioRef.current?.pause()
    })
    navigator.mediaSession.setActionHandler('seekbackward', () => {
      if (audioRef.current)
        audioRef.current.currentTime = Math.max(0, audioRef.current.currentTime - 15)
    })
    navigator.mediaSession.setActionHandler('seekforward', () => {
      if (audioRef.current)
        audioRef.current.currentTime = Math.min(duracao, audioRef.current.currentTime + 15)
    })
    navigator.mediaSession.setActionHandler('previoustrack', () => {
      retrocederBloco()
    })
    navigator.mediaSession.setActionHandler('nexttrack', () => {
      avancarBloco()
    })
  }, [blocoAtivo, livro.titulo, duracao])

  useEffect(() => {
    function salvarAoSair() {
      if (ultimoTempoRef.current > 0) {
        salvarProgressoRef.current(ultimoTempoRef.current)
      }
    }
    window.addEventListener('pagehide', salvarAoSair)
    return () => {
      window.removeEventListener('pagehide', salvarAoSair)
      salvarAoSair()
    }
  }, [])

  function irParaPaginaVisivel(audio: HTMLAudioElement): boolean {
    if (!acompanharAudio || !narracao || !blocoAtivo) return false
    const visivel =
      narracao.pagina === paginaAtualLeitor ||
      (modoDuplo && narracao.pagina === paginaAtualLeitor + 1)
    if (visivel) return false

    const paginas = modoDuplo ? [paginaAtualLeitor, paginaAtualLeitor + 1] : [paginaAtualLeitor]
    for (const pagina of paginas) {
      if (pagina < blocoAtivo.paginaInicio || pagina > blocoAtivo.paginaFim) continue
      const inicio = narracao.inicioDaPagina(pagina)
      if (inicio !== null) {
        audio.currentTime = inicio
        setTempoAtual(inicio)
        return true
      }
    }
    return false
  }

  const iniciarAlvo = useCallback(
    (alvo: AlvoReproducao) => {
      const bloco = blocos.find((item) => item.numeroBloco === alvo.numeroBloco)
      if (!bloco?.isPronto) {
        addToast({
          title: 'Essa parte ainda não tem áudio',
          description: 'Espere a narração dessa parte ficar pronta.',
          type: 'info',
        })
        return
      }
      alvoPendenteRef.current = { alvo, criadoEm: Date.now() }
      posicaoRetomadaRef.current = true
      if (blocoAtivo?.numeroBloco !== bloco.numeroBloco) {
        if (audioRef.current && blocoAtivo) salvarProgressoRef.current(audioRef.current.currentTime)
        audioRef.current?.pause()
        deveTocarAoCarregarRef.current = false
        retomarEmRef.current = null
        ultimoTempoRef.current = 0
        setBlocoAtivo(bloco)
        setTempoAtual(0)
      }
      setVersaoAlvo((versao) => versao + 1)
      window.setTimeout(() => setVersaoAlvo((versao) => versao + 1), 4000)
    },
    [blocos, blocoAtivo]
  )

  const iniciarAlvoRef = useRef(iniciarAlvo)
  iniciarAlvoRef.current = iniciarAlvo

  useEffect(() => {
    if (alvoReproducao) iniciarAlvoRef.current(alvoReproducao)
  }, [alvoReproducao])

  useEffect(() => {
    const pendente = alvoPendenteRef.current
    const audio = audioRef.current
    if (!pendente || !audio || !blocoAtivo || versaoAlvo < 0 || metadadosCarregados < 0) return
    if (blocoAtivo.numeroBloco !== pendente.alvo.numeroBloco) return
    if (audio.readyState < 1 || !Number.isFinite(audio.duration) || audio.duration <= 0) return

    let segundos = narracao ? narracao.resolverAlvo(pendente.alvo) : null
    if (segundos === undefined) {
      if (Date.now() - pendente.criadoEm < 3500) return
      segundos = null
    }
    if (segundos === null) {
      const paginas = blocoAtivo.paginaFim - blocoAtivo.paginaInicio + 1
      const fracao = Math.min(
        1,
        Math.max(0, (pendente.alvo.pagina - blocoAtivo.paginaInicio) / Math.max(1, paginas))
      )
      segundos = fracao * audio.duration
    }

    alvoPendenteRef.current = null
    const destino = Math.min(Math.max(0, segundos), Math.max(0, audio.duration - 0.25))
    audio.currentTime = destino
    setTempoAtual(destino)
    pausadoEmRef.current = null
    audioFoiUsadoRef.current = true
    audio.play().catch(() => {})
  }, [versaoAlvo, metadadosCarregados, narracao, blocoAtivo])

  const { data: indiceLivro, isLoading: carregandoIndice } = useQuery({
    queryKey: [...LIVROS_AUDIO_QUERY_KEY, livro.uuid, 'indice', documento?.fingerprints?.[0] ?? ''],
    queryFn: () => (documento ? obterIndiceLivro(documento) : null),
    enabled: Boolean(documento) && mostrarSumario,
    staleTime: Number.POSITIVE_INFINITY,
  })
  const capitulos = indiceLivro?.capitulos ?? []
  const aba = abaSumario ?? (capitulos.length > 0 || carregandoIndice ? 'capitulos' : 'partes')
  const indiceCapituloAtual = (() => {
    const referencia = paginaNarrada ?? paginaAtualLeitor
    let atual = -1
    capitulos.forEach((capitulo, indice) => {
      if (capitulo.pagina <= referencia) atual = indice
    })
    return atual
  })()

  function ouvirCapitulo(pagina: number) {
    const bloco = encontrarBlocoPorPagina(blocos, pagina)
    setMostrarSumario(false)
    onMudarPaginaLeitor(pagina)
    if (bloco) iniciarAlvo({ id: Date.now(), numeroBloco: bloco.numeroBloco, pagina })
  }

  function marcarAqui() {
    const audio = audioRef.current
    if (narracao && blocoAtivo && audio && audioFoiUsadoRef.current) {
      criarMarcacaoMutation.mutate({
        tipo: 'marcador',
        pagina: narracao.pagina,
        numeroBloco: blocoAtivo.numeroBloco,
        indiceTrecho: narracao.indice >= 0 ? narracao.indice : null,
        segundos: Math.floor(audio.currentTime),
        texto: narracao.texto,
      })
    } else {
      const bloco = encontrarBlocoPorPagina(blocos, paginaAtualLeitor)
      criarMarcacaoMutation.mutate({
        tipo: 'marcador',
        pagina: paginaAtualLeitor,
        numeroBloco: bloco?.numeroBloco ?? null,
      })
    }
    onSalvarMarcador?.()
  }

  function alternarPlayPause() {
    const audio = audioRef.current
    if (!audio || !audioUrl) return
    if (tocando) {
      audio.pause()
    } else {
      if (irParaPaginaVisivel(audio)) {
        pausadoEmRef.current = null
      } else {
        recuarAposPausaLonga(audio)
      }
      audio.play().catch(() => {})
    }
  }

  function recuarAposPausaLonga(audio: HTMLAudioElement) {
    const pausadoEm = pausadoEmRef.current
    pausadoEmRef.current = null
    if (pausadoEm === null || Date.now() - pausadoEm < PAUSA_LONGA_MS) return
    const destino = Math.max(0, audio.currentTime - RECUO_AO_RETOMAR_SEGUNDOS)
    audio.currentTime = destino
    setTempoAtual(destino)
  }

  function escolherTimer(minutos: number | 'fim_parte' | null) {
    setMostrarTimer(false)
    if (minutos === null) {
      setTimerSono(null)
    } else if (minutos === 'fim_parte') {
      setTimerSono({ tipo: 'fim_parte' })
    } else {
      setTimerSono({ tipo: 'minutos', restanteMs: minutos * 60_000 })
    }
  }

  function irParaPosicaoDoLivro(fracao: number) {
    if (!blocoAtivo || duracaoLivro <= 0) return
    const alvo = Math.min(1, Math.max(0, fracao)) * duracaoLivro
    let acumulado = 0
    for (const bloco of blocos) {
      const segundos = duracoesBlocos.get(bloco.numeroBloco) ?? 0
      if (alvo < acumulado + segundos || bloco === blocos[blocos.length - 1]) {
        if (!bloco.isPronto) return
        const fracaoBloco = segundos > 0 ? (alvo - acumulado) / segundos : 0
        if (bloco.numeroBloco === blocoAtivo.numeroBloco) {
          const audio = audioRef.current
          if (!audio || duracao <= 0) return
          audio.currentTime = fracaoBloco * duracao
          setTempoAtual(audio.currentTime)
        } else {
          const tocar = tocando
          selecionarBloco(bloco)
          deveTocarAoCarregarRef.current = false
          retomarEmRef.current = { segundos: fracaoBloco * (bloco.duracaoSegundos ?? 0), tocar }
        }
        return
      }
      acumulado += segundos
    }
  }

  function pularTempo(segundosOffset: number) {
    if (!audioRef.current) return
    const novoTempo = Math.min(duracao, Math.max(0, audioRef.current.currentTime + segundosOffset))
    audioRef.current.currentTime = novoTempo
    setTempoAtual(novoTempo)
  }

  function mudarVelocidade(valor: number) {
    const nova = ajustarVelocidade(valor)
    setVelocidade(nova)
    salvarVelocidade(livro.uuid, nova)
    if (audioRef.current) audioRef.current.playbackRate = nova
  }

  const partesParaBaixar = blocoAtivo
    ? blocos.filter(
        (bloco) =>
          bloco.isPronto &&
          bloco.numeroBloco >= blocoAtivo.numeroBloco &&
          !offline.chaves.has(
            chaveParteOffline(
              bloco.numeroBloco,
              vozDoBlocoPara(bloco.numeroBloco, vozEscolhida),
              bloco.atualizadoEm
            )
          )
      )
    : []
  const partesGuardadas = blocos.filter((bloco) => offline.numeros.has(bloco.numeroBloco)).length

  function baixarParaOffline(quantidade: number | null) {
    const escolhidas =
      quantidade === null ? partesParaBaixar : partesParaBaixar.slice(0, quantidade)
    offline.baixar(escolhidas, (numeroBloco) => vozDoBlocoPara(numeroBloco, vozEscolhida))
  }

  async function apagarOffline() {
    if (!window.confirm('Apagar deste aparelho as partes guardadas para ouvir offline?')) return
    await offline.remover()
  }

  function mudarVolume(novoVol: number) {
    setVolume(novoVol)
    setMutado(novoVol === 0)
  }

  function alternarMudo() {
    if (mutado) {
      setMutado(false)
      if (volume <= 0) setVolume(1)
    } else {
      setMutado(true)
    }
  }

  function selecionarVoz(voz: VozLivroAudio) {
    const novaVoz = voz.principal ? null : voz.id
    setVozEscolhida(novaVoz)
    salvarVozEscolhida(livro.uuid, novaVoz)
  }

  async function gerarVoz(voz: VozLivroAudio) {
    setVozEmAcao(voz.id)
    try {
      await solicitarVozMutation.mutateAsync(voz.id)
    } finally {
      setVozEmAcao(null)
    }
  }

  async function removerVoz(voz: VozLivroAudio) {
    if (!window.confirm(`Apagar o áudio da voz ${voz.nome} deste livro?`)) return
    setVozEmAcao(voz.id)
    try {
      if (vozEscolhida === voz.id) {
        const principal = vozes.find((item) => item.principal)
        if (principal) selecionarVoz(principal)
      }
      await removerVozMutation.mutateAsync(voz.id)
    } finally {
      setVozEmAcao(null)
    }
  }

  function selecionarBloco(novoBloco: LivroAudioBloco) {
    if (!novoBloco.isPronto) return
    if (blocoAtivo && audioRef.current) {
      salvarProgresso(audioRef.current.currentTime)
    }
    deveTocarAoCarregarRef.current = true
    ultimoTempoRef.current = 0
    setBlocoAtivo(novoBloco)
    setTempoAtual(0)
    setMostrarSumario(false)
    if (acompanharAudio) {
      onMudarPaginaLeitor(novoBloco.paginaInicio)
    }
  }

  function avancarBloco() {
    if (!blocoAtivo) return
    const proximo = blocos.find((b) => b.numeroBloco === blocoAtivo.numeroBloco + 1 && b.isPronto)
    if (proximo) {
      selecionarBloco(proximo)
    }
  }

  function retrocederBloco() {
    if (!blocoAtivo) return
    const anterior = blocos.find((b) => b.numeroBloco === blocoAtivo.numeroBloco - 1 && b.isPronto)
    if (anterior) {
      selecionarBloco(anterior)
    }
  }

  const temProximo = Boolean(
    blocoAtivo && blocos.some((b) => b.numeroBloco === blocoAtivo.numeroBloco + 1 && b.isPronto)
  )

  const isPosicaoSalva = marcadorSalvo !== undefined && paginaAtualLeitor === marcadorSalvo
  function baixarPdf() {
    abrirPdfEmNovaAba(livro.uuid).catch(() =>
      addToast({ title: 'Não foi possível abrir o PDF', type: 'error' })
    )
  }

  return (
    <Box
      position="fixed"
      bottom={0}
      left={0}
      right={0}
      bg="cirqueira.grey.950/95"
      backdropFilter="blur(20px)"
      borderTop="1px solid"
      borderColor="cirqueira.grey.900"
      boxShadow="0 -10px 40px rgba(0, 0, 0, 0.7)"
      px={{ base: 3, md: 6 }}
      py={2.5}
      zIndex={45}
    >
      {audioUrl && (
        <audio
          ref={audioRef}
          src={audioUrl}
          preload="auto"
          onPlay={() => {
            audioFoiUsadoRef.current = true
            setTocando(true)
            if ('mediaSession' in navigator) navigator.mediaSession.playbackState = 'playing'
          }}
          onPause={() => {
            setTocando(false)
            if (audioRef.current && !audioRef.current.ended) pausadoEmRef.current = Date.now()
            if (audioRef.current) salvarProgresso(audioRef.current.currentTime)
            if ('mediaSession' in navigator) navigator.mediaSession.playbackState = 'paused'
          }}
          onLoadedMetadata={() => {
            if (audioRef.current) {
              setDuracao(audioRef.current.duration || 0)
              setMetadadosCarregados((total) => total + 1)
              if (alvoPendenteRef.current) {
                retomarEmRef.current = null
                deveTocarAoCarregarRef.current = false
              }
              audioRef.current.playbackRate = velocidade
              const retomarEm = retomarEmRef.current
              if (retomarEm) {
                retomarEmRef.current = null
                posicaoRetomadaRef.current = true
                audioRef.current.currentTime = retomarEm.segundos
                setTempoAtual(retomarEm.segundos)
                if (retomarEm.tocar) deveTocarAoCarregarRef.current = true
              }
              if (!posicaoRetomadaRef.current) {
                posicaoRetomadaRef.current = true
                if (blocoAtivo?.numeroBloco === livro.blocoAtual && livro.segundosNoBloco > 0) {
                  const retomada = Math.max(0, livro.segundosNoBloco - RECUO_AO_RETOMAR_SEGUNDOS)
                  audioRef.current.currentTime = retomada
                  setTempoAtual(retomada)
                }
              }
              if (deveTocarAoCarregarRef.current) {
                deveTocarAoCarregarRef.current = false
                audioRef.current.play().catch(() => {})
              }
            }
          }}
          onTimeUpdate={() => {
            if (!audioRef.current || !blocoAtivo) return
            const atual = audioRef.current.currentTime
            ultimoTempoRef.current = atual
            setTempoAtual(atual)

            const agora = Date.now()
            if (agora - ultimoSalvamentoRef.current > 6000) {
              ultimoSalvamentoRef.current = agora
              salvarProgresso(atual)
            }
          }}
          onSeeked={() => {
            audioFoiUsadoRef.current = true
          }}
          onError={renovarLinkAposErro}
          onEnded={() => {
            setTocando(false)
            if (timerSono?.tipo === 'fim_parte') {
              setTimerSono(null)
              return
            }
            if (temProximo) {
              avancarBloco()
            }
          }}
        >
          <track kind="captions" />
        </audio>
      )}

      {urlProximoBloco && audioFoiUsadoRef.current && (
        <audio src={urlProximoBloco} preload="auto" muted style={{ display: 'none' }}>
          <track kind="captions" />
        </audio>
      )}

      {mostrarAjustes && (
        <PainelNarracao
          livro={livro}
          salvando={configurarNarracaoMutation.isPending}
          onSalvar={(payload) =>
            configurarNarracaoMutation.mutate(payload, {
              onSuccess: () => setMostrarAjustes(false),
            })
          }
          onFechar={() => setMostrarAjustes(false)}
        />
      )}

      {mostrarOffline && (
        <Box
          position="absolute"
          bottom="calc(100% + 8px)"
          right={{ base: 4, md: 24 }}
          w={{ base: 'calc(100vw - 32px)', sm: '320px' }}
          bg="cirqueira.grey.900"
          border="1px solid"
          borderColor="cirqueira.grey.800"
          borderRadius="2xl"
          p={3}
          boxShadow="0 20px 50px rgba(0, 0, 0, 0.9)"
          zIndex={60}
        >
          <HStack justify="space-between" mb={1.5}>
            <HStack gap={2} color="cirqueira.brand.400">
              <CloudDownload size={14} />
              <Text fontSize="xs" fontWeight="bold" color="white">
                Ouvir offline
              </Text>
            </HStack>
            <IconButton
              size="2xs"
              variant="ghost"
              color="cirqueira.grey.400"
              _hover={{ color: 'white' }}
              onClick={() => setMostrarOffline(false)}
              aria-label="Fechar ouvir offline"
            >
              <X size={12} />
            </IconButton>
          </HStack>
          {!offline.suportado ? (
            <Text fontSize="11px" color="cirqueira.grey.300">
              Este navegador não deixa guardar áudio. Abra o site pelo Safari ou Chrome atualizado.
            </Text>
          ) : (
            <>
              <Text fontSize="11px" color="cirqueira.grey.400" mb={2.5}>
                Guarda as próximas partes neste aparelho, na voz escolhida, para ouvir sem internet
                com o livro aberto.
              </Text>
              {offline.progresso ? (
                <Box mb={2}>
                  <Text fontSize="11px" color="cirqueira.grey.200" mb={1}>
                    Baixando parte {offline.progresso.atual} de {offline.progresso.total}…
                  </Text>
                  <Box h="4px" bg="rgba(255,255,255,0.08)" borderRadius="full">
                    <Box
                      h="full"
                      borderRadius="full"
                      bg="cirqueira.brand.500"
                      w={`${
                        ((offline.progresso.atual - 1 + offline.progresso.fracaoParte) /
                          offline.progresso.total) *
                        100
                      }%`}
                    />
                  </Box>
                </Box>
              ) : (
                <Flex gap={1} flexWrap="wrap" mb={2.5}>
                  {[3, 5, 10].map((quantidade) => (
                    <Button
                      key={quantidade}
                      size="xs"
                      variant="subtle"
                      disabled={partesParaBaixar.length === 0}
                      onClick={() => baixarParaOffline(quantidade)}
                    >
                      Próximas {quantidade}
                    </Button>
                  ))}
                  <Button
                    size="xs"
                    variant="subtle"
                    disabled={partesParaBaixar.length === 0}
                    onClick={() => baixarParaOffline(null)}
                  >
                    Todas que faltam ({partesParaBaixar.length})
                  </Button>
                </Flex>
              )}
              <HStack justify="space-between">
                <Text fontSize="11px" color="cirqueira.grey.300">
                  {partesGuardadas > 0
                    ? `${partesGuardadas} parte(s) guardada(s) · ${(offline.tamanho / 1_048_576).toFixed(0)} MB`
                    : 'Nada guardado ainda'}
                </Text>
                {partesGuardadas > 0 && !offline.progresso && (
                  <Button size="2xs" variant="ghost" colorPalette="red" onClick={apagarOffline}>
                    <Trash2 size={11} />
                    Apagar
                  </Button>
                )}
              </HStack>
            </>
          )}
        </Box>
      )}

      {mostrarVelocidade && (
        <Box
          position="absolute"
          bottom="calc(100% + 8px)"
          right={{ base: 4, md: 24 }}
          w={{ base: 'calc(100vw - 32px)', sm: '300px' }}
          bg="cirqueira.grey.900"
          border="1px solid"
          borderColor="cirqueira.grey.800"
          borderRadius="2xl"
          p={3}
          boxShadow="0 20px 50px rgba(0, 0, 0, 0.9)"
          zIndex={60}
        >
          <HStack justify="space-between" mb={2}>
            <HStack gap={2} color="cirqueira.brand.400">
              <Gauge size={14} />
              <Text fontSize="xs" fontWeight="bold" color="white">
                Velocidade
              </Text>
            </HStack>
            <IconButton
              size="2xs"
              variant="ghost"
              color="cirqueira.grey.400"
              _hover={{ color: 'white' }}
              onClick={() => setMostrarVelocidade(false)}
              aria-label="Fechar velocidade"
            >
              <X size={12} />
            </IconButton>
          </HStack>
          <HStack gap={2} mb={2.5}>
            <IconButton
              size="xs"
              variant="subtle"
              disabled={velocidade <= VELOCIDADE_MINIMA}
              onClick={() => mudarVelocidade(velocidade - 0.1)}
              aria-label="Diminuir velocidade"
            >
              <Minus size={13} />
            </IconButton>
            <Slider.Root
              size="sm"
              colorPalette="brand"
              value={[velocidade]}
              min={VELOCIDADE_MINIMA}
              max={VELOCIDADE_MAXIMA}
              step={0.1}
              onValueChange={(detalhes) => mudarVelocidade(detalhes.value[0] ?? 1)}
              flex={1}
              aria-label={['Velocidade da narração']}
            >
              <Slider.Control>
                <Slider.Track bg="rgba(255,255,255,0.1)">
                  <Slider.Range bg="cirqueira.brand.500" />
                </Slider.Track>
                <Slider.Thumb index={0} />
              </Slider.Control>
            </Slider.Root>
            <IconButton
              size="xs"
              variant="subtle"
              disabled={velocidade >= VELOCIDADE_MAXIMA}
              onClick={() => mudarVelocidade(velocidade + 0.1)}
              aria-label="Aumentar velocidade"
            >
              <Plus size={13} />
            </IconButton>
            <Text
              fontSize="sm"
              fontWeight="bold"
              color="white"
              minW="42px"
              textAlign="right"
              fontVariantNumeric="tabular-nums"
            >
              {formatarVelocidade(velocidade)}
            </Text>
          </HStack>
          <Flex gap={1} flexWrap="wrap">
            {ATALHOS_VELOCIDADE.map((valor) => (
              <Button
                key={valor}
                size="2xs"
                variant={velocidade === valor ? 'solid' : 'subtle'}
                colorPalette={velocidade === valor ? 'brand' : 'gray'}
                onClick={() => mudarVelocidade(valor)}
                fontVariantNumeric="tabular-nums"
              >
                {formatarVelocidade(valor)}
              </Button>
            ))}
          </Flex>
          <Text fontSize="10px" color="cirqueira.grey.500" mt={2}>
            Fica guardada para este livro neste aparelho.
          </Text>
        </Box>
      )}

      {mostrarTimer && (
        <Box
          position="absolute"
          bottom="calc(100% + 8px)"
          right={{ base: 4, md: 24 }}
          w="220px"
          bg="cirqueira.grey.900"
          border="1px solid"
          borderColor="cirqueira.grey.800"
          borderRadius="2xl"
          p={2.5}
          boxShadow="0 20px 50px rgba(0, 0, 0, 0.9)"
          zIndex={60}
        >
          <HStack justify="space-between" mb={1.5} px={1}>
            <HStack gap={2} color="cirqueira.brand.400">
              <Moon size={14} />
              <Text fontSize="xs" fontWeight="bold" color="white">
                Timer de sono
              </Text>
            </HStack>
            <IconButton
              size="2xs"
              variant="ghost"
              color="cirqueira.grey.400"
              _hover={{ color: 'white' }}
              onClick={() => setMostrarTimer(false)}
              aria-label="Fechar timer"
            >
              <X size={12} />
            </IconButton>
          </HStack>
          <Flex direction="column" gap={1}>
            {OPCOES_TIMER_MINUTOS.map((minutos) => (
              <Button
                key={minutos}
                size="xs"
                variant="subtle"
                justifyContent="flex-start"
                onClick={() => escolherTimer(minutos)}
              >
                {minutos} minutos
              </Button>
            ))}
            <Button
              size="xs"
              variant="subtle"
              justifyContent="flex-start"
              onClick={() => escolherTimer('fim_parte')}
            >
              No fim desta parte
            </Button>
            {timerSono && (
              <Button
                size="xs"
                variant="ghost"
                colorPalette="red"
                justifyContent="flex-start"
                onClick={() => escolherTimer(null)}
              >
                Desligar timer
              </Button>
            )}
          </Flex>
        </Box>
      )}

      {mostrarVozes && (
        <PainelVozes
          vozes={vozes}
          vozSelecionada={vozSelecionada?.id ?? null}
          numeroBlocoAtivo={blocoAtivo?.numeroBloco ?? null}
          carregando={carregandoVozes}
          vozEmAcao={vozEmAcao}
          onSelecionar={selecionarVoz}
          onGerar={gerarVoz}
          onRemover={removerVoz}
          onFechar={() => setMostrarVozes(false)}
        />
      )}

      {mostrarSumario && (
        <Box
          position="absolute"
          bottom="calc(100% + 8px)"
          right={{ base: 4, md: 24 }}
          w={{ base: 'calc(100vw - 32px)', sm: '380px' }}
          maxH="min(460px, calc(100vh - 150px))"
          bg="cirqueira.grey.900"
          border="1px solid"
          borderColor="cirqueira.grey.800"
          borderRadius="2xl"
          p={3.5}
          overflowY="auto"
          boxShadow="0 20px 50px rgba(0, 0, 0, 0.9), 0 0 0 1px var(--chakra-colors-cirqueira-brand-500)/20"
          zIndex={60}
        >
          <HStack
            justify="space-between"
            mb={2.5}
            pb={2}
            borderBottom="1px solid"
            borderColor="cirqueira.grey.800"
          >
            <HStack gap={2} color="cirqueira.brand.400">
              <ListMusic size={16} />
              <Text fontSize="xs" fontWeight="bold" color="white">
                Sumário
              </Text>
            </HStack>
            <IconButton
              size="xs"
              variant="ghost"
              color="cirqueira.grey.400"
              _hover={{ color: 'white' }}
              onClick={() => setMostrarSumario(false)}
              aria-label="Fechar sumário"
            >
              <X size={14} />
            </IconButton>
          </HStack>

          <HStack gap={1} mb={2.5}>
            {(['capitulos', 'partes'] as const).map((opcao) => (
              <Button
                key={opcao}
                size="2xs"
                variant={aba === opcao ? 'solid' : 'subtle'}
                colorPalette={aba === opcao ? 'brand' : 'gray'}
                onClick={() => setAbaSumario(opcao)}
              >
                {opcao === 'capitulos' ? 'Capítulos' : 'Partes do áudio'}
              </Button>
            ))}
          </HStack>

          {aba === 'capitulos' ? (
            <Flex direction="column" gap={0.5}>
              {carregandoIndice && (
                <Text fontSize="xs" color="cirqueira.grey.400" py={2}>
                  Lendo o sumário do livro…
                </Text>
              )}
              {!carregandoIndice && capitulos.length === 0 && (
                <Text fontSize="xs" color="cirqueira.grey.400" py={2}>
                  Este PDF não tem sumário nem títulos que dê para reconhecer. Use as partes do
                  áudio.
                </Text>
              )}
              {indiceLivro?.origem === 'titulos' && capitulos.length > 0 && (
                <Text fontSize="10px" color="cirqueira.grey.500" mb={1}>
                  O PDF não tem sumário próprio. Estes são os títulos achados nas páginas.
                </Text>
              )}
              {capitulos.map((capitulo, indice) => {
                const atual = indice === indiceCapituloAtual
                return (
                  <HStack
                    key={`${capitulo.pagina}-${indice}`}
                    as="button"
                    textAlign="left"
                    gap={2}
                    pl={2 + capitulo.nivel * 3}
                    pr={2}
                    py={1.5}
                    borderRadius="lg"
                    bg={atual ? 'cirqueira.brand.500/15' : 'transparent'}
                    _hover={{ bg: 'rgba(255, 255, 255, 0.06)' }}
                    onClick={() => ouvirCapitulo(capitulo.pagina)}
                    title={`Ouvir a partir da página ${capitulo.pagina}`}
                  >
                    <Text
                      flex={1}
                      minW={0}
                      fontSize="xs"
                      fontWeight={capitulo.nivel === 0 ? 'semibold' : 'normal'}
                      color={atual ? 'cirqueira.brand.200' : 'cirqueira.grey.200'}
                      lineClamp={2}
                    >
                      {capitulo.titulo}
                    </Text>
                    <Text
                      fontSize="10px"
                      color="cirqueira.grey.500"
                      fontVariantNumeric="tabular-nums"
                      flexShrink={0}
                    >
                      p. {capitulo.pagina}
                    </Text>
                  </HStack>
                )
              })}
            </Flex>
          ) : (
            <Flex direction="column" gap={1.5}>
              {blocos.map((bloco) => {
                const isAtivo = blocoAtivo?.numeroBloco === bloco.numeroBloco
                return (
                  <Button
                    key={bloco.uuid}
                    size="sm"
                    variant={isAtivo ? 'solid' : 'subtle'}
                    colorPalette={isAtivo ? 'brand' : 'gray'}
                    justifyContent="space-between"
                    disabled={!bloco.isPronto}
                    onClick={() => selecionarBloco(bloco)}
                    fontSize="xs"
                    h="38px"
                    px={3}
                    borderRadius="xl"
                    bg={isAtivo ? 'cirqueira.brand.500' : 'rgba(255, 255, 255, 0.04)'}
                    _hover={{ bg: isAtivo ? 'cirqueira.brand.600' : 'rgba(255, 255, 255, 0.08)' }}
                  >
                    <HStack gap={2}>
                      <Text fontWeight="bold" color={isAtivo ? 'white' : 'cirqueira.grey.200'}>
                        Parte {bloco.numeroBloco}
                      </Text>
                      <Text
                        color={isAtivo ? 'rgba(255,255,255,0.7)' : 'cirqueira.grey.400'}
                        fontSize="11px"
                      >
                        (Págs. {bloco.paginaInicio}-{bloco.paginaFim})
                      </Text>
                    </HStack>
                    <HStack gap={2}>
                      {offline.numeros.has(bloco.numeroBloco) && (
                        <Box
                          color={isAtivo ? 'white' : 'cirqueira.brand.300'}
                          title="Guardada para ouvir offline"
                        >
                          <CloudDownload size={12} />
                        </Box>
                      )}
                      {bloco.duracaoSegundos ? (
                        <Text color={isAtivo ? 'white' : 'cirqueira.grey.300'} fontSize="11px">
                          {formatarTempoAudio(bloco.duracaoSegundos)}
                        </Text>
                      ) : null}
                      <Badge
                        size="sm"
                        variant="outline"
                        colorPalette={bloco.isPronto ? 'green' : bloco.isErro ? 'red' : 'yellow'}
                        fontSize="10px"
                      >
                        {bloco.statusDescricao}
                      </Badge>
                    </HStack>
                  </Button>
                )
              })}
            </Flex>
          )}
        </Box>
      )}

      {narracao && (audioFoiUsadoRef.current || tocando) && (
        <HStack
          as="button"
          maxW="1600px"
          w="full"
          mx="auto"
          mb={2}
          gap={2}
          minW={0}
          textAlign="left"
          cursor="pointer"
          onClick={() => onMudarPaginaLeitor(narracao.pagina)}
          title="Ir para a página que está sendo lida"
        >
          <Badge
            size="sm"
            variant="subtle"
            colorPalette="brand"
            borderRadius="md"
            flexShrink={0}
            fontVariantNumeric="tabular-nums"
          >
            {narracao.localizacao || !narracao.texto
              ? `Página ${narracao.pagina}`
              : `Perto da página ${narracao.pagina}`}
          </Badge>
          <Text fontSize="xs" color="cirqueira.grey.300" truncate minW={0}>
            {narracao.texto
              ? `Lendo agora: “${narracao.texto}”`
              : `Parte ${blocoAtivo?.numeroBloco ?? ''}, páginas ${blocoAtivo?.paginaInicio ?? ''} a ${blocoAtivo?.paginaFim ?? ''}`}
          </Text>
        </HStack>
      )}

      <Flex
        direction={{ base: 'column', lg: 'row' }}
        align="center"
        justify="space-between"
        gap={{ base: 2, lg: 4 }}
        maxW="1600px"
        mx="auto"
      >
        <HStack
          gap={3}
          minW={{ base: 'full', lg: '280px' }}
          justify={{ base: 'space-between', lg: 'flex-start' }}
        >
          <HStack gap={3} align="center">
            <IconButton
              aria-label={tocando ? 'Pausar áudio' : 'Reproduzir áudio'}
              w="44px"
              h="44px"
              borderRadius="full"
              bg="cirqueira.brand.500"
              color="white"
              boxShadow="0 4px 16px rgba(0, 151, 125, 0.45)"
              _hover={{
                bg: 'cirqueira.brand.600',
                transform: 'scale(1.06)',
                boxShadow: '0 6px 20px rgba(0, 151, 125, 0.6)',
              }}
              transition="all 0.15s ease"
              disabled={!audioUrl}
              onClick={alternarPlayPause}
            >
              {tocando ? <Pause size={20} /> : <Play size={20} style={{ marginLeft: '2px' }} />}
            </IconButton>

            <Box minW={0} maxW="190px">
              <Text fontSize="xs" fontWeight="bold" color="white" truncate>
                {tocando ? 'Ouvindo áudio' : 'Reproduzir áudio'}
              </Text>
              <Text fontSize="11px" color="cirqueira.grey.400" truncate title={livro.titulo}>
                {livro.titulo}
              </Text>
            </Box>
          </HStack>

          <HStack
            gap={1}
            align="center"
            position="relative"
            onMouseEnter={() => setMostrarVolume(true)}
            onMouseLeave={() => setMostrarVolume(false)}
          >
            <IconButton
              size="xs"
              variant="ghost"
              borderRadius="md"
              color="cirqueira.grey.400"
              _hover={{ color: 'white' }}
              onClick={alternarMudo}
              aria-label={mutado ? 'Ativar som' : 'Silenciar'}
            >
              {mutado || volume === 0 ? (
                <VolumeX size={16} />
              ) : volume < 0.5 ? (
                <Volume1 size={16} />
              ) : (
                <Volume2 size={16} />
              )}
            </IconButton>

            {mostrarVolume && (
              <Box w="65px" px={1}>
                <Slider.Root
                  size="sm"
                  colorPalette="brand"
                  value={[mutado ? 0 : volume]}
                  min={0}
                  max={1}
                  step={0.05}
                  onValueChange={(d) => mudarVolume(d.value[0] ?? 1)}
                >
                  <Slider.Control>
                    <Slider.Track bg="rgba(255,255,255,0.1)">
                      <Slider.Range bg="cirqueira.brand.500" />
                    </Slider.Track>
                    <Slider.Thumb index={0} />
                  </Slider.Control>
                </Slider.Root>
              </Box>
            )}
          </HStack>
        </HStack>

        <Flex
          direction="column"
          align="center"
          gap={1}
          flex={1}
          maxW={{ base: 'full', lg: '560px' }}
          minW={{ lg: '340px' }}
          w="full"
        >
          <HStack w="full" gap={2} align="center">
            <IconButton
              size="xs"
              variant="ghost"
              color="cirqueira.grey.400"
              _hover={{ color: 'white' }}
              disabled={!audioUrl}
              onClick={() => pularTempo(-15)}
              aria-label="Voltar 15 segundos"
              title="Voltar 15s"
            >
              <RotateCcw size={14} />
            </IconButton>

            <Slider.Root
              size="sm"
              colorPalette="brand"
              value={[tempoAtual]}
              min={0}
              max={duracao || 1}
              step={0.5}
              disabled={!audioUrl}
              onValueChange={(detalhes) => {
                const novoTempo = detalhes.value[0] ?? 0
                setTempoAtual(novoTempo)
                if (audioRef.current) {
                  audioRef.current.currentTime = novoTempo
                }
              }}
              flex={1}
            >
              <Slider.Control>
                <Slider.Track bg="rgba(255, 255, 255, 0.1)" h="5px" borderRadius="full">
                  <Slider.Range bg="cirqueira.brand.500" borderRadius="full" />
                </Slider.Track>
                <Slider.Thumb
                  index={0}
                  boxSize="13px"
                  bg="white"
                  boxShadow="0 0 10px rgba(0, 151, 125, 0.8)"
                />
              </Slider.Control>
            </Slider.Root>

            <IconButton
              size="xs"
              variant="ghost"
              color="cirqueira.grey.400"
              _hover={{ color: 'white' }}
              disabled={!audioUrl}
              onClick={() => pularTempo(15)}
              aria-label="Avançar 15 segundos"
              title="Avançar 15s"
            >
              <RotateCw size={14} />
            </IconButton>

            <Text
              fontSize="xs"
              color="cirqueira.grey.300"
              minW="74px"
              textAlign="right"
              fontVariantNumeric="tabular-nums"
              fontWeight="medium"
            >
              {formatarTempoAudio(tempoAtual)} / {formatarTempoAudio(duracao)}
            </Text>
          </HStack>

          {duracaoLivro > 0 && (
            <HStack w="full" gap={2} px={7} align="center">
              <Box
                as="button"
                flex={1}
                h="10px"
                display="flex"
                alignItems="center"
                cursor="pointer"
                aria-label="Posição no livro inteiro"
                title="Clique para ir a outro ponto do livro"
                onClick={(evento: MouseEvent<HTMLElement>) => {
                  const area = evento.currentTarget.getBoundingClientRect()
                  irParaPosicaoDoLivro((evento.clientX - area.left) / area.width)
                }}
              >
                <Box w="full" h="3px" bg="rgba(255, 255, 255, 0.08)" borderRadius="full">
                  <Box
                    h="full"
                    w={`${fracaoLivro * 100}%`}
                    bg="cirqueira.brand.500/60"
                    borderRadius="full"
                  />
                </Box>
              </Box>
              <Text
                fontSize="10px"
                color="cirqueira.grey.400"
                fontVariantNumeric="tabular-nums"
                whiteSpace="nowrap"
                title={`Livro inteiro: ${formatarDuracaoCurta(duracaoLivro)} em 1x`}
              >
                Livro {Math.round(fracaoLivro * 100)}% · restam{' '}
                {formatarDuracaoCurta(restanteLivro)}
              </Text>
            </HStack>
          )}
        </Flex>

        <HStack
          gap={2}
          align="center"
          justify={{ base: 'center', lg: 'flex-end' }}
          minW={{ base: 'full', lg: '380px' }}
          flexWrap="wrap"
        >
          <Button
            size="xs"
            variant="ghost"
            borderRadius="lg"
            px={2.5}
            h="28px"
            bg="cirqueira.grey.900"
            border="1px solid"
            borderColor="cirqueira.grey.800"
            _hover={{ color: 'white', bg: 'cirqueira.grey.800' }}
            color={mostrarVelocidade ? 'cirqueira.brand.300' : 'cirqueira.grey.200'}
            onClick={() => {
              setMostrarSumario(false)
              setMostrarVozes(false)
              setMostrarAjustes(false)
              setMostrarTimer(false)
              setMostrarOffline(false)
              setMostrarVelocidade((prev) => !prev)
            }}
            fontSize="xs"
            fontWeight="semibold"
            fontVariantNumeric="tabular-nums"
            title="Alterar velocidade da narração"
          >
            <Gauge size={14} style={{ marginRight: '5px' }} />
            {formatarVelocidade(velocidade)}
          </Button>

          <Button
            size="xs"
            variant="ghost"
            borderRadius="lg"
            px={2.5}
            h="28px"
            color={mostrarSumario ? 'cirqueira.brand.300' : 'cirqueira.grey.200'}
            bg={mostrarSumario ? 'cirqueira.brand.500/20' : 'cirqueira.grey.900'}
            border="1px solid"
            borderColor={mostrarSumario ? 'cirqueira.brand.500/40' : 'cirqueira.grey.800'}
            _hover={{ color: 'white', bg: 'cirqueira.grey.800' }}
            onClick={() => {
              setMostrarVozes(false)
              setMostrarAjustes(false)
              setMostrarTimer(false)
              setMostrarVelocidade(false)
              setMostrarOffline(false)
              setMostrarSumario((prev) => !prev)
            }}
            fontSize="xs"
            fontWeight="semibold"
          >
            <ListMusic size={14} style={{ marginRight: '5px' }} />
            Sumário
          </Button>

          <Button
            size="xs"
            variant="ghost"
            borderRadius="lg"
            px={2.5}
            h="28px"
            color={mostrarVozes ? 'cirqueira.brand.300' : 'cirqueira.grey.200'}
            bg={mostrarVozes ? 'cirqueira.brand.500/20' : 'cirqueira.grey.900'}
            border="1px solid"
            borderColor={mostrarVozes ? 'cirqueira.brand.500/40' : 'cirqueira.grey.800'}
            _hover={{ color: 'white', bg: 'cirqueira.grey.800' }}
            onClick={() => {
              setMostrarSumario(false)
              setMostrarAjustes(false)
              setMostrarTimer(false)
              setMostrarVelocidade(false)
              setMostrarOffline(false)
              setMostrarVozes((prev) => !prev)
            }}
            fontSize="xs"
            fontWeight="semibold"
            title="Escolher a voz do narrador"
          >
            <Mic size={14} style={{ marginRight: '5px' }} />
            {vozSelecionada ? vozSelecionada.nome : 'Voz'}
          </Button>

          <Button
            size="xs"
            variant="ghost"
            borderRadius="lg"
            px={2.5}
            h="28px"
            color={timerSono ? 'cirqueira.brand.300' : 'cirqueira.grey.200'}
            bg={timerSono || mostrarTimer ? 'cirqueira.brand.500/20' : 'cirqueira.grey.900'}
            border="1px solid"
            borderColor={
              timerSono || mostrarTimer ? 'cirqueira.brand.500/40' : 'cirqueira.grey.800'
            }
            _hover={{ color: 'white', bg: 'cirqueira.grey.800' }}
            onClick={() => {
              setMostrarSumario(false)
              setMostrarVozes(false)
              setMostrarAjustes(false)
              setMostrarVelocidade(false)
              setMostrarOffline(false)
              setMostrarTimer((prev) => !prev)
            }}
            fontSize="xs"
            fontWeight="semibold"
            fontVariantNumeric="tabular-nums"
            title="Timer de sono"
          >
            <Moon size={14} style={{ marginRight: timerSono ? '5px' : 0 }} />
            {timerSono?.tipo === 'minutos'
              ? formatarTempoAudio(Math.ceil(timerSono.restanteMs / 1000))
              : timerSono?.tipo === 'fim_parte'
                ? 'Fim da parte'
                : null}
          </Button>

          <IconButton
            size="xs"
            variant="ghost"
            borderRadius="lg"
            h="28px"
            minW="28px"
            color={
              mostrarOffline || partesGuardadas > 0 ? 'cirqueira.brand.300' : 'cirqueira.grey.200'
            }
            bg={mostrarOffline ? 'cirqueira.brand.500/20' : 'cirqueira.grey.900'}
            border="1px solid"
            borderColor={mostrarOffline ? 'cirqueira.brand.500/40' : 'cirqueira.grey.800'}
            _hover={{ color: 'white', bg: 'cirqueira.grey.800' }}
            onClick={() => {
              setMostrarSumario(false)
              setMostrarVozes(false)
              setMostrarAjustes(false)
              setMostrarTimer(false)
              setMostrarVelocidade(false)
              setMostrarOffline((prev) => !prev)
            }}
            aria-label="Ouvir offline"
            title="Baixar partes para ouvir sem internet"
          >
            {offline.progresso ? (
              <Box as="span" display="inline-flex" animation="spin 1s linear infinite">
                <LoaderCircle size={14} />
              </Box>
            ) : (
              <CloudDownload size={14} />
            )}
          </IconButton>

          <IconButton
            size="xs"
            variant="ghost"
            borderRadius="lg"
            h="28px"
            minW="28px"
            color={mostrarAjustes ? 'cirqueira.brand.300' : 'cirqueira.grey.200'}
            bg={mostrarAjustes ? 'cirqueira.brand.500/20' : 'cirqueira.grey.900'}
            border="1px solid"
            borderColor={
              mostrarAjustes
                ? 'cirqueira.brand.500/40'
                : livro.narracaoDesatualizada
                  ? 'cirqueira.brand.500/50'
                  : 'cirqueira.grey.800'
            }
            _hover={{ color: 'white', bg: 'cirqueira.grey.800' }}
            onClick={() => {
              setMostrarSumario(false)
              setMostrarVozes(false)
              setMostrarTimer(false)
              setMostrarVelocidade(false)
              setMostrarOffline(false)
              setMostrarAjustes((prev) => !prev)
            }}
            aria-label="Ajustes da narração"
            title="Ajustes da narração: notas, pronúncia e limpeza do texto"
          >
            <SlidersHorizontal size={14} />
          </IconButton>

          <HStack
            gap={1}
            bg="cirqueira.grey.900"
            border="1px solid"
            borderColor="cirqueira.grey.800"
            borderRadius="lg"
            px={1.5}
            py="2px"
            align="center"
          >
            <IconButton
              size="xs"
              variant="ghost"
              color="cirqueira.grey.300"
              _hover={{ color: 'white' }}
              disabled={paginaAtualLeitor <= 1}
              onClick={onVoltarPaginaLeitor}
              aria-label="Página anterior"
              title="Página anterior (←)"
            >
              <ChevronLeft size={16} />
            </IconButton>

            <Text
              fontSize="xs"
              color="white"
              fontWeight="bold"
              px={1.5}
              fontVariantNumeric="tabular-nums"
            >
              {paginaAtualLeitor} / {totalPaginas}
            </Text>

            <IconButton
              size="xs"
              variant="ghost"
              color="cirqueira.grey.300"
              _hover={{ color: 'white' }}
              disabled={paginaAtualLeitor >= totalPaginas}
              onClick={onAvancarPaginaLeitor}
              aria-label="Próxima página"
              title="Próxima página (→)"
            >
              <ChevronRight size={16} />
            </IconButton>
          </HStack>

          <Button
            size="xs"
            variant="ghost"
            borderRadius="lg"
            px={2.5}
            h="28px"
            color="cirqueira.grey.300"
            _hover={{ color: 'white', bg: 'rgba(255, 255, 255, 0.08)' }}
            fontSize="xs"
            title="Baixar o arquivo PDF original"
            display={{ base: 'none', xl: 'inline-flex' }}
            onClick={baixarPdf}
          >
            <Download size={13} style={{ marginRight: '4px' }} />
            PDF
          </Button>

          <Button
            size="xs"
            variant="ghost"
            borderRadius="lg"
            px={2.5}
            h="28px"
            color={isPosicaoSalva ? 'cirqueira.brand.300' : 'cirqueira.grey.300'}
            bg={isPosicaoSalva ? 'cirqueira.brand.500/15' : 'transparent'}
            border="1px solid"
            borderColor={isPosicaoSalva ? 'cirqueira.brand.500/35' : 'transparent'}
            _hover={{ color: 'white', bg: 'cirqueira.grey.800' }}
            disabled={salvandoMarcador || criarMarcacaoMutation.isPending}
            onClick={marcarAqui}
            fontSize="xs"
            title="Guardar um marcador no ponto que está sendo lido, ou nesta página"
          >
            {isPosicaoSalva ? (
              <BookmarkCheck size={14} style={{ marginRight: '4px' }} />
            ) : (
              <Bookmark size={14} style={{ marginRight: '4px' }} />
            )}
            <Text as="span" display={{ base: 'none', sm: 'inline' }}>
              Marcar
            </Text>
          </Button>

          <Button
            size="xs"
            variant={acompanharAudio ? 'solid' : 'subtle'}
            colorPalette={acompanharAudio ? 'brand' : 'gray'}
            onClick={onAlternarAcompanharAudio}
            fontSize="10px"
            h="26px"
            px={2}
            borderRadius="full"
            title={
              acompanharAudio
                ? 'Acompanhamento automático ativado: as páginas viram com o áudio'
                : 'Acompanhamento desativado: folheie o livro livremente sem mexer no áudio'
            }
          >
            {acompanharAudio ? 'Seguir áudio' : 'Folhear livre'}
          </Button>

          {onAlternarModoDestaque && (
            <Button
              size="xs"
              variant="subtle"
              colorPalette="gray"
              onClick={onAlternarModoDestaque}
              fontSize="10px"
              h="26px"
              px={2}
              borderRadius="full"
              title={
                modoDestaque === 'palavra'
                  ? 'Destacando a palavra falada. Clique para destacar a frase inteira'
                  : 'Destacando a frase inteira. Clique para destacar palavra por palavra'
              }
            >
              {modoDestaque === 'palavra' ? 'Por palavra' : 'Por frase'}
            </Button>
          )}
        </HStack>
      </Flex>
    </Box>
  )
})
