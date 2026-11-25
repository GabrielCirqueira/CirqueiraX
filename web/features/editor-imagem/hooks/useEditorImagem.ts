import { addToast } from '@/shared/components/ui/toaster'
import { useLocalStorageState } from '@/shared/hooks'
import { CHAVES_STORAGE } from '@/shared/utils/localStorageService'
import { type MouseEvent, type PointerEvent, useMemo, useRef, useState } from 'react'
import type {
  AlteracaoAnotacao,
  AlvoPainel,
  Anotacao,
  AnotacaoTexto,
  ConfiguracaoTela,
  DirecaoCamada,
  EixoAlinhamento,
  EstiloExibido,
  FerramentaEditor,
  ImagemEditor,
  NivelEspessura,
  Ponto,
  PreferenciasEditor,
  PreferenciasFerramenta,
  TextoEmEdicao,
} from '../types'
import { serializarAnotacao } from '../utils/areaTransferenciaAnotacoes'
import {
  criarImagemEditor,
  criarTelaEmBranco,
  nomeDoArquivoColado,
} from '../utils/carregamentoImagem'
import {
  COR_FUNDO_TELA_PADRAO,
  DESLOCAMENTO_DUPLICADO,
  ESPESSURA_POR_NIVEL,
  FORMATO_TELA_INICIAL,
  LIMITES_PROPRIEDADE,
  TAMANHO_ALCA_ACERTO_TELA,
  TOLERANCIA_ACERTO_TELA,
  TOLERANCIA_ENCAIXE_TELA,
} from '../utils/constantesEditor'
import { calcularEncaixe, deslocamentoParaAlinhar } from '../utils/encaixeAlinhamento'
import {
  calcularTamanhoFonte,
  criarArraste,
  criarNumero,
  criarTexto,
  criarTraco,
  formatoDoTexto,
  isArrasteSignificativo,
  isFerramentaDeTraco,
} from '../utils/fabricaAnotacoes'
import {
  aplicarRestricaoComShift,
  calcularFatorEscala,
  centroDoRetangulo,
  converterPontoDaTela,
  converterPontoParaTela,
  limitarAoRetangulo,
  normalizarRetangulo,
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
  valoresDaAnotacao,
} from '../utils/preferenciasEditor'
import {
  acertouAnotacao,
  caixaDaAnotacao,
  cursorDaAlca,
  cursorDaFerramenta,
  encontrarAlcaNoPonto,
  encontrarAnotacaoNoPonto,
  isInteragivel,
} from '../utils/selecaoAnotacoes'
import {
  alterarAnotacao,
  deslocarAnotacao,
  duplicarAnotacao,
  escalarAlteracao,
  isPropriedadeEditavel,
  redimensionarAnotacao,
} from '../utils/transformacaoAnotacoes'
import { useCanvasEditor } from './useCanvasEditor'

const FERRAMENTA_INICIAL: FerramentaEditor = 'seta'
const PREFERENCIAS_INICIAIS: PreferenciasEditor = {}
const OPCOES_FERRAMENTA_SALVA = { valoresPermitidos: FERRAMENTAS_PERSISTIVEIS }
const OPCOES_PREFERENCIAS_SALVAS = { validar: isPreferenciasEditor }
const BOTAO_PRINCIPAL_PONTEIRO = 0
const TIPOS_NAO_SELECIONADOS_APOS_CRIAR: Anotacao['tipo'][] = ['pincel', 'marcaTexto', 'recorte']
/** Ferramentas usadas em sequência (vários marcadores, vários traços) não voltam para a seleção. */
const FERRAMENTAS_QUE_CONTINUAM_ATIVAS: FerramentaEditor[] = [
  'pincel',
  'marcaTexto',
  'numero',
  'recorte',
]
const FERRAMENTAS_SEM_ACERTO_EM_OUTROS: FerramentaEditor[] = ['pincel', 'marcaTexto', 'recorte']
const PASSO_TAMANHO = 0.1
const ACAO_POR_DIRECAO = {
  frente: 'trazerParaFrente',
  tras: 'enviarParaTras',
  subir: 'subirCamada',
  descer: 'descerCamada',
} as const
const TELA_INICIAL: ConfiguracaoTela = {
  largura: FORMATO_TELA_INICIAL.largura,
  altura: FORMATO_TELA_INICIAL.altura,
  corFundo: COR_FUNDO_TELA_PADRAO,
}

function isConfiguracaoTela(valor: unknown): valor is ConfiguracaoTela {
  if (typeof valor !== 'object' || valor === null) return false
  const tela = valor as Record<string, unknown>
  return (
    typeof tela.largura === 'number' &&
    typeof tela.altura === 'number' &&
    (tela.corFundo === null || typeof tela.corFundo === 'string')
  )
}

const OPCOES_TELA_SALVA = { validar: isConfiguracaoTela }

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
  const [ultimaTela, setUltimaTela] = useLocalStorageState<ConfiguracaoTela>(
    CHAVES_STORAGE.EDITOR_IMAGEM_TELA,
    TELA_INICIAL,
    OPCOES_TELA_SALVA
  )
  const [travarFerramenta, setTravarFerramenta] = useLocalStorageState<boolean>(
    CHAVES_STORAGE.EDITOR_IMAGEM_TRAVAR_FERRAMENTA,
    false
  )
  const [textoEmEdicao, setTextoEmEdicao] = useState<TextoEmEdicao | null>(null)
  const copiadaRef = useRef<{ anotacao: Anotacao; colagens: number } | null>(null)
  const [carregandoImagem, setCarregandoImagem] = useState(false)

  const imagem = imagemLocal ?? imagemDaMidia
  const canvas = useCanvasEditor(imagem)
  const { historico, historicoRef, interacaoRef, recorte } = canvas

  function fator(): number {
    return imagem ? calcularFatorEscala(imagem) : 1
  }

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

  const alvoPainel = useMemo<AlvoPainel | null>(() => {
    const selecionada = canvas.selecionada
    if (selecionada && imagem) {
      const fatorImagem = calcularFatorEscala(imagem)
      const area =
        'inicio' in selecionada ? normalizarRetangulo(selecionada.inicio, selecionada.fim) : null
      return {
        tipo: selecionada.tipo,
        valores: valoresDaAnotacao(selecionada, imagem),
        anotacaoId: selecionada.id,
        limiteRaioCanto: area ? Math.min(area.largura, area.altura) / 2 / fatorImagem : null,
      }
    }
    if (!isFerramentaComPreferencias(ferramenta)) return null
    return {
      tipo: ferramenta,
      valores: resolverPreferencias(preferencias, ferramenta),
      anotacaoId: null,
      limiteRaioCanto: null,
    }
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
    if (!TIPOS_NAO_SELECIONADOS_APOS_CRIAR.includes(anotacao.tipo)) canvas.selecionar(anotacao.id)
  }

  /** Depois de desenhar, volta para o cursor (como no Canva/Figma), a menos que a ferramenta esteja travada. */
  function adicionarDesenhada(anotacao: Anotacao, ferramentaUsada: FerramentaEditor) {
    adicionarESelecionar(anotacao)
    if (travarFerramenta || FERRAMENTAS_QUE_CONTINUAM_ATIVAS.includes(ferramentaUsada)) return
    setFerramenta('selecionar')
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
    const texto = textoEmEdicao.valor.replace(/\s+$/u, '')
    setTextoEmEdicao(null)
    canvas.ocultarDuranteEdicao(null)

    if (textoEmEdicao.anotacaoId) {
      confirmarTextoExistente(textoEmEdicao.anotacaoId, texto)
      return
    }
    if (!texto.trim()) return
    const preferenciasTexto = { ...preferenciasDe('texto'), cor: textoEmEdicao.cor }
    adicionarDesenhada(criarTexto(texto, textoEmEdicao.posicao, imagem, preferenciasTexto), 'texto')
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
      formato: formatoDoTexto(anotacaoExistente ?? preferenciasTexto),
    })
    canvas.ocultarDuranteEdicao(anotacaoExistente?.id ?? null)
  }

  function sincronizarTextoEmEdicao(alteracao: AlteracaoAnotacao) {
    setTextoEmEdicao((atual) => {
      if (!atual) return atual
      const formato = formatoDoTexto({ ...atual.formato, ...alteracao })
      return {
        ...atual,
        cor: alteracao.cor ?? atual.cor,
        tamanhoFonte:
          alteracao.tamanhoFonte !== undefined
            ? alteracao.tamanhoFonte * fator()
            : atual.tamanhoFonte,
        formato,
      }
    })
  }

  /**
   * Com o cursor, qualquer item é clicável pela área. Com uma ferramenta de desenho, o item
   * selecionado continua clicável e os outros respondem pelo contorno, assim dá para selecionar
   * de novo sem trocar de ferramenta e ainda desenhar por cima de uma forma preenchida.
   */
  function encontrarAlvoParaMover(ponto: Ponto): Anotacao | null {
    const { acerto } = tolerancias()
    const anotacoes = historicoRef.current.anotacoes
    if (ferramenta === 'selecionar') {
      return encontrarAnotacaoNoPonto(anotacoes, ponto, acerto, 'area')
    }
    const selecionadaAtual = canvas.anotacaoSelecionadaAtual()
    if (
      selecionadaAtual &&
      isInteragivel(selecionadaAtual) &&
      acertouAnotacao(selecionadaAtual, ponto, acerto, 'preciso')
    ) {
      return selecionadaAtual
    }
    if (FERRAMENTAS_SEM_ACERTO_EM_OUTROS.includes(ferramenta)) return null
    return encontrarAnotacaoNoPonto(anotacoes, ponto, acerto, 'borda')
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
      adicionarDesenhada(criarNumero(numero, ponto, imagem, preferenciasDe('numero')), 'numero')
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

  function moverComEncaixe(original: Anotacao, ponto: Ponto, origem: Ponto, semEncaixe: boolean) {
    const movida = deslocarAnotacao(original, ponto.x - origem.x, ponto.y - origem.y)
    if (semEncaixe || !recorte) {
      canvas.definirGuias([])
      return movida
    }
    const encaixe = calcularEncaixe(
      movida,
      historicoRef.current.anotacoes,
      recorte,
      TOLERANCIA_ENCAIXE_TELA / canvas.escalaAtual()
    )
    canvas.definirGuias(encaixe.guias)
    return encaixe.dx || encaixe.dy ? deslocarAnotacao(movida, encaixe.dx, encaixe.dy) : movida
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
        ? moverComEncaixe(interacao.original, ponto, interacao.origem, evento.altKey)
        : redimensionarAnotacao(interacao.original, interacao.alca, ponto, evento.shiftKey)
    canvas.previsualizar(interacao.atual)
  }

  function finalizarDesenho() {
    const interacao = interacaoRef.current
    interacaoRef.current = null
    if (!interacao) return

    if (interacao.tipo !== 'desenhando') {
      canvas.definirGuias([])
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
    adicionarDesenhada(anotacao, ferramenta)
    if (anotacao.tipo === 'recorte') setFerramenta('selecionar')
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

  function editarTextoSelecionado() {
    const selecionadaAtual = canvas.anotacaoSelecionadaAtual()
    if (selecionadaAtual?.tipo !== 'texto') return
    abrirTexto(selecionadaAtual.posicao, selecionadaAtual)
  }

  function cancelarAcaoAtual() {
    if (textoEmEdicao) {
      setTextoEmEdicao(null)
      canvas.ocultarDuranteEdicao(null)
      return
    }
    if (interacaoRef.current) {
      interacaoRef.current = null
      canvas.definirGuias([])
      canvas.previsualizar(null)
      return
    }
    if (canvas.anotacaoSelecionadaAtual()) {
      canvas.selecionar(null)
      return
    }
    if (ferramenta !== 'selecionar') setFerramenta('selecionar')
  }

  function previsualizarAlteracao(alteracao: AlteracaoAnotacao) {
    const selecionadaAtual = canvas.anotacaoSelecionadaAtual()
    if (!selecionadaAtual) return
    canvas.previsualizar(alterarAnotacao(selecionadaAtual, escalarAlteracao(alteracao, fator())))
  }

  function confirmarAlteracao(alteracao: AlteracaoAnotacao) {
    const selecionadaAtual = canvas.anotacaoSelecionadaAtual()
    canvas.previsualizar(null)
    sincronizarTextoEmEdicao(alteracao)
    if (!selecionadaAtual) {
      lembrarDaFerramentaAtual(alteracao)
      return
    }
    const alterada = alterarAnotacao(selecionadaAtual, escalarAlteracao(alteracao, fator()))
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

  function moverCamada(direcao: DirecaoCamada, id?: string) {
    const alvoId = id ?? canvas.anotacaoSelecionadaAtual()?.id
    if (!alvoId) return
    canvas.aplicarNoHistorico({ tipo: ACAO_POR_DIRECAO[direcao], id: alvoId })
  }

  function deslocarSelecionada(dx: number, dy: number) {
    const selecionadaAtual = canvas.anotacaoSelecionadaAtual()
    if (!selecionadaAtual || selecionadaAtual.bloqueada) return
    canvas.aplicarNoHistorico({
      tipo: 'atualizar',
      anotacao: deslocarAnotacao(selecionadaAtual, dx, dy),
    })
  }

  function alinharSelecionada(eixo: EixoAlinhamento) {
    const selecionadaAtual = canvas.anotacaoSelecionadaAtual()
    if (!selecionadaAtual || selecionadaAtual.bloqueada || !recorte) return
    const { dx, dy } = deslocamentoParaAlinhar(caixaDaAnotacao(selecionadaAtual), recorte, eixo)
    if (Math.abs(dx) < 0.5 && Math.abs(dy) < 0.5) return
    canvas.aplicarNoHistorico({
      tipo: 'atualizar',
      anotacao: deslocarAnotacao(selecionadaAtual, dx, dy),
    })
  }

  function ajustarTamanhoSelecionada(passo: number) {
    const selecionadaAtual = canvas.anotacaoSelecionadaAtual()
    if (!selecionadaAtual || !imagem) return
    const escala = 1 + PASSO_TAMANHO * passo
    const fatorImagem = calcularFatorEscala(imagem)
    if (selecionadaAtual.tipo === 'texto') {
      const { minimo, maximo } = LIMITES_PROPRIEDADE.tamanhoFonte
      const tamanho = Math.min(
        Math.max(selecionadaAtual.tamanhoFonte * escala, minimo * fatorImagem),
        maximo * fatorImagem
      )
      confirmarAlteracao({ tamanhoFonte: tamanho / fatorImagem })
      return
    }
    if (selecionadaAtual.tipo === 'numero') {
      confirmarAlteracao({ raio: (selecionadaAtual.raio * escala) / fatorImagem })
      return
    }
    if (!isPropriedadeEditavel(selecionadaAtual, 'espessura')) return
    const { maximo } = LIMITES_PROPRIEDADE.espessura
    const espessura = Math.min(
      Math.max(1, selecionadaAtual.espessura / fatorImagem + passo),
      maximo
    )
    confirmarAlteracao({ espessura })
  }

  function copiarSelecionada(): string | null {
    const selecionadaAtual = canvas.anotacaoSelecionadaAtual()
    if (!selecionadaAtual || selecionadaAtual.tipo === 'recorte') return null
    copiadaRef.current = { anotacao: selecionadaAtual, colagens: 0 }
    return serializarAnotacao(selecionadaAtual)
  }

  function recortarSelecionada(): string | null {
    const conteudo = copiarSelecionada()
    if (conteudo) excluirSelecionada()
    return conteudo
  }

  function centralizarSeFora(anotacao: Anotacao): Anotacao {
    if (!recorte) return anotacao
    const caixa = caixaDaAnotacao(anotacao)
    const centro = centroDoRetangulo(caixa)
    const dentro =
      centro.x >= recorte.x &&
      centro.x <= recorte.x + recorte.largura &&
      centro.y >= recorte.y &&
      centro.y <= recorte.y + recorte.altura
    if (dentro) return anotacao
    const alvo = centroDoRetangulo(recorte)
    return deslocarAnotacao(anotacao, alvo.x - centro.x, alvo.y - centro.y)
  }

  /** Cola o item copiado; cada colagem seguida desce um pouco para não ficar em cima da anterior. */
  function colarAnotacao(externa: Anotacao | null = null): boolean {
    if (!imagem) return false
    confirmarTexto()
    if (externa && copiadaRef.current?.anotacao.id !== externa.id) {
      copiadaRef.current = { anotacao: externa, colagens: 0 }
    }
    const copiada = copiadaRef.current
    if (!copiada) return false
    copiada.colagens += 1
    const deslocamento = DESLOCAMENTO_DUPLICADO * calcularFatorEscala(imagem) * copiada.colagens
    const copia = centralizarSeFora(duplicarAnotacao(copiada.anotacao, deslocamento))
    copia.oculta = false
    copia.bloqueada = false
    if (copia.tipo === 'numero') {
      copia.numero = proximoNumeroMarcador(historicoRef.current.anotacoes)
    }
    adicionarESelecionar(copia)
    setFerramenta('selecionar')
    return true
  }

  function temAnotacaoCopiada(): boolean {
    return copiadaRef.current !== null
  }

  /** Texto colado vira uma caixa de texto no centro da tela. */
  function colarTexto(conteudo: string) {
    if (!imagem || !recorte) return
    confirmarTexto()
    const texto = conteudo.replace(/\r\n/g, '\n').trim()
    if (!texto) return
    const criada = criarTexto(texto, { x: 0, y: 0 }, imagem, preferenciasDe('texto'))
    const caixa = caixaDaAnotacao(criada)
    const centro = centroDoRetangulo(recorte)
    adicionarESelecionar(
      deslocarAnotacao(
        criada,
        centro.x - caixa.largura / 2 - caixa.x,
        centro.y - caixa.altura / 2 - caixa.y
      )
    )
    setFerramenta('selecionar')
  }

  function atualizarAnotacao(
    id: string,
    alteracao: Partial<Pick<Anotacao, 'oculta' | 'bloqueada'>>
  ) {
    const alvo = historicoRef.current.anotacoes.find((anotacao) => anotacao.id === id)
    if (!alvo) return
    canvas.aplicarNoHistorico({
      tipo: 'atualizar',
      anotacao: { ...alvo, ...alteracao } as Anotacao,
    })
    if (alteracao.oculta && canvas.anotacaoSelecionadaAtual()?.id === id) canvas.selecionar(null)
  }

  function alternarVisibilidade(id: string) {
    const alvo = historicoRef.current.anotacoes.find((anotacao) => anotacao.id === id)
    if (alvo) atualizarAnotacao(id, { oculta: !alvo.oculta })
  }

  function alternarBloqueio(id: string) {
    const alvo = historicoRef.current.anotacoes.find((anotacao) => anotacao.id === id)
    if (alvo) atualizarAnotacao(id, { bloqueada: !alvo.bloqueada })
  }

  function substituirImagem(novaImagem: ImagemEditor, manterAnotacoes: boolean) {
    imagemLocal?.bitmap.close()
    if (!manterAnotacoes) {
      canvas.reiniciar()
      setTextoEmEdicao(null)
    }
    setImagemLocal(novaImagem)
  }

  async function carregarArquivo(arquivo: Blob, nome: string | null) {
    setCarregandoImagem(true)
    try {
      substituirImagem(await criarImagemEditor(arquivo, nome, null), false)
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

  async function novaTela(configuracao: ConfiguracaoTela = ultimaTela) {
    confirmarTexto()
    substituirImagem(await criarTelaEmBranco(configuracao), false)
    setUltimaTela(configuracao)
  }

  async function configurarTela(alteracao: Partial<ConfiguracaoTela>) {
    if (!imagem?.tela) return
    confirmarTexto()
    const configuracao = { ...imagem.tela, ...alteracao }
    substituirImagem(await criarTelaEmBranco(configuracao, imagem.nome), true)
    setUltimaTela(configuracao)
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

  function selecionarAnotacao(id: string) {
    confirmarTexto()
    setFerramenta('selecionar')
    canvas.selecionar(id)
  }

  function selecionarCor(cor: string) {
    const valores = alvoPainel?.valores
    const preenchimentoVinculado = valores && valores.corPreenchimento === valores.cor
    confirmarAlteracao(preenchimentoVinculado ? { cor, corPreenchimento: cor } : { cor })
  }

  function selecionarEspessura(nivelEspessura: NivelEspessura) {
    const espessuraRelativa = ESPESSURA_POR_NIVEL[nivelEspessura]
    const selecionadaAtual = canvas.anotacaoSelecionadaAtual()
    if (selecionadaAtual && !isPropriedadeEditavel(selecionadaAtual, 'espessura')) return
    confirmarAlteracao({ espessura: espessuraRelativa })
  }

  function atualizarTexto(valor: string) {
    setTextoEmEdicao((atual) => (atual ? { ...atual, valor } : atual))
  }

  return {
    imagem,
    historico,
    recorte,
    ferramenta,
    travarFerramenta,
    estilo,
    alvoPainel,
    textoEmEdicao,
    carregandoImagem,
    ultimaTela,
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
    editarTextoSelecionado,
    cancelarAcaoAtual,
    confirmarTexto,
    atualizarTexto,
    obterAnotacoesConfirmadas,
    carregarArquivoColado: (arquivo: File) =>
      carregarArquivo(arquivo, nomeDoArquivoColado(arquivo)),
    novaTela,
    configurarTela,
    selecionarFerramenta,
    alternarTravarFerramenta: () => setTravarFerramenta((atual) => !atual),
    selecionarAnotacao,
    copiarSelecionada,
    recortarSelecionada,
    colarAnotacao,
    colarTexto,
    temAnotacaoCopiada,
    alternarVisibilidade,
    alternarBloqueio,
    selecionarCor,
    selecionarEspessura,
    previsualizarAlteracao,
    confirmarAlteracao,
    excluirSelecionada,
    excluirAnotacao: (id: string) => canvas.aplicarNoHistorico({ tipo: 'remover', id }),
    cancelarPrevisualizacao: () => canvas.previsualizar(null),
    duplicarSelecionada,
    moverCamada,
    alinharSelecionada,
    ajustarTamanhoSelecionada,
    deslocarSelecionada,
    desfazer: () => canvas.aplicarNoHistorico({ tipo: 'desfazer' }),
    refazer: () => canvas.aplicarNoHistorico({ tipo: 'refazer' }),
    limpar: () => canvas.aplicarNoHistorico({ tipo: 'limpar' }),
  }
}
