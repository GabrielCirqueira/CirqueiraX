import { type PDFDocumentProxy, obterItensTextoPagina } from './pdf'

export interface CapituloLivro {
  titulo: string
  pagina: number
  nivel: number
}

export interface IndiceLivro {
  capitulos: CapituloLivro[]
  origem: 'indice' | 'titulos' | 'nenhum'
}

const PROPORCAO_TITULO = 1.35
const LIMITE_TITULOS = 120
const TAMANHO_MAXIMO_TITULO = 90
const PADRAO_LETRA = /\p{L}/u

interface ItemOutline {
  title: string
  dest: string | unknown[] | null
  items?: ItemOutline[]
}

async function resolverPagina(documento: PDFDocumentProxy, destino: ItemOutline['dest']) {
  try {
    const explicito =
      typeof destino === 'string' ? await documento.getDestination(destino) : destino
    const referencia = Array.isArray(explicito) ? explicito[0] : null
    if (typeof referencia === 'number') return referencia + 1
    if (referencia && typeof referencia === 'object') {
      return (
        (await documento.getPageIndex(
          referencia as Parameters<PDFDocumentProxy['getPageIndex']>[0]
        )) + 1
      )
    }
  } catch {}
  return null
}

async function lerIndiceDoPdf(documento: PDFDocumentProxy): Promise<CapituloLivro[]> {
  const outline = ((await documento.getOutline().catch(() => null)) ?? []) as ItemOutline[]
  const capitulos: CapituloLivro[] = []

  async function percorrer(itens: ItemOutline[], nivel: number) {
    for (const item of itens) {
      const pagina = await resolverPagina(documento, item.dest)
      const titulo = item.title?.trim()
      if (pagina && titulo) capitulos.push({ titulo, pagina, nivel })
      if (item.items?.length && nivel < 2) await percorrer(item.items, nivel + 1)
    }
  }

  await percorrer(outline, 1)
  return capitulos
}

async function detectarTitulos(documento: PDFDocumentProxy): Promise<CapituloLivro[]> {
  const paginas = await Promise.all(
    Array.from({ length: documento.numPages }, (_, indice) =>
      obterItensTextoPagina(documento, indice + 1).then((itens) => ({ numero: indice + 1, itens }))
    )
  )

  const pesos = new Map<number, number>()
  for (const pagina of paginas) {
    for (const item of pagina.itens) {
      const tamanho = Math.round(Math.hypot(item.transform[2] ?? 0, item.transform[3] ?? 0) * 2) / 2
      if (tamanho > 0) pesos.set(tamanho, (pesos.get(tamanho) ?? 0) + item.texto.length)
    }
  }
  const tamanhoTexto = [...pesos.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? 0
  if (tamanhoTexto <= 0) return []

  const candidatos: (CapituloLivro & { tamanho: number })[] = []
  for (const pagina of paginas) {
    let atual: (CapituloLivro & { tamanho: number }) | null = null
    for (const item of pagina.itens) {
      const tamanho = Math.hypot(item.transform[2] ?? 0, item.transform[3] ?? 0)
      const texto = item.texto.trim()
      const ehTitulo = tamanho >= tamanhoTexto * PROPORCAO_TITULO && PADRAO_LETRA.test(texto)
      if (!ehTitulo) {
        if (texto) atual = null
        continue
      }
      if (atual && Math.abs(atual.tamanho - tamanho) <= tamanho * 0.05) {
        atual.titulo = `${atual.titulo} ${texto}`.replace(/\s+/g, ' ')
      } else {
        atual = { titulo: texto, pagina: pagina.numero, nivel: 1, tamanho }
        candidatos.push(atual)
      }
    }
  }

  let selecionados = candidatos
  if (candidatos.length > LIMITE_TITULOS) {
    const tamanhos = [...new Set(candidatos.map((item) => Math.round(item.tamanho)))].sort(
      (a, b) => b - a
    )
    let limite = tamanhos[0] ?? 0
    for (const tamanho of tamanhos) {
      if (candidatos.filter((item) => Math.round(item.tamanho) >= tamanho).length > LIMITE_TITULOS)
        break
      limite = tamanho
    }
    selecionados = candidatos.filter((item) => Math.round(item.tamanho) >= limite)
  }

  return selecionados
    .map(({ titulo, pagina, nivel }) => ({
      titulo:
        titulo.length > TAMANHO_MAXIMO_TITULO
          ? `${titulo.slice(0, TAMANHO_MAXIMO_TITULO)}…`
          : titulo,
      pagina,
      nivel,
    }))
    .filter((item, indice, lista) => item.titulo !== lista[indice - 1]?.titulo)
}

export async function obterIndiceLivro(documento: PDFDocumentProxy): Promise<IndiceLivro> {
  const doPdf = await lerIndiceDoPdf(documento)
  if (doPdf.length > 0) return { capitulos: doPdf, origem: 'indice' }

  const titulos = await detectarTitulos(documento)
  return titulos.length > 0
    ? { capitulos: titulos, origem: 'titulos' }
    : { capitulos: [], origem: 'nenhum' }
}
