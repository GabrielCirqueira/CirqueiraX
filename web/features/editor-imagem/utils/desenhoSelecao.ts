import type { Anotacao, AnotacaoArraste, ImagemEditor, Retangulo } from '../types'
import { ajustarTamanhoCanvas, desenharAnotacao, prepararContexto } from './desenhoCanvas'
import { calcularFatorEscala, normalizarRetangulo } from './geometria'
import { alcasDaAnotacao, caixaDaAnotacao, isAnotacaoComPontas } from './selecaoAnotacoes'

const COR_SELECAO = '#00977D'
const COR_ALCA = '#FFFFFF'
const COR_MASCARA_RECORTE = 'rgba(0, 0, 0, 0.55)'
const TAMANHO_ALCA_TELA = 10
const ESPESSURA_SELECAO_TELA = 1.5
const MARGEM_SELECAO_TELA = 6
const TRACO_SELECAO_TELA = 5

export interface ConteudoSobreposicao {
  emAndamento: Anotacao | null
  selecionada: Anotacao | null
  escalaTela: number
}

function desenharMascaraRecorte(
  contexto: CanvasRenderingContext2D,
  anotacao: AnotacaoArraste,
  recorte: Retangulo,
  escalaTela: number
) {
  const area = normalizarRetangulo(anotacao.inicio, anotacao.fim)
  contexto.save()
  contexto.fillStyle = COR_MASCARA_RECORTE
  contexto.beginPath()
  contexto.rect(recorte.x, recorte.y, recorte.largura, recorte.altura)
  contexto.rect(area.x, area.y, area.largura, area.altura)
  contexto.fill('evenodd')
  contexto.setLineDash([TRACO_SELECAO_TELA / escalaTela, TRACO_SELECAO_TELA / escalaTela])
  contexto.lineWidth = ESPESSURA_SELECAO_TELA / escalaTela
  contexto.strokeStyle = COR_ALCA
  contexto.strokeRect(area.x, area.y, area.largura, area.altura)
  contexto.restore()
}

function desenharMolduraSelecao(
  contexto: CanvasRenderingContext2D,
  anotacao: Anotacao,
  escalaTela: number
) {
  if (isAnotacaoComPontas(anotacao)) return
  const margem = MARGEM_SELECAO_TELA / escalaTela
  const caixa = caixaDaAnotacao(anotacao)
  contexto.save()
  contexto.strokeStyle = COR_SELECAO
  contexto.lineWidth = ESPESSURA_SELECAO_TELA / escalaTela
  contexto.setLineDash([TRACO_SELECAO_TELA / escalaTela, (TRACO_SELECAO_TELA * 0.7) / escalaTela])
  contexto.strokeRect(
    caixa.x - margem,
    caixa.y - margem,
    caixa.largura + margem * 2,
    caixa.altura + margem * 2
  )
  contexto.restore()
}

function desenharAlcas(contexto: CanvasRenderingContext2D, anotacao: Anotacao, escalaTela: number) {
  const tamanho = TAMANHO_ALCA_TELA / escalaTela
  contexto.save()
  contexto.fillStyle = COR_ALCA
  contexto.strokeStyle = COR_SELECAO
  contexto.lineWidth = ESPESSURA_SELECAO_TELA / escalaTela
  for (const { alca, ponto } of alcasDaAnotacao(anotacao)) {
    contexto.beginPath()
    if (alca === 'inicio' || alca === 'fim') {
      contexto.arc(ponto.x, ponto.y, tamanho / 1.6, 0, Math.PI * 2)
    } else {
      contexto.roundRect(
        ponto.x - tamanho / 2,
        ponto.y - tamanho / 2,
        tamanho,
        tamanho,
        tamanho / 4
      )
    }
    contexto.fill()
    contexto.stroke()
  }
  contexto.restore()
}

export function renderizarSobreposicao(
  canvasSobreposicao: HTMLCanvasElement,
  canvasBase: HTMLCanvasElement,
  imagem: ImagemEditor,
  recorte: Retangulo,
  { emAndamento, selecionada, escalaTela }: ConteudoSobreposicao
) {
  ajustarTamanhoCanvas(canvasSobreposicao, recorte)
  const contexto = prepararContexto(canvasSobreposicao, recorte)
  if (!contexto) return

  if (emAndamento?.tipo === 'recorte') {
    desenharMascaraRecorte(contexto, emAndamento, recorte, escalaTela)
  } else if (emAndamento) {
    desenharAnotacao(contexto, emAndamento, recorte, calcularFatorEscala(imagem), canvasBase)
  }

  if (!selecionada) return
  desenharMolduraSelecao(contexto, selecionada, escalaTela)
  desenharAlcas(contexto, selecionada, escalaTela)
}
