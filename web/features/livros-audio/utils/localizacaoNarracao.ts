import type { TrechoNarracao } from '../types'
import type { ItemTextoPdf, SegmentoDestaque } from './pdf'

export interface PaginaComTexto {
  numero: number
  itens: ItemTextoPdf[]
}

export interface LocalizacaoTrecho {
  pagina: number
  segmentos: SegmentoDestaque[]
  palavras?: (LocalizacaoTrecho | null)[]
}

interface MapaTexto {
  normalizado: string
  paginas: number[]
  itens: number[]
  caracteres: number[]
}

const TAMANHOS_PREFIXO = [24, 12]
const TAMANHO_SUFIXO = 24
const JANELA_BUSCA_EXTRA = 1500
const MULTIPLICADOR_JANELA = 3
const FOLGA_BUSCA_PALAVRA = 40
const PADRAO_ACENTOS = /\p{M}/gu
const PADRAO_NAO_ALFANUMERICO = /[^\p{L}\p{N}]/gu

export function normalizarTextoNarracao(texto: string): string {
  return texto
    .normalize('NFKD')
    .replace(PADRAO_ACENTOS, '')
    .toLowerCase()
    .replace(PADRAO_NAO_ALFANUMERICO, '')
}

function montarMapaTexto(paginas: PaginaComTexto[]): MapaTexto {
  const partes: string[] = []
  const mapa: MapaTexto = { normalizado: '', paginas: [], itens: [], caracteres: [] }

  for (const pagina of paginas) {
    pagina.itens.forEach((item, indiceItem) => {
      let posicao = 0
      for (const caractere of item.texto) {
        for (const normalizado of normalizarTextoNarracao(caractere)) {
          partes.push(normalizado)
          mapa.paginas.push(pagina.numero)
          mapa.itens.push(indiceItem)
          mapa.caracteres.push(posicao)
        }
        posicao += caractere.length
      }
    })
  }

  mapa.normalizado = partes.join('')
  return mapa
}

function buscarInicio(texto: string, agulha: string, de: number, ate: number): number {
  for (const tamanho of TAMANHOS_PREFIXO) {
    const prefixo = agulha.slice(0, tamanho)
    const posicao = texto.indexOf(prefixo, de)
    if (posicao >= 0 && posicao <= ate) {
      return posicao
    }
  }

  const sufixo = agulha.slice(-TAMANHO_SUFIXO)
  const posicaoSufixo = texto.indexOf(sufixo, de)
  if (posicaoSufixo >= 0 && posicaoSufixo <= ate + agulha.length) {
    return Math.max(de, posicaoSufixo + sufixo.length - agulha.length)
  }

  return -1
}

function montarLocalizacao(mapa: MapaTexto, inicio: number, fim: number): LocalizacaoTrecho | null {
  const segmentos: SegmentoDestaque[] = []

  for (let posicao = inicio; posicao < fim; posicao++) {
    const pagina = mapa.paginas[posicao] ?? 0
    const item = mapa.itens[posicao] ?? 0
    const caractere = mapa.caracteres[posicao] ?? 0
    const atual = segmentos[segmentos.length - 1]

    if (atual && atual.pagina === pagina) {
      atual.itemFim = item
      atual.caractereFim = caractere + 1
    } else {
      segmentos.push({
        pagina,
        itemInicio: item,
        caractereInicio: caractere,
        itemFim: item,
        caractereFim: caractere + 1,
      })
    }
  }

  const primeiro = segmentos[0]
  return primeiro ? { pagina: primeiro.pagina, segmentos } : null
}

interface PalavrasLocalizadas {
  localizacoes: (LocalizacaoTrecho | null)[]
  fim: number
}

function localizarPalavras(
  mapa: MapaTexto,
  trecho: TrechoNarracao,
  inicioTrecho: number,
  fimTrecho: number
): PalavrasLocalizadas | null {
  let cursor = inicioTrecho
  let ultimo = -1

  const localizacoes = trecho.palavras.map((palavra) => {
    const agulha = normalizarTextoNarracao(palavra.texto)
    if (agulha.length === 0) return null

    const posicao = mapa.normalizado.indexOf(agulha, cursor)
    if (posicao < 0 || posicao > fimTrecho + FOLGA_BUSCA_PALAVRA) return null

    const fim = posicao + agulha.length
    cursor = fim
    ultimo = fim

    return montarLocalizacao(mapa, posicao, fim)
  })

  return ultimo >= 0 ? { localizacoes, fim: ultimo } : null
}

export function localizarTrechos(
  paginas: PaginaComTexto[],
  trechos: TrechoNarracao[]
): (LocalizacaoTrecho | null)[] {
  const mapa = montarMapaTexto(paginas)
  let cursor = 0

  return trechos.map((trecho) => {
    const agulha = normalizarTextoNarracao(trecho.texto)
    if (agulha.length === 0) return null

    const limite = cursor + agulha.length * MULTIPLICADOR_JANELA + JANELA_BUSCA_EXTRA
    const inicio = buscarInicio(mapa.normalizado, agulha, cursor, limite)
    if (inicio < 0) return null

    const fimEstimado = Math.min(mapa.normalizado.length, inicio + agulha.length)
    const palavras = localizarPalavras(mapa, trecho, inicio, fimEstimado)
    const fim = palavras ? Math.max(fimEstimado, palavras.fim) : fimEstimado
    cursor = fim

    const localizacao = montarLocalizacao(mapa, inicio, fim)
    if (localizacao && palavras) {
      localizacao.palavras = palavras.localizacoes
    }

    return localizacao
  })
}

export function encontrarIndiceTrecho(trechos: { inicio: number }[], segundos: number): number {
  if (trechos.length === 0) return -1

  let esquerda = 0
  let direita = trechos.length - 1
  let encontrado = 0

  while (esquerda <= direita) {
    const meio = Math.floor((esquerda + direita) / 2)
    const trecho = trechos[meio]
    if (trecho && trecho.inicio <= segundos) {
      encontrado = meio
      esquerda = meio + 1
    } else {
      direita = meio - 1
    }
  }

  return encontrado
}

export function encontrarPaginaLocalizada(
  localizacoes: (LocalizacaoTrecho | null)[] | undefined,
  indice: number
): number | null {
  if (!localizacoes) return null

  for (let atual = indice; atual >= 0; atual--) {
    const localizacao = localizacoes[atual]
    if (localizacao) return localizacao.pagina
  }

  return null
}
