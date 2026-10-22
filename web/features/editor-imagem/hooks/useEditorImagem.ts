import { addToast } from '@/shared/components/ui/toaster'
import { useLocalStorageState } from '@/shared/hooks'
import { CHAVES_STORAGE } from '@/shared/utils/localStorageService'
import { type MouseEvent, type PointerEvent, useMemo, useState } from 'react'
import type {
  AlteracaoAnotacao,
  Anotacao,
  AnotacaoTexto,
  EstiloExibido,
  FerramentaEditor,
  ImagemEditor,
  NivelEspessura,
  Ponto,
  PreferenciasEditor,
  PreferenciasFerramenta,
  TextoEmEdicao,
} from '../types'
import { criarImagemEditor, nomeDoArquivoColado } from '../utils/carregamentoImagem'
import {
  DESLOCAMENTO_DUPLICADO,
  ESPESSURA_POR_NIVEL,
  TAMANHO_ALCA_ACERTO_TELA,
  TOLERANCIA_ACERTO_TELA,
} from '../utils/constantesEditor'
import {
  calcularTamanhoFonte,
  criarArraste,
  criarNumero,
  criarTexto,
  criarTraco,
  isArrasteSignificativo,
  isFerramentaDeTraco,
} from '../utils/fabricaAnotacoes'
import {
  aplicarRestricaoComShift,
  calcularFatorEscala,
  converterPontoDaTela,
  converterPontoParaTela,
  limitarAoRetangulo,
} from '../utils/geometria'
import { proximoNumeroMarcador } from '../utils/historicoAnotacoes'
import {
  FERRAMENTAS_PERSISTIVEIS,
  extrairPreferencias,
  isFerramentaComPreferencias,
  isPreferenciasEditor,
  mesclarPreferencias,
  nivelDaEspessura,
  resolverPreferencias,
} from '../utils/preferenciasEditor'
import {
  acertouAnotacao,
  cursorDaAlca,
  cursorDaFerramenta,
  encontrarAlcaNoPonto,
  encontrarAnotacaoNoPonto,
} from '../utils/selecaoAnotacoes'
import {
  alterarAnotacao,
  deslocarAnotacao,
  duplicarAnotacao,
  isPropriedadeEditavel,
  redimensionarAnotacao,
} from '../utils/transformacaoAnotacoes'
import { useCanvasEditor } from './useCanvasEditor'

const FERRAMENTA_INICIAL: FerramentaEditor = 'seta'
const PREFERENCIAS_INICIAIS: PreferenciasEditor = {}
const OPCOES_FERRAMENTA_SALVA = { valoresPermitidos: FERRAMENTAS_PERSISTIVEIS }
const OPCOES_PREFERENCIAS_SALVAS = { validar: isPreferenciasEditor }
const BOTAO_PRINCIPAL_PONTEIRO = 0
const TIPOS_SELECIONADOS_APOS_CRIAR: Anotacao['tipo'][] = [
  'seta',
  'linha',
  'retangulo',
  'elipse',
  'desfoque',
  'texto',
  'numero',
]

export function useEditorImagem(imagemDaMidia: ImagemEditor | null) {
  const [imagemLocal, setImagemLocal] = useState<ImagemEditor | null>(null)
  const [ferramenta, setFerramenta] = useLocalStorageState<FerramentaEditor>(
    CHAVES_STORAGE.EDITOR_IMAGEM_FERRAMENTA,
    FERRAMENTA_INICIAL,
    OPCOES_FERRAMENTA_SALVA
  )
  const [preferencias, setPreferencias] = useLocalStorageState<PreferenciasEditor>(
    CHAVES_STORAGE.EDITOR_IMAGEM_PREFERENCIAS,
    PREFERENCIAS_INICIAIS,
    OPCOES_PREFERENCIAS_SALVAS
  )
  const [textoEmEdicao, setTextoEmEdicao] = useState<TextoEmEdicao | null>(null)
  const [carregandoImagem, setCarregandoImagem] = useState(false)

  const imagem = imagemLocal ?? imagemDaMidia
  const canvas = useCanvasEditor(imagem)
  const { historico, historicoRef, interacaoRef, recorte } = canvas

  function preferenciasDe(alvo: FerramentaEditor): PreferenciasFerramenta {
    return resolverPreferencias(preferencias, alvo)
  }

  function lembrarPreferencias(anotacao: Anotacao) {
    if (!imagem || !isFerramentaComPreferencias(anotacao.tipo)) return
    const tipo = anotacao.tipo
    const extraidas = extrairPreferencias(anotacao, imagem)
    setPreferencias((atuais) => mesclarPreferencias(atuais, tipo, extraidas))
  }

  function lembrarDaFerramentaAtual(alteracao: Partial<PreferenciasFerramenta>) {
    if (!isFerramentaComPreferencias(ferramenta)) return
    const alvo = ferramenta
    setPreferencias((atuais) => mesclarPreferencias(atuais, alvo, alteracao))
  }

  const estilo = useMemo<EstiloExibido>(() => {
    const selecionada = canvas.selecionada
    if (selecionada && imagem) {
      return {
        cor: selecionada.cor,
        nivelEspessura: nivelDaEspessura(selecionada.espessura / calcularFatorEscala(imagem)),
      }
    }
    const atuais = resolverPreferencias(preferencias, ferramenta)
    return { cor: atuais.cor, nivelEspessura: nivelDaEspessura(atuais.espessura) }
  }, [canvas.selecionada, imagem, preferencias, ferramenta])

  function pontoDaTela(clienteX: number, clienteY: number): Ponto | null {
    const canvasBase = canvas.canvasBaseRef.current
    if (!canvasBase || !recorte) return null
    return limitarAoRetangulo(
      converterPontoDaTela(clienteX, clienteY, canvasBase, recorte),
      recorte
    )
  }

  function tolerancias() {
    const escala = canvas.escalaAtual()
    return {
      acerto: TOLERANCIA_ACERTO_TELA / escala,
      alca: TAMANHO_ALCA_ACERTO_TELA / escala,
    }
  }

  function adicionarESelecionar(anotacao: Anotacao) {
    canvas.aplicarNoHistorico({ tipo: 'adicionar', anotacao })
    if (TIPOS_SELECIONADOS_APOS_CRIAR.includes(anotacao.tipo)) canvas.selecionar(anotacao.id)
  }

  function confirmarTextoExistente(anotacaoId: string, texto: string) {
    const existente = historicoRef.current.anotacoes.find((anotacao) => anotacao.id === anotacaoId)
    if (existente?.tipo !== 'texto') return
    if (!texto) {
      canvas.aplicarNoHistorico({ tipo: 'remover', id: anotacaoId })
      return
    }
    if (texto !== existente.texto) {
      canvas.aplicarNoHistorico({ tipo: 'atualizar', anotacao: { ...existente, texto } })
    }
  }

  function confirmarTexto() {
    if (!textoEmEdicao || !imagem) return
    const texto = textoEmEdicao.valor.trim()
    setTextoEmEdicao(null)
    canvas.ocultarDuranteEdicao(null)

    if (textoEmEdicao.anotacaoId) {
      confirmarTextoExistente(textoEmEdicao.anotacaoId, texto)
      return
    }
    if (!texto) return
    const preferenciasTexto = { ...preferenciasDe('texto'), cor: textoEmEdicao.cor }
    adicionarESelecionar(criarTexto(texto, textoEmEdicao.posicao, imagem, preferenciasTexto))
  }

  function abrirTexto(posicao: Ponto, anotacaoExistente: AnotacaoTexto | null) {
    const canvasBase = canvas.canvasBaseRef.current
    if (!canvasBase || !recorte || !imagem) return
    const preferenciasTexto = preferenciasDe('texto')
    setTextoEmEdicao({
      anotacaoId: anotacaoExistente?.id ?? null,
      posicao,
      posicaoTela: converterPontoParaTela(posicao, canvasBase, recorte),
      escalaTela: canvas.escalaAtual(),
      valor: anotacaoExistente?.texto ?? '',
      tamanhoFonte:
        anotacaoExistente?.tamanhoFonte ?? calcularTamanhoFonte(imagem, preferenciasTexto),
      cor: anotacaoExistente?.cor ?? preferenciasTexto.cor,
    })
    canvas.ocultarDuranteEdicao(anotacaoExistente?.id ?? null)
  }

  function encontrarAlvoParaMover(ponto: Ponto): Anotacao | null {
    const { acerto } = tolerancias()
    if (ferramenta === 'selecionar') {
      return encontrarAnotacaoNoPonto(historicoRef.current.anotacoes, ponto, acerto, 'area')
    }
    const selecionadaAtual = canvas.anotacaoSelecionadaAtual()
    if (selecionadaAtual && acertouAnotacao(selecionadaAtual, ponto, acerto, 'preciso')) {
      return selecionadaAtual
    }
    return null
  }

  function iniciarTransformacao(evento: PointerEvent<HTMLCanvasElement>, ponto: Ponto): boolean {
    const selecionadaAtual = canvas.anotacaoSelecionadaAtual()
    const alca =
      selecionadaAtual && encontrarAlcaNoPonto(selecionadaAtual, ponto, tolerancias().alca)

    if (selecionadaAtual && alca) {
      evento.currentTarget.setPointerCapture(evento.pointerId)
      interacaoRef.current = {
        tipo: 'redimensionando',
        original: selecionadaAtual,
        alca,
        atual: selecionadaAtual,
      }
      return true
    }

    const alvo = encontrarAlvoParaMover(ponto)
    if (!alvo) return false
    canvas.selecionar(alvo.id)
    evento.currentTarget.setPointerCapture(evento.pointerId)
    interacaoRef.current = { tipo: 'movendo', original: alvo, origem: ponto, atual: alvo }
    return true
  }

  function iniciarDesenho(evento: PointerEvent<HTMLCanvasElement>) {
    if (!imagem || evento.button !== BOTAO_PRINCIPAL_PONTEIRO) return
    if (textoEmEdicao) {
      confirmarTexto()
      return
    }

    const ponto = pontoDaTela(evento.clientX, evento.clientY)
    if (!ponto) return
    if (iniciarTransformacao(evento, ponto)) return

    canvas.selecionar(null)
    if (ferramenta === 'selecionar') return

    if (ferramenta === 'texto') {
      evento.preventDefault()
      abrirTexto(ponto, null)
      return
    }

    if (ferramenta === 'numero') {
      const numero = proximoNumeroMarcador(historicoRef.current.anotacoes)
      adicionarESelecionar(criarNumero(numero, ponto, imagem, preferenciasDe('numero')))
      return
    }

    evento.currentTarget.setPointerCapture(evento.pointerId)
    interacaoRef.current = {
      tipo: 'desenhando',
      anotacao: isFerramentaDeTraco(ferramenta)
        ? criarTraco(ferramenta, ponto, imagem, preferenciasDe(ferramenta))
        : criarArraste(ferramenta, ponto, imagem, preferenciasDe(ferramenta)),
    }
    canvas.agendarDesenho(false)
  }

  function atualizarCursor(evento: PointerEvent<HTMLCanvasElement>) {
    const ponto = pontoDaTela(evento.clientX, evento.clientY)
    if (!ponto) return
    const selecionadaAtual = canvas.anotacaoSelecionadaAtual()
    const alca =
      selecionadaAtual && encontrarAlcaNoPonto(selecionadaAtual, ponto, tolerancias().alca)

    if (alca) {
      evento.currentTarget.style.cursor = cursorDaAlca(alca)
      return
    }
    evento.currentTarget.style.cursor = encontrarAlvoParaMover(ponto)
      ? 'move'
      : cursorDaFerramenta(ferramenta)
  }

  function continuarDesenho(evento: PointerEvent<HTMLCanvasElement>, anotacao: Anotacao) {
    if (anotacao.tipo === 'pincel' || anotacao.tipo === 'marcaTexto') {
      const eventos = evento.nativeEvent.getCoalescedEvents?.() ?? [evento.nativeEvent]
      for (const eventoAgrupado of eventos) {
        const ponto = pontoDaTela(eventoAgrupado.clientX, eventoAgrupado.clientY)
        if (ponto) anotacao.pontos.push(ponto)
      }
      return
    }
    if (!('inicio' in anotacao)) return
    const ponto = pontoDaTela(evento.clientX, evento.clientY)
    if (!ponto) return
    anotacao.fim = evento.shiftKey
      ? aplicarRestricaoComShift(anotacao.tipo, anotacao.inicio, ponto)
      : ponto
  }

  function moverDesenho(evento: PointerEvent<HTMLCanvasElement>) {
    const interacao = interacaoRef.current
    if (!interacao) {
      atualizarCursor(evento)
      return
    }

    if (interacao.tipo === 'desenhando') {
      continuarDesenho(evento, interacao.anotacao)
      canvas.agendarDesenho(false)
      return
    }

    const ponto = pontoDaTela(evento.clientX, evento.clientY)
    if (!ponto) return
    interacao.atual =
      interacao.tipo === 'movendo'
        ? deslocarAnotacao(
            interacao.original,
            ponto.x - interacao.origem.x,
            ponto.y - interacao.origem.y
          )
        : redimensionarAnotacao(interacao.original, interacao.alca, ponto)
    canvas.previsualizar(interacao.atual)
  }

  function finalizarDesenho() {
    const interacao = interacaoRef.current
    interacaoRef.current = null
    if (!interacao) return

    if (interacao.tipo !== 'desenhando') {
      canvas.previsualizar(null)
      if (interacao.atual !== interacao.original) {
        canvas.aplicarNoHistorico({ tipo: 'atualizar', anotacao: interacao.atual })
      }
      return
    }

    const { anotacao } = interacao
    if ('inicio' in anotacao && !isArrasteSignificativo(anotacao)) {
      canvas.desenharAgora(false)
      return
    }
    adicionarESelecionar(anotacao)
    if (anotacao.tipo === 'recorte') setFerramenta(FERRAMENTA_INICIAL)
  }

  function editarTextoComDuploClique(evento: MouseEvent<HTMLCanvasElement>) {
    const ponto = pontoDaTela(evento.clientX, evento.clientY)
    if (!ponto) return
    const alvo = encontrarAnotacaoNoPonto(
      historicoRef.current.anotacoes,
      ponto,
      tolerancias().acerto,
      'area'
    )
    if (alvo?.tipo !== 'texto') return
    canvas.selecionar(alvo.id)
    abrirTexto(alvo.posicao, alvo)
  }

  function cancelarAcaoAtual() {
    if (textoEmEdicao) {
      setTextoEmEdicao(null)
      canvas.ocultarDuranteEdicao(null)
      return
    }
    if (interacaoRef.current) {
      interacaoRef.current = null
      canvas.previsualizar(null)
      return
    }
    canvas.selecionar(null)
  }

  function previsualizarAlteracao(alteracao: AlteracaoAnotacao) {
    const selecionadaAtual = canvas.anotacaoSelecionadaAtual()
    if (selecionadaAtual) canvas.previsualizar(alterarAnotacao(selecionadaAtual, alteracao))
  }

  function confirmarAlteracao(alteracao: AlteracaoAnotacao) {
    const selecionadaAtual = canvas.anotacaoSelecionadaAtual()
    canvas.previsualizar(null)
    if (!selecionadaAtual) return
    const alterada = alterarAnotacao(selecionadaAtual, alteracao)
    canvas.aplicarNoHistorico({ tipo: 'atualizar', anotacao: alterada })
    lembrarPreferencias(alterada)
  }

  function excluirSelecionada() {
    const selecionadaAtual = canvas.anotacaoSelecionadaAtual()
    if (selecionadaAtual) canvas.aplicarNoHistorico({ tipo: 'remover', id: selecionadaAtual.id })
  }

  function duplicarSelecionada() {
    const selecionadaAtual = canvas.anotacaoSelecionadaAtual()
    if (!selecionadaAtual || !imagem) return
    const copia = duplicarAnotacao(
      selecionadaAtual,
      DESLOCAMENTO_DUPLICADO * calcularFatorEscala(imagem)
    )
    if (copia.tipo === 'numero') {
      copia.numero = proximoNumeroMarcador(historicoRef.current.anotacoes)
    }
    adicionarESelecionar(copia)
  }

  function trazerSelecionadaParaFrente() {
    const selecionadaAtual = canvas.anotacaoSelecionadaAtual()
    if (!selecionadaAtual) return
    canvas.aplicarNoHistorico({ tipo: 'trazerParaFrente', id: selecionadaAtual.id })
  }

  function deslocarSelecionada(dx: number, dy: number) {
    const selecionadaAtual = canvas.anotacaoSelecionadaAtual()
    if (!selecionadaAtual) return
    canvas.aplicarNoHistorico({
      tipo: 'atualizar',
      anotacao: deslocarAnotacao(selecionadaAtual, dx, dy),
    })
  }

  async function carregarArquivo(arquivo: Blob, nome: string | null) {
    setCarregandoImagem(true)
    try {
      const novaImagem = await criarImagemEditor(arquivo, nome, null)
      imagemLocal?.bitmap.close()
      canvas.reiniciar()
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

  function obterAnotacoesConfirmadas(): Anotacao[] {
    confirmarTexto()
    return historicoRef.current.anotacoes
  }

  function selecionarFerramenta(proxima: FerramentaEditor) {
    confirmarTexto()
    if (proxima !== 'selecionar') canvas.selecionar(null)
    setFerramenta(proxima)
  }

  function selecionarCor(cor: string) {
    setTextoEmEdicao((atual) => (atual && !atual.anotacaoId ? { ...atual, cor } : atual))
    const selecionadaAtual = canvas.anotacaoSelecionadaAtual()
    if (selecionadaAtual) {
      confirmarAlteracao({ cor })
      return
    }
    lembrarDaFerramentaAtual({ cor })
  }

  function selecionarEspessura(nivelEspessura: NivelEspessura) {
    const espessuraRelativa = ESPESSURA_POR_NIVEL[nivelEspessura]
    const selecionadaAtual = canvas.anotacaoSelecionadaAtual()
    if (!selecionadaAtual) {
      lembrarDaFerramentaAtual({ espessura: espessuraRelativa })
      return
    }
    if (!imagem || !isPropriedadeEditavel(selecionadaAtual, 'espessura')) return
    confirmarAlteracao({ espessura: espessuraRelativa * calcularFatorEscala(imagem) })
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
    selecionada: canvas.selecionada,
    podeDesfazer: historico.passado.length > 0,
    podeRefazer: historico.futuro.length > 0,
    temAnotacoes: historico.anotacoes.length > 0,
    registrarCanvasBase: canvas.registrarCanvasBase,
    registrarCanvasSobreposicao: canvas.registrarCanvasSobreposicao,
    iniciarDesenho,
    moverDesenho,
    finalizarDesenho,
    editarTextoComDuploClique,
    cancelarAcaoAtual,
    confirmarTexto,
    atualizarTexto,
    obterAnotacoesConfirmadas,
    carregarArquivoColado: (arquivo: File) =>
      carregarArquivo(arquivo, nomeDoArquivoColado(arquivo)),
    selecionarFerramenta,
    selecionarCor,
    selecionarEspessura,
    previsualizarAlteracao,
    confirmarAlteracao,
    excluirSelecionada,
    duplicarSelecionada,
    trazerSelecionadaParaFrente,
    deslocarSelecionada,
    desfazer: () => canvas.aplicarNoHistorico({ tipo: 'desfazer' }),
    refazer: () => canvas.aplicarNoHistorico({ tipo: 'refazer' }),
    limpar: () => canvas.aplicarNoHistorico({ tipo: 'limpar' }),
  }
}
