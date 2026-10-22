import { useCallback, useMemo, useRef, useState } from 'react'
import type {
  AcaoHistorico,
  Anotacao,
  HistoricoAnotacoes,
  ImagemEditor,
  InteracaoPonteiro,
} from '../types'
import { renderizarCena } from '../utils/desenhoCanvas'
import { renderizarSobreposicao } from '../utils/desenhoSelecao'
import { escalaDaTela, obterRecorteAtivo } from '../utils/geometria'
import { HISTORICO_VAZIO, aplicarAcaoHistorico } from '../utils/historicoAnotacoes'

function substituirAnotacao(anotacoes: Anotacao[], substituta: Anotacao | null): Anotacao[] {
  if (!substituta) return anotacoes
  return anotacoes.map((anotacao) => (anotacao.id === substituta.id ? substituta : anotacao))
}

export function useCanvasEditor(imagem: ImagemEditor | null) {
  const [historico, setHistorico] = useState<HistoricoAnotacoes>(HISTORICO_VAZIO)
  const [selecionadaId, setSelecionadaId] = useState<string | null>(null)

  const historicoRef = useRef<HistoricoAnotacoes>(historico)
  const selecionadaIdRef = useRef<string | null>(null)
  const canvasBaseRef = useRef<HTMLCanvasElement | null>(null)
  const canvasSobreposicaoRef = useRef<HTMLCanvasElement | null>(null)
  const interacaoRef = useRef<InteracaoPonteiro | null>(null)
  const substitutaRef = useRef<Anotacao | null>(null)
  const idOcultoRef = useRef<string | null>(null)
  const quadroPendenteRef = useRef<number | null>(null)
  const baseDesatualizadaRef = useRef(false)

  const recorte = useMemo(
    () => (imagem ? obterRecorteAtivo(imagem, historico.anotacoes) : null),
    [imagem, historico.anotacoes]
  )

  const selecionada = useMemo(
    () => historico.anotacoes.find((anotacao) => anotacao.id === selecionadaId) ?? null,
    [historico.anotacoes, selecionadaId]
  )

  function escalaAtual(): number {
    const canvasBase = canvasBaseRef.current
    return canvasBase ? escalaDaTela(canvasBase) : 1
  }

  function anotacoesVisiveis(): Anotacao[] {
    const anotacoes = substituirAnotacao(historicoRef.current.anotacoes, substitutaRef.current)
    const idOculto = idOcultoRef.current
    return idOculto ? anotacoes.filter((anotacao) => anotacao.id !== idOculto) : anotacoes
  }

  function desenharAgora(redesenharBase: boolean) {
    const canvasBase = canvasBaseRef.current
    if (!imagem || !canvasBase) return
    const recorteAtual = obterRecorteAtivo(imagem, historicoRef.current.anotacoes)
    const visiveis = anotacoesVisiveis()

    if (redesenharBase) renderizarCena(canvasBase, imagem, visiveis, recorteAtual)

    const canvasSobreposicao = canvasSobreposicaoRef.current
    if (!canvasSobreposicao) return
    const interacao = interacaoRef.current
    renderizarSobreposicao(canvasSobreposicao, canvasBase, imagem, recorteAtual, {
      emAndamento: interacao?.tipo === 'desenhando' ? interacao.anotacao : null,
      selecionada: visiveis.find((anotacao) => anotacao.id === selecionadaIdRef.current) ?? null,
      escalaTela: escalaDaTela(canvasBase),
    })
  }

  function agendarDesenho(redesenharBase: boolean) {
    baseDesatualizadaRef.current ||= redesenharBase
    if (quadroPendenteRef.current !== null) return
    quadroPendenteRef.current = requestAnimationFrame(() => {
      quadroPendenteRef.current = null
      const redesenhar = baseDesatualizadaRef.current
      baseDesatualizadaRef.current = false
      desenharAgora(redesenhar)
    })
  }

  const registrarCanvasBase = useCallback(
    (canvas: HTMLCanvasElement | null) => {
      canvasBaseRef.current = canvas
      if (canvas && imagem) desenharAgora(true)
    },
    [imagem]
  )

  const registrarCanvasSobreposicao = useCallback(
    (canvas: HTMLCanvasElement | null) => {
      canvasSobreposicaoRef.current = canvas
      if (canvas && imagem) desenharAgora(false)
    },
    [imagem]
  )

  function selecionar(id: string | null) {
    if (selecionadaIdRef.current === id) return
    selecionadaIdRef.current = id
    setSelecionadaId(id)
    desenharAgora(false)
  }

  function aplicarNoHistorico(acao: AcaoHistorico) {
    const proximo = aplicarAcaoHistorico(historicoRef.current, acao)
    if (proximo === historicoRef.current) return
    historicoRef.current = proximo
    setHistorico(proximo)

    const idSelecionado = selecionadaIdRef.current
    if (idSelecionado && !proximo.anotacoes.some((anotacao) => anotacao.id === idSelecionado)) {
      selecionadaIdRef.current = null
      setSelecionadaId(null)
    }
    desenharAgora(true)
  }

  function previsualizar(substituta: Anotacao | null) {
    substitutaRef.current = substituta
    agendarDesenho(true)
  }

  function ocultarDuranteEdicao(id: string | null) {
    idOcultoRef.current = id
    desenharAgora(true)
  }

  function reiniciar() {
    historicoRef.current = HISTORICO_VAZIO
    setHistorico(HISTORICO_VAZIO)
    selecionadaIdRef.current = null
    setSelecionadaId(null)
    interacaoRef.current = null
    substitutaRef.current = null
    idOcultoRef.current = null
  }

  function anotacaoSelecionadaAtual(): Anotacao | null {
    return (
      historicoRef.current.anotacoes.find((anotacao) => anotacao.id === selecionadaIdRef.current) ??
      null
    )
  }

  return {
    historico,
    historicoRef,
    recorte,
    selecionada,
    canvasBaseRef,
    interacaoRef,
    escalaAtual,
    desenharAgora,
    agendarDesenho,
    registrarCanvasBase,
    registrarCanvasSobreposicao,
    selecionar,
    aplicarNoHistorico,
    previsualizar,
    ocultarDuranteEdicao,
    reiniciar,
    anotacaoSelecionadaAtual,
  }
}
