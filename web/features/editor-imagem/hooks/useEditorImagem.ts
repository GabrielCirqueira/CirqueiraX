import { addToast } from '@/shared/components/ui/toaster'
import { type PointerEvent, useCallback, useMemo, useRef, useState } from 'react'
import type {
  AcaoHistorico,
  Anotacao,
  EstiloAnotacao,
  FerramentaEditor,
  HistoricoAnotacoes,
  ImagemEditor,
  NivelEspessura,
  Ponto,
  TextoEmEdicao,
} from '../types'
import { criarImagemEditor, nomeDoArquivoColado } from '../utils/carregamentoImagem'
import { COR_PADRAO } from '../utils/constantesEditor'
import { renderizarCena, renderizarRascunho } from '../utils/desenhoCanvas'
import {
  criarArraste,
  criarNumero,
  criarTexto,
  criarTraco,
  isArrasteSignificativo,
  isFerramentaDeTraco,
} from '../utils/fabricaAnotacoes'
import {
  aplicarRestricaoComShift,
  converterPontoDaTela,
  escalaDaTela,
  limitarAoRetangulo,
  obterRecorteAtivo,
} from '../utils/geometria'
import {
  HISTORICO_VAZIO,
  aplicarAcaoHistorico,
  proximoNumeroMarcador,
} from '../utils/historicoAnotacoes'

const FERRAMENTA_INICIAL: FerramentaEditor = 'seta'
const ESTILO_INICIAL: EstiloAnotacao = { cor: COR_PADRAO, nivelEspessura: 'media' }
const BOTAO_PRINCIPAL_PONTEIRO = 0

export function useEditorImagem(imagemDaMidia: ImagemEditor | null) {
  const [imagemLocal, setImagemLocal] = useState<ImagemEditor | null>(null)
  const [historico, setHistorico] = useState<HistoricoAnotacoes>(HISTORICO_VAZIO)
  const [ferramenta, setFerramenta] = useState<FerramentaEditor>(FERRAMENTA_INICIAL)
  const [estilo, setEstilo] = useState<EstiloAnotacao>(ESTILO_INICIAL)
  const [textoEmEdicao, setTextoEmEdicao] = useState<TextoEmEdicao | null>(null)
  const [carregandoImagem, setCarregandoImagem] = useState(false)

  const imagem = imagemLocal ?? imagemDaMidia
  const historicoRef = useRef<HistoricoAnotacoes>(historico)
  const canvasBaseRef = useRef<HTMLCanvasElement | null>(null)
  const canvasRascunhoRef = useRef<HTMLCanvasElement | null>(null)
  const rascunhoRef = useRef<Anotacao | null>(null)
  const quadroPendenteRef = useRef<number | null>(null)

  const recorte = useMemo(
    () => (imagem ? obterRecorteAtivo(imagem, historico.anotacoes) : null),
    [imagem, historico.anotacoes]
  )

  const registrarCanvasBase = useCallback(
    (canvas: HTMLCanvasElement | null) => {
      canvasBaseRef.current = canvas
      if (!canvas || !imagem) return
      const { anotacoes } = historicoRef.current
      renderizarCena(canvas, imagem, anotacoes, obterRecorteAtivo(imagem, anotacoes))
    },
    [imagem]
  )

  const registrarCanvasRascunho = useCallback((canvas: HTMLCanvasElement | null) => {
    canvasRascunhoRef.current = canvas
  }, [])

  function limparRascunho() {
    if (quadroPendenteRef.current !== null) {
      cancelAnimationFrame(quadroPendenteRef.current)
      quadroPendenteRef.current = null
    }
    const canvasRascunho = canvasRascunhoRef.current
    const canvasBase = canvasBaseRef.current
    if (!canvasRascunho || !canvasBase || !imagem || !recorte) return
    renderizarRascunho(canvasRascunho, canvasBase, imagem, null, recorte)
  }

  function agendarRascunho() {
    if (quadroPendenteRef.current !== null) return
    quadroPendenteRef.current = requestAnimationFrame(() => {
      quadroPendenteRef.current = null
      const canvasRascunho = canvasRascunhoRef.current
      const canvasBase = canvasBaseRef.current
      if (!canvasRascunho || !canvasBase || !imagem || !recorte) return
      renderizarRascunho(canvasRascunho, canvasBase, imagem, rascunhoRef.current, recorte)
    })
  }

  function aplicarNoHistorico(acao: AcaoHistorico) {
    const proximo = aplicarAcaoHistorico(historicoRef.current, acao)
    if (proximo === historicoRef.current) return
    historicoRef.current = proximo
    setHistorico(proximo)

    const canvasBase = canvasBaseRef.current
    if (!canvasBase || !imagem) return
    renderizarCena(
      canvasBase,
      imagem,
      proximo.anotacoes,
      obterRecorteAtivo(imagem, proximo.anotacoes)
    )
  }

  function pontoDoEvento(evento: PointerEvent<HTMLCanvasElement>): Ponto | null {
    const canvasBase = canvasBaseRef.current
    if (!canvasBase || !recorte) return null
    const ponto = converterPontoDaTela(evento.clientX, evento.clientY, canvasBase, recorte)
    return limitarAoRetangulo(ponto, recorte)
  }

  function confirmarTexto() {
    if (!textoEmEdicao || !imagem) return
    const texto = textoEmEdicao.valor.trim()
    setTextoEmEdicao(null)
    if (!texto) return
    aplicarNoHistorico({
      tipo: 'adicionar',
      anotacao: criarTexto(texto, textoEmEdicao.posicao, imagem, estilo),
    })
  }

  function abrirTexto(ponto: Ponto, evento: PointerEvent<HTMLCanvasElement>) {
    const canvasBase = canvasBaseRef.current
    if (!canvasBase) return
    const area = canvasBase.getBoundingClientRect()
    setTextoEmEdicao({
      posicao: ponto,
      posicaoTela: { x: evento.clientX - area.left, y: evento.clientY - area.top },
      escalaTela: escalaDaTela(canvasBase),
      valor: '',
    })
  }

  function iniciarDesenho(evento: PointerEvent<HTMLCanvasElement>) {
    if (!imagem || evento.button !== BOTAO_PRINCIPAL_PONTEIRO) return
    if (textoEmEdicao) {
      confirmarTexto()
      return
    }

    const ponto = pontoDoEvento(evento)
    if (!ponto) return

    if (ferramenta === 'texto') {
      evento.preventDefault()
      abrirTexto(ponto, evento)
      return
    }

    if (ferramenta === 'numero') {
      const numero = proximoNumeroMarcador(historicoRef.current)
      aplicarNoHistorico({
        tipo: 'adicionar',
        anotacao: criarNumero(numero, ponto, imagem, estilo),
      })
      return
    }

    evento.currentTarget.setPointerCapture(evento.pointerId)
    rascunhoRef.current = isFerramentaDeTraco(ferramenta)
      ? criarTraco(ferramenta, ponto, imagem, estilo)
      : criarArraste(ferramenta, ponto, imagem, estilo)
    agendarRascunho()
  }

  function moverDesenho(evento: PointerEvent<HTMLCanvasElement>) {
    const rascunho = rascunhoRef.current
    if (!rascunho) return

    if (rascunho.tipo === 'pincel' || rascunho.tipo === 'marcaTexto') {
      const eventos = evento.nativeEvent.getCoalescedEvents?.() ?? [evento.nativeEvent]
      for (const eventoAgrupado of eventos) {
        const canvasBase = canvasBaseRef.current
        if (!canvasBase || !recorte) continue
        rascunho.pontos.push(
          limitarAoRetangulo(
            converterPontoDaTela(
              eventoAgrupado.clientX,
              eventoAgrupado.clientY,
              canvasBase,
              recorte
            ),
            recorte
          )
        )
      }
      agendarRascunho()
      return
    }

    if (!('inicio' in rascunho)) return
    const ponto = pontoDoEvento(evento)
    if (!ponto) return
    rascunho.fim = evento.shiftKey
      ? aplicarRestricaoComShift(rascunho.tipo, rascunho.inicio, ponto)
      : ponto
    agendarRascunho()
  }

  function finalizarDesenho() {
    const rascunho = rascunhoRef.current
    rascunhoRef.current = null
    limparRascunho()
    if (!rascunho) return
    if ('inicio' in rascunho && !isArrasteSignificativo(rascunho)) return

    aplicarNoHistorico({ tipo: 'adicionar', anotacao: rascunho })
    if (rascunho.tipo === 'recorte') setFerramenta(FERRAMENTA_INICIAL)
  }

  function cancelarAcaoAtual() {
    if (textoEmEdicao) {
      setTextoEmEdicao(null)
      return
    }
    rascunhoRef.current = null
    limparRascunho()
  }

  async function carregarArquivo(arquivo: Blob, nome: string | null) {
    setCarregandoImagem(true)
    try {
      const novaImagem = await criarImagemEditor(arquivo, nome, null)
      imagemLocal?.bitmap.close()
      historicoRef.current = HISTORICO_VAZIO
      setHistorico(HISTORICO_VAZIO)
      setTextoEmEdicao(null)
      setImagemLocal(novaImagem)
    } catch {
      addToast({
        title: 'Não foi possível abrir a imagem',
        description: 'O formato não é suportado pelo navegador.',
        color: 'danger',
      })
    } finally {
      setCarregandoImagem(false)
    }
  }

  function carregarArquivoColado(arquivo: File) {
    return carregarArquivo(arquivo, nomeDoArquivoColado(arquivo))
  }

  function obterAnotacoesConfirmadas(): Anotacao[] {
    confirmarTexto()
    return historicoRef.current.anotacoes
  }

  function selecionarFerramenta(proxima: FerramentaEditor) {
    confirmarTexto()
    setFerramenta(proxima)
  }

  function selecionarCor(cor: string) {
    setEstilo((atual) => ({ ...atual, cor }))
  }

  function selecionarEspessura(nivelEspessura: NivelEspessura) {
    setEstilo((atual) => ({ ...atual, nivelEspessura }))
  }

  function atualizarTexto(valor: string) {
    setTextoEmEdicao((atual) => (atual ? { ...atual, valor } : atual))
  }

  return {
    imagem,
    historico,
    recorte,
    ferramenta,
    estilo,
    textoEmEdicao,
    carregandoImagem,
    podeDesfazer: historico.anotacoes.length > 0,
    podeRefazer: historico.desfeitas.length > 0,
    registrarCanvasBase,
    registrarCanvasRascunho,
    iniciarDesenho,
    moverDesenho,
    finalizarDesenho,
    cancelarAcaoAtual,
    confirmarTexto,
    atualizarTexto,
    obterAnotacoesConfirmadas,
    carregarArquivoColado,
    selecionarFerramenta,
    selecionarCor,
    selecionarEspessura,
    desfazer: () => aplicarNoHistorico({ tipo: 'desfazer' }),
    refazer: () => aplicarNoHistorico({ tipo: 'refazer' }),
    limpar: () => aplicarNoHistorico({ tipo: 'limpar' }),
  }
}
