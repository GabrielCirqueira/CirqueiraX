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

interface TokenPdf {
  pagina: number
  item: number
  inicio: number
  fim: number
  texto: string
}

interface TokenNarracao {
  trecho: number
  palavra: number
  texto: string
}

const PADRAO_ACENTOS = /\p{M}/gu
const PADRAO_NAO_ALFANUMERICO = /[^\p{L}\p{N}]/gu
const PADRAO_TOKEN = /\S+/gu
const SALTO_MAXIMO_TOKENS = 2
const PULAR_NARRACAO = 0
const PULAR_PDF = 1
const COMBINAR_UM_UM = 2
const COMBINAR_UM_DOIS = 3
const COMBINAR_DOIS_UM = 4

export function normalizarTextoNarracao(texto: string): string {
  return texto
    .normalize('NFKD')
    .replace(PADRAO_ACENTOS, '')
    .toLowerCase()
    .replace(PADRAO_NAO_ALFANUMERICO, '')
}

function tokenizarPdf(paginas: PaginaComTexto[]): TokenPdf[] {
  const tokens: TokenPdf[] = []

  for (const pagina of paginas) {
    pagina.itens.forEach((item, indiceItem) => {
      for (const encontrado of item.texto.matchAll(PADRAO_TOKEN)) {
        const texto = normalizarTextoNarracao(encontrado[0])
        if (texto.length === 0) continue
        const inicio = encontrado.index ?? 0
        tokens.push({
          pagina: pagina.numero,
          item: indiceItem,
          inicio,
          fim: inicio + encontrado[0].length,
          texto,
        })
      }
    })
  }

  return tokens
}

function tokenizarNarracao(trechos: TrechoNarracao[]): TokenNarracao[] {
  const tokens: TokenNarracao[] = []

  trechos.forEach((trecho, indiceTrecho) => {
    const fontes =
      trecho.palavras.length > 0
        ? trecho.palavras.map((palavra, indicePalavra) => ({
            texto: palavra.texto,
            palavra: indicePalavra,
          }))
        : [{ texto: trecho.texto, palavra: -1 }]

    for (const fonte of fontes) {
      for (const encontrado of fonte.texto.matchAll(PADRAO_TOKEN)) {
        const texto = normalizarTextoNarracao(encontrado[0])
        if (texto.length > 0) {
          tokens.push({ trecho: indiceTrecho, palavra: fonte.palavra, texto })
        }
      }
    }
  })

  return tokens
}

function alinharTokens(narracao: string[], pdf: string[]): number[][] {
  const n = narracao.length
  const m = pdf.length
  const largura = m + 1
  const direcoes = new Uint8Array((n + 1) * largura)
  let linhaAnterior2 = new Int32Array(largura)
  let linhaAnterior = new Int32Array(largura)
  let linhaAtual = new Int32Array(largura)
  const paresPdf = pdf.map((texto, indice) => (indice > 0 ? (pdf[indice - 1] ?? '') + texto : ''))

  for (let i = 1; i <= n; i++) {
    const tokenNarracao = narracao[i - 1] ?? ''
    const parNarracao = i > 1 ? (narracao[i - 2] ?? '') + tokenNarracao : ''
    linhaAtual[0] = 0

    for (let j = 1; j <= m; j++) {
      let melhor = linhaAnterior[j] ?? 0
      let direcao = PULAR_NARRACAO

      const pulandoPdf = linhaAtual[j - 1] ?? 0
      if (pulandoPdf > melhor) {
        melhor = pulandoPdf
        direcao = PULAR_PDF
      }

      const tokenPdf = pdf[j - 1] ?? ''
      if (tokenNarracao === tokenPdf) {
        const valor = (linhaAnterior[j - 1] ?? 0) + tokenPdf.length
        if (valor > melhor) {
          melhor = valor
          direcao = COMBINAR_UM_UM
        }
      }

      if (j > 1 && tokenNarracao === paresPdf[j - 1]) {
        const valor = (linhaAnterior[j - 2] ?? 0) + tokenNarracao.length
        if (valor > melhor) {
          melhor = valor
          direcao = COMBINAR_UM_DOIS
        }
      }

      if (i > 1 && parNarracao === tokenPdf) {
        const valor = (linhaAnterior2[j - 1] ?? 0) + tokenPdf.length
        if (valor > melhor) {
          melhor = valor
          direcao = COMBINAR_DOIS_UM
        }
      }

      linhaAtual[j] = melhor
      direcoes[i * largura + j] = direcao
    }

    const reciclada = linhaAnterior2
    linhaAnterior2 = linhaAnterior
    linhaAnterior = linhaAtual
    linhaAtual = reciclada
  }

  const correspondencias: number[][] = Array.from({ length: n }, () => [])
  let i = n
  let j = m

  while (i > 0 && j > 0) {
    const direcao = direcoes[i * largura + j]
    if (direcao === COMBINAR_UM_UM) {
      correspondencias[i - 1]?.push(j - 1)
      i--
      j--
    } else if (direcao === COMBINAR_UM_DOIS) {
      correspondencias[i - 1]?.push(j - 2, j - 1)
      i--
      j -= 2
    } else if (direcao === COMBINAR_DOIS_UM) {
      correspondencias[i - 1]?.push(j - 1)
      correspondencias[i - 2]?.push(j - 1)
      i -= 2
      j--
    } else if (direcao === PULAR_PDF) {
      j--
    } else {
      i--
    }
  }

  return correspondencias
}

function montarLocalizacao(tokensPdf: TokenPdf[], indices: number[]): LocalizacaoTrecho | null {
  const ordenados = [...new Set(indices)].sort((a, b) => a - b)
  const segmentos: SegmentoDestaque[] = []
  let anterior = -1

  for (const indice of ordenados) {
    const token = tokensPdf[indice]
    if (!token) continue

    const atual = segmentos[segmentos.length - 1]
    const continua =
      atual && atual.pagina === token.pagina && indice - anterior <= SALTO_MAXIMO_TOKENS

    if (atual && continua) {
      atual.itemFim = token.item
      atual.caractereFim = token.fim
    } else {
      segmentos.push({
        pagina: token.pagina,
        itemInicio: token.item,
        caractereInicio: token.inicio,
        itemFim: token.item,
        caractereFim: token.fim,
      })
    }

    anterior = indice
  }

  const primeiro = segmentos[0]
  return primeiro ? { pagina: primeiro.pagina, segmentos } : null
}

function paginaDosTokens(tokensPdf: TokenPdf[], indices: number[]): number | null {
  if (indices.length === 0) return null
  return tokensPdf[Math.min(...indices)]?.pagina ?? null
}

function buscarSequenciaLivre(
  tokensPdf: TokenPdf[],
  sequencia: string[],
  usados: Set<number>,
  paginaMinima: number,
  paginaMaxima: number
): number {
  const primeiro = sequencia[0]
  if (primeiro === undefined) return -1

  for (let inicio = 0; inicio + sequencia.length <= tokensPdf.length; inicio++) {
    const token = tokensPdf[inicio]
    if (!token || token.pagina < paginaMinima || token.pagina > paginaMaxima) continue
    if (token.texto !== primeiro || usados.has(inicio)) continue

    let combina = true
    for (let deslocamento = 1; deslocamento < sequencia.length; deslocamento++) {
      const indice = inicio + deslocamento
      if (usados.has(indice) || tokensPdf[indice]?.texto !== sequencia[deslocamento]) {
        combina = false
        break
      }
    }

    if (combina) return inicio
  }

  return -1
}

function buscarPaginaVizinha(paginas: (number | null)[], de: number, passo: number): number | null {
  for (let indice = de + passo; indice >= 0 && indice < paginas.length; indice += passo) {
    const pagina = paginas[indice]
    if (pagina !== null && pagina !== undefined) return pagina
  }
  return null
}

function completarTrechosFaltantes(
  tokensPdf: TokenPdf[],
  tokensNarracao: TokenNarracao[],
  correspondencias: number[][],
  totalTrechos: number
): void {
  const tokensPorTrecho: number[][] = Array.from({ length: totalTrechos }, () => [])
  tokensNarracao.forEach((token, indice) => tokensPorTrecho[token.trecho]?.push(indice))

  const usados = new Set(correspondencias.flat())
  const paginas = tokensPorTrecho.map((indices) =>
    paginaDosTokens(
      tokensPdf,
      indices.flatMap((indice) => correspondencias[indice] ?? [])
    )
  )
  const primeiraPagina = tokensPdf[0]?.pagina ?? 0
  const ultimaPagina = tokensPdf[tokensPdf.length - 1]?.pagina ?? 0

  tokensPorTrecho.forEach((indices, trecho) => {
    const encontrados = indices.filter((indice) => (correspondencias[indice]?.length ?? 0) > 0)
    if (indices.length === 0 || encontrados.length === indices.length) return

    const proprios = indices.flatMap((indice) => correspondencias[indice] ?? [])
    for (const indice of proprios) usados.delete(indice)

    const paginaMinima = buscarPaginaVizinha(paginas, trecho, -1) ?? primeiraPagina
    const paginaMaxima = buscarPaginaVizinha(paginas, trecho, 1) ?? ultimaPagina
    const sequencia = indices.map((indice) => tokensNarracao[indice]?.texto ?? '')
    const inicio = buscarSequenciaLivre(tokensPdf, sequencia, usados, paginaMinima, paginaMaxima)
    if (inicio < 0) {
      for (const indice of proprios) usados.add(indice)
      return
    }

    indices.forEach((indice, deslocamento) => {
      correspondencias[indice] = [inicio + deslocamento]
      usados.add(inicio + deslocamento)
    })
    paginas[trecho] = tokensPdf[inicio]?.pagina ?? null
  })
}

export function localizarTrechos(
  paginas: PaginaComTexto[],
  trechos: TrechoNarracao[]
): (LocalizacaoTrecho | null)[] {
  const tokensPdf = tokenizarPdf(paginas)
  const tokensNarracao = tokenizarNarracao(trechos)
  const correspondencias = alinharTokens(
    tokensNarracao.map((token) => token.texto),
    tokensPdf.map((token) => token.texto)
  )
  completarTrechosFaltantes(tokensPdf, tokensNarracao, correspondencias, trechos.length)

  const indicesPorTrecho: number[][] = trechos.map(() => [])
  const indicesPorPalavra: number[][][] = trechos.map((trecho) => trecho.palavras.map(() => []))

  tokensNarracao.forEach((token, indice) => {
    const encontrados = correspondencias[indice] ?? []
    if (encontrados.length === 0) return
    indicesPorTrecho[token.trecho]?.push(...encontrados)
    if (token.palavra >= 0) {
      indicesPorPalavra[token.trecho]?.[token.palavra]?.push(...encontrados)
    }
  })

  return trechos.map((trecho, indiceTrecho) => {
    const localizacao = montarLocalizacao(tokensPdf, indicesPorTrecho[indiceTrecho] ?? [])
    if (localizacao && trecho.palavras.length > 0) {
      localizacao.palavras = (indicesPorPalavra[indiceTrecho] ?? []).map((indices) =>
        indices.length > 0 ? montarLocalizacao(tokensPdf, indices) : null
      )
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

function valorPosicao(item: number, caractere: number): number {
  return item * 1_000_000 + caractere
}

function segmentoContem(
  segmento: SegmentoDestaque,
  pagina: number,
  item: number,
  caractere: number
): boolean {
  if (segmento.pagina !== pagina) return false
  const posicao = valorPosicao(item, caractere)
  return (
    posicao >= valorPosicao(segmento.itemInicio, segmento.caractereInicio) &&
    posicao <
      valorPosicao(segmento.itemFim, Math.max(segmento.caractereFim, segmento.caractereInicio + 1))
  )
}

export function encontrarTrechoNaPosicao(
  localizacoes: (LocalizacaoTrecho | null)[],
  pagina: number,
  item: number,
  caractere: number
): { trecho: number; palavra: number | null } | null {
  const posicao = valorPosicao(item, caractere)
  let contem = -1
  let anterior = -1
  let inicioAnterior = -1
  let primeiroDaPagina = -1

  localizacoes.forEach((localizacao, indice) => {
    if (!localizacao) return
    for (const segmento of localizacao.segmentos) {
      if (segmento.pagina !== pagina) continue
      if (primeiroDaPagina < 0) primeiroDaPagina = indice
      if (contem < 0 && segmentoContem(segmento, pagina, item, caractere)) contem = indice
      const inicio = valorPosicao(segmento.itemInicio, segmento.caractereInicio)
      if (inicio <= posicao && inicio >= inicioAnterior) {
        inicioAnterior = inicio
        anterior = indice
      }
    }
  })

  const trecho = contem >= 0 ? contem : anterior >= 0 ? anterior : primeiroDaPagina
  if (trecho < 0) return null

  const palavras = localizacoes[trecho]?.palavras ?? []
  const palavra = palavras.findIndex((localizacaoPalavra) =>
    localizacaoPalavra?.segmentos.some((segmento) =>
      segmentoContem(segmento, pagina, item, caractere)
    )
  )

  return { trecho, palavra: palavra >= 0 ? palavra : null }
}
