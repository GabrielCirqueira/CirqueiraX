import type {
  Anotacao,
  AnotacaoArraste,
  AnotacaoNumero,
  AnotacaoTexto,
  AnotacaoTraco,
  FormatoTexto,
  ImagemEditor,
  Retangulo,
} from '../types'
import { criarCaminhoForma } from './caminhosForma'
import {
  FONTE_PADRAO,
  MULTIPLICADOR_MARCA_TEXTO,
  OPACIDADE_MARCA_TEXTO,
  OPACIDADE_PADRAO,
  OPCOES_FONTE,
  TAMANHO_BLOCO_DESFOQUE,
} from './constantesEditor'
import { calcularFatorEscala, normalizarRetangulo } from './geometria'

const COR_CONTORNO_CLARO = 'rgba(255, 255, 255, 0.95)'
const COR_CONTORNO_ESCURO = 'rgba(0, 0, 0, 0.75)'
const COR_SOMBRA = 'rgba(0, 0, 0, 0.38)'
const DESFOQUE_SOMBRA = 14
const DESLOCAMENTO_SOMBRA = 5
const LIMIAR_LUMINANCIA_COR_CLARA = 0.6
const ANGULO_PONTA_SETA = Math.PI / 7
const RAZAO_CONTORNO_TEXTO = 0.16
const RAZAO_ESPACAMENTO_TEXTO = 0.3
const RAZAO_ALTURA_LINHA_TEXTO = 1.2
const OPACIDADE_PREENCHIMENTO_TRANSLUCIDO = 0.25
const RAZAO_TRACO_TRACEJADO = 2.4
const RAZAO_ESPACO_TRACEJADO = 1.8
const RAZAO_ESPACO_PONTILHADO = 2
const COMPRIMENTO_PONTO = 0.01
const COR_TEXTO_SOBRE_CLARO = '#111111'
const COR_TEXTO_SOBRE_ESCURO = '#FFFFFF'
const PESO_NEGRITO = 700
const PESO_NORMAL = 400
const SEPARADOR_LINHAS = '\n'
const FORMATO_NUMERO: Partial<FormatoTexto> = { negrito: true }

let contextoMedicao: CanvasRenderingContext2D | null = null
const fontesSolicitadas = new Set<string>()

function familiaDaFonte(fonte: FormatoTexto['fonte'] | undefined): string {
  const opcao =
    OPCOES_FONTE.find((item) => item.valor === fonte) ??
    OPCOES_FONTE.find((item) => item.valor === FONTE_PADRAO)
  return opcao?.familia ?? 'sans-serif'
}

export function montarFonte(tamanho: number, formato: Partial<FormatoTexto> = {}): string {
  const estilo = formato.italico ? 'italic ' : ''
  const peso = formato.negrito ? PESO_NEGRITO : PESO_NORMAL
  return `${estilo}${peso} ${Math.max(1, Math.round(tamanho))}px ${familiaDaFonte(formato.fonte)}`
}

export function carregarFontesFaltantes(anotacoes: Anotacao[], aoCarregar: () => void) {
  if (typeof document === 'undefined' || !document.fonts) return
  for (const anotacao of anotacoes) {
    if (anotacao.tipo !== 'texto') continue
    const fonte = montarFonte(anotacao.tamanhoFonte, anotacao)
    if (fontesSolicitadas.has(fonte) || document.fonts.check(fonte)) continue
    fontesSolicitadas.add(fonte)
    document.fonts
      .load(fonte)
      .then(aoCarregar)
      .catch(() => undefined)
  }
}

export async function aguardarFontes(anotacoes: Anotacao[]): Promise<void> {
  if (typeof document === 'undefined' || !document.fonts) return
  const textos = anotacoes.filter((anotacao) => anotacao.tipo === 'texto')
  await Promise.all(
    textos.map((texto) =>
      document.fonts.load(montarFonte(texto.tamanhoFonte, texto)).catch(() => undefined)
    )
  )
}

export function isCorClara(cor: string): boolean {
  const hex = cor.replace('#', '')
  const vermelho = Number.parseInt(hex.slice(0, 2), 16) / 255
  const verde = Number.parseInt(hex.slice(2, 4), 16) / 255
  const azul = Number.parseInt(hex.slice(4, 6), 16) / 255
  const luminancia = 0.299 * vermelho + 0.587 * verde + 0.114 * azul
  return luminancia > LIMIAR_LUMINANCIA_COR_CLARA
}

function corDeContorno(cor: string): string {
  return isCorClara(cor) ? COR_CONTORNO_ESCURO : COR_CONTORNO_CLARO
}

function corDoTextoSobre(cor: string): string {
  return isCorClara(cor) ? COR_TEXTO_SOBRE_CLARO : COR_TEXTO_SOBRE_ESCURO
}

function prepararTraco(contexto: CanvasRenderingContext2D, cor: string, espessura: number) {
  contexto.strokeStyle = cor
  contexto.fillStyle = cor
  contexto.lineWidth = espessura
  contexto.lineCap = 'round'
  contexto.lineJoin = 'round'
}

function aplicarEstiloBorda(contexto: CanvasRenderingContext2D, anotacao: AnotacaoArraste) {
  if (anotacao.estiloBorda === 'tracejada') {
    contexto.setLineDash([
      anotacao.espessura * RAZAO_TRACO_TRACEJADO,
      anotacao.espessura * RAZAO_ESPACO_TRACEJADO,
    ])
    return
  }
  if (anotacao.estiloBorda === 'pontilhada') {
    contexto.lineCap = 'round'
    contexto.setLineDash([COMPRIMENTO_PONTO, anotacao.espessura * RAZAO_ESPACO_PONTILHADO])
  }
}

function obterContextoMedicao(): CanvasRenderingContext2D | null {
  contextoMedicao ??= document.createElement('canvas').getContext('2d')
  return contextoMedicao
}

export function contextoParaAcerto(): CanvasRenderingContext2D | null {
  const contexto = obterContextoMedicao()
  contexto?.setTransform(1, 0, 0, 1, 0, 0)
  return contexto
}

interface MedidaTexto {
  linhas: string[]
  larguras: number[]
  larguraMaxima: number
  alturaLinha: number
}

function medirLinhas(anotacao: AnotacaoTexto): MedidaTexto {
  const contexto = obterContextoMedicao()
  const linhas = anotacao.texto.split(SEPARADOR_LINHAS)
  if (contexto) contexto.font = montarFonte(anotacao.tamanhoFonte, anotacao)
  const larguras = linhas.map((linha) =>
    contexto ? contexto.measureText(linha).width : linha.length * anotacao.tamanhoFonte * 0.55
  )
  return {
    linhas,
    larguras,
    larguraMaxima: Math.max(0, ...larguras),
    alturaLinha: anotacao.tamanhoFonte * RAZAO_ALTURA_LINHA_TEXTO,
  }
}

export function medirCaixaTexto(anotacao: AnotacaoTexto): Retangulo {
  const { linhas, larguraMaxima, alturaLinha } = medirLinhas(anotacao)
  const espacamento = anotacao.tamanhoFonte * RAZAO_ESPACAMENTO_TEXTO
  return {
    x: anotacao.posicao.x - espacamento,
    y: anotacao.posicao.y - espacamento,
    largura: larguraMaxima + espacamento * 2,
    altura: linhas.length * alturaLinha + espacamento * 2,
  }
}

function desenharCaminhoSuave(contexto: CanvasRenderingContext2D, anotacao: AnotacaoTraco) {
  const [primeiro, ...restantes] = anotacao.pontos
  if (!primeiro) return

  contexto.beginPath()
  contexto.moveTo(primeiro.x, primeiro.y)

  if (restantes.length === 0) {
    contexto.lineTo(primeiro.x + 0.1, primeiro.y + 0.1)
  }

  restantes.forEach((ponto, indice) => {
    const proximo = restantes[indice + 1]
    if (!proximo) {
      contexto.lineTo(ponto.x, ponto.y)
      return
    }
    contexto.quadraticCurveTo(
      ponto.x,
      ponto.y,
      (ponto.x + proximo.x) / 2,
      (ponto.y + proximo.y) / 2
    )
  })

  contexto.stroke()
}

function desenharTraco(contexto: CanvasRenderingContext2D, anotacao: AnotacaoTraco) {
  contexto.save()
  if (anotacao.tipo === 'marcaTexto') {
    contexto.globalAlpha *= OPACIDADE_MARCA_TEXTO
    contexto.globalCompositeOperation = 'multiply'
    prepararTraco(contexto, anotacao.cor, anotacao.espessura * MULTIPLICADOR_MARCA_TEXTO)
    contexto.lineCap = 'butt'
  } else {
    prepararTraco(contexto, anotacao.cor, anotacao.espessura)
  }
  desenharCaminhoSuave(contexto, anotacao)
  contexto.restore()
}

function desenharSeta(contexto: CanvasRenderingContext2D, anotacao: AnotacaoArraste) {
  const { inicio, fim, espessura } = anotacao
  const angulo = Math.atan2(fim.y - inicio.y, fim.x - inicio.x)
  const comprimento = Math.hypot(fim.x - inicio.x, fim.y - inicio.y)
  const tamanhoPonta = Math.min(espessura * 4 + 10, comprimento * 0.6)
  const recuoHaste = tamanhoPonta * Math.cos(ANGULO_PONTA_SETA) * 0.8

  contexto.save()
  prepararTraco(contexto, anotacao.cor, espessura)
  aplicarEstiloBorda(contexto, anotacao)
  contexto.beginPath()
  contexto.moveTo(inicio.x, inicio.y)
  contexto.lineTo(fim.x - Math.cos(angulo) * recuoHaste, fim.y - Math.sin(angulo) * recuoHaste)
  contexto.stroke()

  contexto.setLineDash([])
  contexto.beginPath()
  contexto.moveTo(fim.x, fim.y)
  contexto.lineTo(
    fim.x - tamanhoPonta * Math.cos(angulo - ANGULO_PONTA_SETA),
    fim.y - tamanhoPonta * Math.sin(angulo - ANGULO_PONTA_SETA)
  )
  contexto.lineTo(
    fim.x - tamanhoPonta * Math.cos(angulo + ANGULO_PONTA_SETA),
    fim.y - tamanhoPonta * Math.sin(angulo + ANGULO_PONTA_SETA)
  )
  contexto.closePath()
  contexto.lineWidth = Math.max(1, espessura * 0.5)
  contexto.fill()
  contexto.stroke()
  contexto.restore()
}

function desenharLinha(contexto: CanvasRenderingContext2D, anotacao: AnotacaoArraste) {
  contexto.save()
  prepararTraco(contexto, anotacao.cor, anotacao.espessura)
  aplicarEstiloBorda(contexto, anotacao)
  contexto.beginPath()
  contexto.moveTo(anotacao.inicio.x, anotacao.inicio.y)
  contexto.lineTo(anotacao.fim.x, anotacao.fim.y)
  contexto.stroke()
  contexto.restore()
}

function desenharForma(contexto: CanvasRenderingContext2D, anotacao: AnotacaoArraste) {
  const caminho = criarCaminhoForma(anotacao)

  contexto.save()
  if (anotacao.preenchimento !== 'nenhum') {
    contexto.save()
    if (anotacao.preenchimento === 'translucido') {
      contexto.globalAlpha *= OPACIDADE_PREENCHIMENTO_TRANSLUCIDO
    }
    contexto.fillStyle = anotacao.corPreenchimento
    contexto.fill(caminho)
    contexto.restore()
    contexto.shadowColor = 'transparent'
  }

  if (anotacao.espessura > 0) {
    prepararTraco(contexto, anotacao.cor, anotacao.espessura)
    contexto.lineJoin = anotacao.tipo === 'retangulo' && anotacao.raioCanto <= 0 ? 'miter' : 'round'
    aplicarEstiloBorda(contexto, anotacao)
    contexto.stroke(caminho)
  }
  contexto.restore()
}

export function pixelarRegiao(
  contexto: CanvasRenderingContext2D,
  fonte: CanvasImageSource,
  regiao: Retangulo,
  recorte: Retangulo,
  tamanhoBloco: number
) {
  const largura = Math.round(regiao.largura)
  const altura = Math.round(regiao.altura)
  if (largura < 1 || altura < 1) return

  const reduzido = document.createElement('canvas')
  reduzido.width = Math.max(1, Math.ceil(largura / tamanhoBloco))
  reduzido.height = Math.max(1, Math.ceil(altura / tamanhoBloco))
  const contextoReduzido = reduzido.getContext('2d')
  if (!contextoReduzido) return

  contextoReduzido.drawImage(
    fonte,
    regiao.x - recorte.x,
    regiao.y - recorte.y,
    largura,
    altura,
    0,
    0,
    reduzido.width,
    reduzido.height
  )

  contexto.save()
  contexto.imageSmoothingEnabled = false
  contexto.drawImage(
    reduzido,
    0,
    0,
    reduzido.width,
    reduzido.height,
    regiao.x,
    regiao.y,
    largura,
    altura
  )
  contexto.restore()
}

function desenharDesfoque(
  contexto: CanvasRenderingContext2D,
  anotacao: AnotacaoArraste,
  recorte: Retangulo,
  fatorEscala: number,
  fonte: CanvasImageSource
) {
  const regiao = normalizarRetangulo(anotacao.inicio, anotacao.fim)
  pixelarRegiao(contexto, fonte, regiao, recorte, TAMANHO_BLOCO_DESFOQUE * fatorEscala)
}

function escreverLinhas(
  contexto: CanvasRenderingContext2D,
  anotacao: AnotacaoTexto,
  medida: MedidaTexto,
  modo: 'contorno' | 'preenchimento'
) {
  medida.linhas.forEach((linha, indice) => {
    const largura = medida.larguras[indice] ?? 0
    const sobra = medida.larguraMaxima - largura
    const deslocamento =
      anotacao.alinhamento === 'centro' ? sobra / 2 : anotacao.alinhamento === 'direita' ? sobra : 0
    const x = anotacao.posicao.x + deslocamento
    const y = anotacao.posicao.y + indice * medida.alturaLinha
    if (modo === 'contorno') contexto.strokeText(linha, x, y)
    else contexto.fillText(linha, x, y)
  })
}

export function desenharTexto(contexto: CanvasRenderingContext2D, anotacao: AnotacaoTexto) {
  const medida = medirLinhas(anotacao)
  contexto.save()

  if (anotacao.estiloTexto === 'etiqueta') {
    const caixa = medirCaixaTexto(anotacao)
    contexto.fillStyle = anotacao.cor
    contexto.beginPath()
    contexto.roundRect(
      caixa.x,
      caixa.y,
      caixa.largura,
      caixa.altura,
      Math.min(caixa.altura, medida.alturaLinha) * 0.25
    )
    contexto.fill()
    contexto.shadowColor = 'transparent'
  }

  contexto.font = montarFonte(anotacao.tamanhoFonte, anotacao)
  contexto.textBaseline = 'top'

  if (anotacao.estiloTexto === 'contorno') {
    contexto.lineJoin = 'round'
    contexto.lineWidth = anotacao.tamanhoFonte * RAZAO_CONTORNO_TEXTO
    contexto.strokeStyle = corDeContorno(anotacao.cor)
    escreverLinhas(contexto, anotacao, medida, 'contorno')
    contexto.shadowColor = 'transparent'
  }

  contexto.fillStyle =
    anotacao.estiloTexto === 'etiqueta' ? corDoTextoSobre(anotacao.cor) : anotacao.cor
  escreverLinhas(contexto, anotacao, medida, 'preenchimento')
  contexto.restore()
}

function desenharNumero(contexto: CanvasRenderingContext2D, anotacao: AnotacaoNumero) {
  const { posicao, raio, cor, numero } = anotacao

  contexto.save()
  contexto.beginPath()
  contexto.arc(posicao.x, posicao.y, raio, 0, Math.PI * 2)
  contexto.fillStyle = cor
  contexto.fill()
  contexto.shadowColor = 'transparent'
  contexto.lineWidth = Math.max(2, raio * 0.16)
  contexto.strokeStyle = corDeContorno(cor)
  contexto.stroke()

  contexto.font = montarFonte(raio * 1.15, FORMATO_NUMERO)
  contexto.textAlign = 'center'
  contexto.textBaseline = 'middle'
  contexto.fillStyle = corDoTextoSobre(cor)
  contexto.fillText(String(numero), posicao.x, posicao.y + raio * 0.06)
  contexto.restore()
}

function aplicarEfeitos(
  contexto: CanvasRenderingContext2D,
  anotacao: Anotacao,
  fatorEscala: number
) {
  contexto.globalAlpha = (anotacao.opacidade ?? OPACIDADE_PADRAO) / 100
  if (!anotacao.sombra) return
  contexto.shadowColor = COR_SOMBRA
  contexto.shadowBlur = DESFOQUE_SOMBRA * fatorEscala
  contexto.shadowOffsetY = DESLOCAMENTO_SOMBRA * fatorEscala
}

export function desenharAnotacao(
  contexto: CanvasRenderingContext2D,
  anotacao: Anotacao,
  recorte: Retangulo,
  fatorEscala: number,
  fontePixelizacao: CanvasImageSource
) {
  if (anotacao.tipo === 'recorte') return
  if (anotacao.tipo === 'desfoque') {
    desenharDesfoque(contexto, anotacao, recorte, fatorEscala, fontePixelizacao)
    return
  }

  contexto.save()
  aplicarEfeitos(contexto, anotacao, fatorEscala)
  switch (anotacao.tipo) {
    case 'pincel':
    case 'marcaTexto':
      desenharTraco(contexto, anotacao)
      break
    case 'seta':
      desenharSeta(contexto, anotacao)
      break
    case 'linha':
      desenharLinha(contexto, anotacao)
      break
    case 'texto':
      desenharTexto(contexto, anotacao)
      break
    case 'numero':
      desenharNumero(contexto, anotacao)
      break
    default:
      desenharForma(contexto, anotacao)
  }
  contexto.restore()
}

export function ajustarTamanhoCanvas(canvas: HTMLCanvasElement, recorte: Retangulo) {
  const largura = Math.round(recorte.largura)
  const altura = Math.round(recorte.altura)
  if (canvas.width !== largura) canvas.width = largura
  if (canvas.height !== altura) canvas.height = altura
}

export function prepararContexto(
  canvas: HTMLCanvasElement,
  recorte: Retangulo
): CanvasRenderingContext2D | null {
  const contexto = canvas.getContext('2d')
  if (!contexto) return null
  contexto.setTransform(1, 0, 0, 1, 0, 0)
  contexto.clearRect(0, 0, canvas.width, canvas.height)
  contexto.setTransform(1, 0, 0, 1, -recorte.x, -recorte.y)
  return contexto
}

export function renderizarCena(
  canvas: HTMLCanvasElement,
  imagem: ImagemEditor,
  anotacoes: Anotacao[],
  recorte: Retangulo,
  corFundoExportacao: string | null = null
) {
  ajustarTamanhoCanvas(canvas, recorte)
  const contexto = prepararContexto(canvas, recorte)
  if (!contexto) return

  if (corFundoExportacao) {
    contexto.fillStyle = corFundoExportacao
    contexto.fillRect(recorte.x, recorte.y, recorte.largura, recorte.altura)
  }

  const fatorEscala = calcularFatorEscala(imagem)
  contexto.drawImage(imagem.bitmap, 0, 0)
  for (const anotacao of anotacoes) {
    desenharAnotacao(contexto, anotacao, recorte, fatorEscala, canvas)
  }
}
