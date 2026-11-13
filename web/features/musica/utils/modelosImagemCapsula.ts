import {
  ALTURA_RODAPE,
  type DadosDesenhoCapsula,
  FONTE_MONO,
  MARGEM_IMAGEM,
  type Prancheta,
  desenharCabecalho,
  desenharCapa,
  escrever,
  linhaTracejada,
  quantidadeQueCabe,
  retanguloArredondado,
} from './desenhoCapsula'
import { formatarMinutos } from './formatadoresMusica'
import type { IdModeloImagemCapsula } from './temasImagemCapsula'

const MAXIMO_LISTA = 5
const MAXIMO_GRADE = 9
const MAXIMO_GRADE_COMPACTA = 10
const ALTURA_GRANDE = 1800
const ALTURA_MEDIA = 1300
const TOPO_RECIBO = 100
const ALTURA_FIXA_RECIBO = 750
const ALTURA_CODIGO_RECIBO = 150

type DesenharModelo = (prancheta: Prancheta, dados: DadosDesenhoCapsula) => void

function numero(valor: number): string {
  return valor.toLocaleString('pt-BR')
}

function plural(valor: number, singular: string, pluralTexto: string): string {
  return `${numero(valor)} ${valor === 1 ? singular : pluralTexto}`
}

function limiteInferior(prancheta: Prancheta): number {
  return prancheta.altura - ALTURA_RODAPE - 20
}

function larguraUtil(prancheta: Prancheta): number {
  return prancheta.largura - MARGEM_IMAGEM * 2
}

function desenharClassico(prancheta: Prancheta, dados: DadosDesenhoCapsula) {
  const { tema, altura } = prancheta
  const { capsula } = dados
  const grande = altura >= ALTURA_GRANDE
  let y = desenharCabecalho(prancheta, capsula.rotulo, grande ? 150 : 120)

  y += grande ? 170 : 130
  escrever(prancheta, formatarMinutos(capsula.totalMinutos), MARGEM_IMAGEM, y, {
    tamanho: grande ? 120 : 96,
    peso: 800,
    cor: tema.destaque,
  })
  y += 60
  escrever(
    prancheta,
    `${plural(capsula.totalStreams, 'stream', 'streams')} · ${plural(capsula.faixasDistintas, 'música diferente', 'músicas diferentes')}`,
    MARGEM_IMAGEM,
    y,
    { tamanho: 32, cor: tema.textoSecundario, larguraMaxima: larguraUtil(prancheta) }
  )

  const artista = capsula.topArtistas[0]
  if (artista && altura >= ALTURA_MEDIA) {
    const foto = grande ? 220 : 170
    y += 60
    desenharCapa(prancheta, dados.fotosArtistas[0] ?? null, MARGEM_IMAGEM, y, foto)
    const xTexto = MARGEM_IMAGEM + foto + 40
    const larguraTexto = prancheta.largura - xTexto - MARGEM_IMAGEM
    escrever(prancheta, 'ARTISTA DO MÊS', xTexto, y + foto * 0.32, {
      tamanho: 28,
      peso: 700,
      cor: tema.destaqueDois,
    })
    escrever(prancheta, artista.nomeArtista, xTexto, y + foto * 0.62, {
      tamanho: grande ? 60 : 50,
      peso: 800,
      cor: tema.texto,
      larguraMaxima: larguraTexto,
    })
    escrever(
      prancheta,
      `${formatarMinutos(artista.totalMinutos)} · ${plural(artista.totalStreams, 'stream', 'streams')}`,
      xTexto,
      y + foto * 0.86,
      { tamanho: 30, cor: tema.textoSecundario, larguraMaxima: larguraTexto }
    )
    y += foto
  }

  const alturaItem = grande ? 170 : 130
  const capa = alturaItem - 30
  y += grande ? 110 : 80
  const quantidade = quantidadeQueCabe(
    limiteInferior(prancheta) - y - 30,
    alturaItem,
    Math.min(MAXIMO_LISTA, capsula.topMusicas.length)
  )
  escrever(prancheta, `TOP ${quantidade} MÚSICAS`, MARGEM_IMAGEM, y, {
    tamanho: 28,
    peso: 700,
    cor: tema.destaqueTres,
  })
  y += 40
  capsula.topMusicas.slice(0, quantidade).forEach((musica, indice) => {
    const topo = y + indice * alturaItem
    escrever(prancheta, String(indice + 1), MARGEM_IMAGEM, topo + capa / 2 + 16, {
      tamanho: 44,
      peso: 800,
      cor: tema.apagado,
    })
    desenharCapa(prancheta, dados.capasMusicas[indice] ?? null, MARGEM_IMAGEM + 60, topo, capa)
    const xTexto = MARGEM_IMAGEM + 60 + capa + 32
    const larguraTexto = prancheta.largura - xTexto - MARGEM_IMAGEM
    escrever(prancheta, musica.nomeFaixa, xTexto, topo + capa * 0.4, {
      tamanho: grande ? 40 : 34,
      peso: 700,
      cor: tema.texto,
      larguraMaxima: larguraTexto,
    })
    escrever(prancheta, musica.artistaPrincipal, xTexto, topo + capa * 0.7, {
      tamanho: grande ? 30 : 26,
      cor: tema.textoSecundario,
      larguraMaxima: larguraTexto,
    })
    escrever(
      prancheta,
      plural(musica.totalStreams, 'stream', 'streams'),
      xTexto,
      topo + capa * 0.96,
      {
        tamanho: grande ? 26 : 22,
        peso: 600,
        cor: tema.destaque,
      }
    )
  })
}

function desenharPoster(prancheta: Prancheta, dados: DadosDesenhoCapsula) {
  const { tema, altura, largura } = prancheta
  const { capsula } = dados
  const musica = capsula.topMusicas[0]
  escrever(prancheta, `CÁPSULA SONORA · ${capsula.rotulo.toUpperCase()}`, MARGEM_IMAGEM, 130, {
    tamanho: 30,
    peso: 700,
    cor: tema.destaque,
    larguraMaxima: larguraUtil(prancheta),
  })
  const espacoCapa = altura >= ALTURA_GRANDE ? 0.48 : altura >= ALTURA_MEDIA ? 0.42 : 0.36
  const tamanhoCapa = Math.min(larguraUtil(prancheta), Math.round(altura * espacoCapa))
  const xCapa = (largura - tamanhoCapa) / 2
  desenharCapa(prancheta, dados.capasMusicas[0] ?? null, xCapa, 180, tamanhoCapa, 20)
  let y = 180 + tamanhoCapa + 80
  if (!musica) return
  escrever(prancheta, 'A MÚSICA DO MÊS', largura / 2, y, {
    tamanho: 28,
    peso: 700,
    cor: tema.destaqueDois,
    alinhamento: 'center',
  })
  y += 82
  escrever(prancheta, musica.nomeFaixa, largura / 2, y, {
    tamanho: altura >= ALTURA_MEDIA ? 72 : 58,
    peso: 800,
    cor: tema.texto,
    alinhamento: 'center',
    larguraMaxima: larguraUtil(prancheta),
  })
  y += 56
  escrever(
    prancheta,
    `${musica.artistaPrincipal} · ${plural(musica.totalStreams, 'stream', 'streams')}`,
    largura / 2,
    y,
    {
      tamanho: 34,
      cor: tema.textoSecundario,
      alinhamento: 'center',
      larguraMaxima: larguraUtil(prancheta),
    }
  )
  y += 90
  const alturaLinha = 58
  const restantes = quantidadeQueCabe(
    limiteInferior(prancheta) - y - 90,
    alturaLinha,
    Math.min(4, capsula.topMusicas.length - 1)
  )
  if (restantes > 0) {
    linhaTracejada(prancheta, MARGEM_IMAGEM, y - 40, larguraUtil(prancheta))
    capsula.topMusicas.slice(1, 1 + restantes).forEach((outra, indice) => {
      const linha = y + indice * alturaLinha
      escrever(prancheta, String(indice + 2), MARGEM_IMAGEM, linha, {
        tamanho: 34,
        peso: 800,
        cor: tema.destaque,
      })
      escrever(
        prancheta,
        `${outra.nomeFaixa} — ${outra.artistaPrincipal}`,
        MARGEM_IMAGEM + 60,
        linha,
        {
          tamanho: 32,
          peso: 600,
          cor: tema.texto,
          larguraMaxima: larguraUtil(prancheta) - 60,
        }
      )
    })
    y += restantes * alturaLinha + 30
  }
  escrever(
    prancheta,
    `${formatarMinutos(capsula.totalMinutos)} ouvidos · ${plural(capsula.faixasDistintas, 'música', 'músicas')}`,
    largura / 2,
    Math.min(y + 20, limiteInferior(prancheta)),
    { tamanho: 34, peso: 700, cor: tema.destaque, alinhamento: 'center' }
  )
}

function desenharGrade(prancheta: Prancheta, dados: DadosDesenhoCapsula) {
  const { tema, altura } = prancheta
  const { capsula } = dados
  let y = desenharCabecalho(prancheta, capsula.rotulo, 120)
  y += 60
  escrever(
    prancheta,
    `${formatarMinutos(capsula.totalMinutos)} · ${plural(capsula.totalStreams, 'stream', 'streams')}`,
    MARGEM_IMAGEM,
    y,
    { tamanho: 36, peso: 700, cor: tema.destaque }
  )
  y += 50
  const compacto = altura < ALTURA_MEDIA
  const colunas = compacto ? 5 : 3
  const tamanhoLegenda = compacto ? 22 : 26
  const espaco = 20
  const celula = (larguraUtil(prancheta) - espaco * (colunas - 1)) / colunas
  const alturaLegenda = compacto ? 34 : 46
  const disponivel = limiteInferior(prancheta) - y
  const total = Math.min(compacto ? MAXIMO_GRADE_COMPACTA : MAXIMO_GRADE, capsula.topMusicas.length)
  const linhas = [3, 2, 1].find((quantidade) => {
    const itens = Math.min(total, quantidade * colunas)
    return quantidade * (celula + espaco) + Math.ceil(itens / 2) * alturaLegenda + 20 <= disponivel
  })
  const itens = Math.min(total, (linhas ?? 1) * colunas)
  capsula.topMusicas.slice(0, itens).forEach((_, indice) => {
    const x = MARGEM_IMAGEM + (indice % colunas) * (celula + espaco)
    const topo = y + Math.floor(indice / colunas) * (celula + espaco)
    desenharCapa(prancheta, dados.capasMusicas[indice] ?? null, x, topo, celula, 14)
    retanguloArredondado(prancheta, x + 12, topo + 12, 52, 52, 26, tema.destaque)
    escrever(prancheta, String(indice + 1), x + 38, topo + 50, {
      tamanho: 28,
      peso: 800,
      cor: tema.sobreDestaque,
      alinhamento: 'center',
    })
  })
  y += Math.ceil(itens / colunas) * (celula + espaco) + 30
  const larguraColuna = (larguraUtil(prancheta) - 30) / 2
  capsula.topMusicas.slice(0, itens).forEach((musica, indice) => {
    const coluna = indice % 2
    const x = MARGEM_IMAGEM + coluna * (larguraColuna + 30)
    const linha = y + Math.floor(indice / 2) * alturaLegenda
    const largNumero = escrever(prancheta, `${indice + 1}`, x, linha, {
      tamanho: tamanhoLegenda,
      peso: 800,
      cor: tema.destaque,
    })
    escrever(
      prancheta,
      `${musica.nomeFaixa} · ${musica.artistaPrincipal}`,
      x + largNumero + 14,
      linha,
      {
        tamanho: tamanhoLegenda,
        cor: tema.texto,
        larguraMaxima: larguraColuna - largNumero - 14,
      }
    )
  })
}

function desenharPodioLinha(
  prancheta: Prancheta,
  titulo: string,
  y: number,
  tamanhoBase: number,
  itens: { nome: string; detalhe: string; imagem: HTMLImageElement | null }[]
): number {
  const { tema, largura } = prancheta
  escrever(prancheta, titulo, largura / 2, y, {
    tamanho: 28,
    peso: 700,
    cor: tema.destaqueDois,
    alinhamento: 'center',
  })
  const topoBase = y + 50
  const ordem = [1, 0, 2]
  const cores = [tema.destaque, tema.destaqueDois, tema.destaqueTres]
  const larguraColuna = larguraUtil(prancheta) / 3
  let fundo = topoBase
  ordem.forEach((posicao, coluna) => {
    const item = itens[posicao]
    if (!item) return
    const tamanho = posicao === 0 ? tamanhoBase : Math.round(tamanhoBase * 0.78)
    const centro = MARGEM_IMAGEM + larguraColuna * coluna + larguraColuna / 2
    const topo = topoBase + (posicao === 0 ? 0 : tamanhoBase - tamanho + 30)
    desenharCapa(prancheta, item.imagem, centro - tamanho / 2, topo, tamanho, 16)
    retanguloArredondado(
      prancheta,
      centro - 30,
      topo + tamanho - 30,
      60,
      60,
      30,
      cores[posicao] ?? tema.destaque
    )
    escrever(prancheta, String(posicao + 1), centro, topo + tamanho + 12, {
      tamanho: 32,
      peso: 800,
      cor: tema.sobreDestaque,
      alinhamento: 'center',
    })
    escrever(prancheta, item.nome, centro, topo + tamanho + 80, {
      tamanho: posicao === 0 ? 34 : 28,
      peso: 700,
      cor: tema.texto,
      alinhamento: 'center',
      larguraMaxima: larguraColuna - 16,
    })
    escrever(prancheta, item.detalhe, centro, topo + tamanho + 118, {
      tamanho: 24,
      cor: tema.textoSecundario,
      alinhamento: 'center',
      larguraMaxima: larguraColuna - 16,
    })
    fundo = Math.max(fundo, topo + tamanho + 118)
  })
  return fundo
}

function desenharPodio(prancheta: Prancheta, dados: DadosDesenhoCapsula) {
  const { tema, altura, largura } = prancheta
  const { capsula } = dados
  const grande = altura >= ALTURA_GRANDE
  let y = desenharCabecalho(prancheta, capsula.rotulo, grande ? 150 : 110)
  const tamanhoBase = grande ? 280 : altura >= ALTURA_MEDIA ? 200 : 150
  y = desenharPodioLinha(
    prancheta,
    'TOP ARTISTAS',
    y + (grande ? 120 : 80),
    tamanhoBase,
    capsula.topArtistas.slice(0, 3).map((artista, indice) => ({
      nome: artista.nomeArtista,
      detalhe: formatarMinutos(artista.totalMinutos),
      imagem: dados.fotosArtistas[indice] ?? null,
    }))
  )
  const precisa = tamanhoBase + 230
  if (limiteInferior(prancheta) - y - 60 >= precisa) {
    y = desenharPodioLinha(
      prancheta,
      'TOP MÚSICAS',
      y + (grande ? 110 : 80),
      tamanhoBase,
      capsula.topMusicas.slice(0, 3).map((musica, indice) => ({
        nome: musica.nomeFaixa,
        detalhe: musica.artistaPrincipal,
        imagem: dados.capasMusicas[indice] ?? null,
      }))
    )
  }
  if (limiteInferior(prancheta) - y < 90) return
  escrever(
    prancheta,
    `${formatarMinutos(capsula.totalMinutos)} · ${plural(capsula.totalStreams, 'stream', 'streams')}`,
    largura / 2,
    Math.min(y + 110, limiteInferior(prancheta)),
    { tamanho: 38, peso: 800, cor: tema.destaque, alinhamento: 'center' }
  )
}

function desenharCodigoBarras(
  prancheta: Prancheta,
  semente: string,
  x: number,
  y: number,
  largura: number
) {
  const { contexto, tema } = prancheta
  contexto.fillStyle = tema.texto
  let posicao = x
  let indice = 0
  while (posicao < x + largura) {
    const codigo = semente.charCodeAt(indice % semente.length) + indice
    const espessura = 2 + (codigo % 4) * 2
    if (indice % 2 === 0) contexto.fillRect(posicao, y, espessura, 90)
    posicao += espessura + 2
    indice += 1
  }
}

function desenharRecibo(prancheta: Prancheta, dados: DadosDesenhoCapsula) {
  const { tema, largura } = prancheta
  const { capsula } = dados
  const xCartao = MARGEM_IMAGEM
  const larguraCartao = larguraUtil(prancheta)
  const alturaLinha = 54
  const comCodigo = prancheta.altura >= ALTURA_MEDIA
  const alturaFixa = comCodigo ? ALTURA_FIXA_RECIBO : ALTURA_FIXA_RECIBO - ALTURA_CODIGO_RECIBO
  const espacoTotal = limiteInferior(prancheta) - TOPO_RECIBO
  const quantidade = quantidadeQueCabe(
    espacoTotal - alturaFixa,
    alturaLinha,
    Math.min(10, capsula.topMusicas.length)
  )
  const alturaCartao = alturaFixa + quantidade * alturaLinha
  const topoCartao = TOPO_RECIBO + Math.max(0, (espacoTotal - alturaCartao) / 2)
  retanguloArredondado(prancheta, xCartao, topoCartao, larguraCartao, alturaCartao, 18, tema.cartao)
  const xTexto = xCartao + 50
  const xDireita = xCartao + larguraCartao - 50
  const larguraTexto = larguraCartao - 100
  const mono = { fonte: FONTE_MONO }
  const centro = largura / 2
  let y = topoCartao + 90
  escrever(prancheta, 'CIRQUEIRAX RECORDS', centro, y, {
    ...mono,
    tamanho: 40,
    peso: 800,
    cor: tema.texto,
    alinhamento: 'center',
  })
  y += 50
  escrever(prancheta, `CÁPSULA SONORA · ${capsula.rotulo.toUpperCase()}`, centro, y, {
    ...mono,
    tamanho: 26,
    cor: tema.textoSecundario,
    alinhamento: 'center',
    larguraMaxima: larguraTexto,
  })
  y += 50
  linhaTracejada(prancheta, xTexto, y, larguraTexto)
  y += 55
  escrever(prancheta, 'ITEM', xTexto, y, {
    ...mono,
    tamanho: 26,
    peso: 700,
    cor: tema.textoSecundario,
  })
  escrever(prancheta, 'QTD    TEMPO', xDireita, y, {
    ...mono,
    tamanho: 26,
    peso: 700,
    cor: tema.textoSecundario,
    alinhamento: 'right',
  })
  y += 20
  capsula.topMusicas.slice(0, quantidade).forEach((musica, indice) => {
    const linha = y + (indice + 1) * alturaLinha
    const direita = `${String(musica.totalStreams).padStart(3, ' ')}x  ${String(Math.round(musica.totalMinutos)).padStart(4, ' ')}m`
    const larguraDireita = escrever(prancheta, direita, xDireita, linha, {
      ...mono,
      tamanho: 28,
      cor: tema.texto,
      alinhamento: 'right',
    })
    escrever(
      prancheta,
      `${String(indice + 1).padStart(2, '0')} ${musica.nomeFaixa}`,
      xTexto,
      linha,
      {
        ...mono,
        tamanho: 28,
        cor: tema.texto,
        larguraMaxima: larguraTexto - larguraDireita - 30,
      }
    )
  })
  y += (quantidade + 1) * alturaLinha - 10
  linhaTracejada(prancheta, xTexto, y, larguraTexto)
  const totais: [string, string][] = [
    ['ARTISTA DO MÊS', capsula.topArtistas[0]?.nomeArtista ?? '—'],
    ['MÚSICAS DIFERENTES', numero(capsula.faixasDistintas)],
    ['STREAMS', numero(capsula.totalStreams)],
  ]
  totais.forEach(([rotulo, valor], indice) => {
    const linha = y + 50 + indice * 46
    const larguraRotulo = escrever(prancheta, rotulo, xTexto, linha, {
      ...mono,
      tamanho: 26,
      cor: tema.textoSecundario,
    })
    escrever(prancheta, valor, xDireita, linha, {
      ...mono,
      tamanho: 26,
      peso: 700,
      cor: tema.texto,
      alinhamento: 'right',
      larguraMaxima: larguraTexto - larguraRotulo - 30,
    })
  })
  y += 50 + totais.length * 46 + 10
  escrever(prancheta, 'TOTAL', xTexto, y, { ...mono, tamanho: 38, peso: 800, cor: tema.texto })
  escrever(prancheta, formatarMinutos(capsula.totalMinutos).toUpperCase(), xDireita, y, {
    ...mono,
    tamanho: 38,
    peso: 800,
    cor: tema.destaque,
    alinhamento: 'right',
  })
  if (!comCodigo) return
  y += 40
  desenharCodigoBarras(
    prancheta,
    capsula.rotulo,
    xTexto + larguraTexto * 0.15,
    y,
    larguraTexto * 0.7
  )
  escrever(prancheta, 'OBRIGADO PELA AUDIÊNCIA', centro, y + 140, {
    ...mono,
    tamanho: 24,
    cor: tema.textoSecundario,
    alinhamento: 'center',
  })
}

export const DESENHOS_MODELOS: Record<IdModeloImagemCapsula, DesenharModelo> = {
  classico: desenharClassico,
  poster: desenharPoster,
  grade: desenharGrade,
  podio: desenharPodio,
  recibo: desenharRecibo,
}
