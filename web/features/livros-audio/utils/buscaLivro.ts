import { type PDFDocumentProxy, type SegmentoDestaque, obterItensTextoPagina } from './pdf'

export interface ResultadoBusca {
  id: string
  pagina: number
  antes: string
  encontrado: string
  depois: string
  segmentos: SegmentoDestaque[]
}

interface TextoPagina {
  normalizado: string
  original: string
  mapaOriginal: number[]
  mapaItem: { item: number; caractere: number }[]
}

const CONTEXTO = 45
const PADRAO_MARCAS = /\p{M}/gu
const cache = new WeakMap<PDFDocumentProxy, Map<number, Promise<TextoPagina>>>()

export function normalizarBusca(texto: string): string {
  return texto.normalize('NFD').replace(PADRAO_MARCAS, '').toLowerCase().replace(/\s+/g, ' ').trim()
}

async function montarTextoPagina(
  documento: PDFDocumentProxy,
  numero: number
): Promise<TextoPagina> {
  const itens = await obterItensTextoPagina(documento, numero)
  let normalizado = ''
  let original = ''
  const mapaOriginal: number[] = []
  const mapaItem: { item: number; caractere: number }[] = []

  const adicionar = (caractere: string, item: number, posicao: number) => {
    const indiceOriginal = original.length
    original += caractere
    const convertido = /\s/.test(caractere)
      ? ' '
      : caractere.normalize('NFD').replace(PADRAO_MARCAS, '').toLowerCase()
    for (const parte of convertido) {
      if (parte === ' ' && normalizado.endsWith(' ')) continue
      normalizado += parte
      mapaOriginal.push(indiceOriginal)
      mapaItem.push({ item, caractere: posicao })
    }
  }

  itens.forEach((item, indiceItem) => {
    Array.from(item.texto).forEach((caractere, posicao) =>
      adicionar(caractere, indiceItem, posicao)
    )
    adicionar(' ', indiceItem, item.texto.length)
  })

  return { normalizado, original, mapaOriginal, mapaItem }
}

function obterTextoPagina(documento: PDFDocumentProxy, numero: number): Promise<TextoPagina> {
  let porPagina = cache.get(documento)
  if (!porPagina) {
    porPagina = new Map()
    cache.set(documento, porPagina)
  }
  const existente = porPagina.get(numero)
  if (existente) return existente
  const promessa = montarTextoPagina(documento, numero)
  porPagina.set(numero, promessa)
  return promessa
}

export async function buscarNoLivro(
  documento: PDFDocumentProxy,
  consulta: string,
  limite = 200,
  onProgresso?: (fracao: number) => void
): Promise<ResultadoBusca[]> {
  const termo = normalizarBusca(consulta)
  if (termo.length < 2) return []

  const resultados: ResultadoBusca[] = []
  for (let numero = 1; numero <= documento.numPages && resultados.length < limite; numero++) {
    const texto = await obterTextoPagina(documento, numero)
    let inicio = texto.normalizado.indexOf(termo)
    while (inicio >= 0 && resultados.length < limite) {
      const fim = inicio + termo.length - 1
      const primeiro = texto.mapaItem[inicio]
      const ultimo = texto.mapaItem[fim]
      const origemInicio = texto.mapaOriginal[inicio] ?? 0
      const origemFim = (texto.mapaOriginal[fim] ?? origemInicio) + 1

      if (primeiro && ultimo) {
        resultados.push({
          id: `${numero}-${inicio}`,
          pagina: numero,
          antes: texto.original
            .slice(Math.max(0, origemInicio - CONTEXTO), origemInicio)
            .trimStart(),
          encontrado: texto.original.slice(origemInicio, origemFim),
          depois: texto.original.slice(origemFim, origemFim + CONTEXTO).trimEnd(),
          segmentos: [
            {
              pagina: numero,
              itemInicio: primeiro.item,
              caractereInicio: primeiro.caractere,
              itemFim: ultimo.item,
              caractereFim: ultimo.caractere + 1,
            },
          ],
        })
      }
      inicio = texto.normalizado.indexOf(termo, inicio + termo.length)
    }
    onProgresso?.(numero / documento.numPages)
  }

  return resultados
}
