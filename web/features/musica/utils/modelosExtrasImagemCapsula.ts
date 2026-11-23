import type { MinutosPorDiaCapsula } from '../types'
import {
  ALTURA_MEDIA,
  desenharCodigoBarras,
  larguraUtil,
  limiteInferior,
  numero,
  paisagem,
  plural,
  tamanhoQueCabe,
} from './apoioModelosCapsula'
import {
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

type IdModeloExtra = 'grafico' | 'numeros' | 'vinil' | 'revista' | 'ingresso' | 'player'

type DesenharModelo = (prancheta: Prancheta, dados: DadosDesenhoCapsula) => void

const MAXIMO_FILA = 4
const COR_DISCO = '#0E0E0E'
const COR_SULCO = 'rgba(255, 255, 255, 0.07)'
const PROGRESSO_PLAYER = 0.68

function diaDePico(dias: MinutosPorDiaCapsula[]): MinutosPorDiaCapsula | null {
  return dias.reduce<MinutosPorDiaCapsula | null>(
    (pico, dia) => (dia.minutos > (pico?.minutos ?? 0) ? dia : pico),
    null
  )
}

function diasOuvindo(dias: MinutosPorDiaCapsula[]): number {
  return dias.filter((dia) => dia.minutos > 0).length
}

function desenharFilaMusicas(
  prancheta: Prancheta,
  dados: DadosDesenhoCapsula,
  opcoes: { inicio: number; x: number; y: number; largura: number; limite: number; capa: number }
): number {
  const { tema } = prancheta
  const alturaItem = opcoes.capa + 24
  const restantes = dados.capsula.topMusicas.slice(opcoes.inicio)
  const quantidade = quantidadeQueCabe(
    opcoes.limite - opcoes.y,
    alturaItem,
    Math.min(MAXIMO_FILA, restantes.length)
  )
  restantes.slice(0, quantidade).forEach((musica, indice) => {
    const topo = opcoes.y + indice * alturaItem
    const posicao = opcoes.inicio + indice
    desenharCapa(prancheta, dados.capasMusicas[posicao] ?? null, opcoes.x, topo, opcoes.capa, 10)
    const xTexto = opcoes.x + opcoes.capa + 28
    const larguraTexto = opcoes.largura - opcoes.capa - 28
    escrever(prancheta, `${posicao + 1}. ${musica.nomeFaixa}`, xTexto, topo + opcoes.capa * 0.45, {
      tamanho: Math.round(opcoes.capa * 0.34),
      peso: 700,
      cor: tema.texto,
      larguraMaxima: larguraTexto,
    })
    escrever(
      prancheta,
      `${musica.artistaPrincipal} · ${plural(musica.totalStreams, 'stream', 'streams')}`,
      xTexto,
      topo + opcoes.capa * 0.82,
      {
        tamanho: Math.round(opcoes.capa * 0.26),
        cor: tema.textoSecundario,
        larguraMaxima: larguraTexto,
      }
    )
  })
  return opcoes.y + quantidade * alturaItem
}

function desenharGrafico(prancheta: Prancheta, dados: DadosDesenhoCapsula) {
  const { tema, altura, largura } = prancheta
  const { capsula } = dados
  const dias = capsula.minutosPorDia
  const pico = diaDePico(dias)
  const ativos = diasOuvindo(dias)
  const fim = limiteInferior(prancheta)
  const util = larguraUtil(prancheta)
  let y = desenharCabecalho(prancheta, capsula.rotulo, altura >= ALTURA_MEDIA ? 150 : 110)

  y += 110
  escrever(prancheta, formatarMinutos(capsula.totalMinutos), MARGEM_IMAGEM, y, {
    tamanho: 92,
    peso: 800,
    cor: tema.destaque,
  })
  y += 52
  escrever(
    prancheta,
    `${plural(ativos, 'dia', 'dias')} ouvindo · média de ${formatarMinutos(ativos ? capsula.totalMinutos / ativos : 0)} por dia`,
    MARGEM_IMAGEM,
    y,
    { tamanho: 30, cor: tema.textoSecundario, larguraMaxima: util }
  )

  const espacoLista = altura >= ALTURA_MEDIA && !paisagem(prancheta) ? 420 : 0
  const topoGrafico = y + 110
  const baseGrafico = Math.max(topoGrafico + 160, fim - espacoLista - 70)
  const alturaGrafico = baseGrafico - topoGrafico
  const quantidade = Math.max(1, dias.length)
  const intervalo = quantidade > 20 ? 6 : 10
  const larguraBarra = (util - intervalo * (quantidade - 1)) / quantidade
  const maximo = Math.max(1, pico?.minutos ?? 1)

  if (pico) {
    escrever(
      prancheta,
      `PICO: DIA ${pico.dia} · ${formatarMinutos(pico.minutos)}`,
      MARGEM_IMAGEM,
      topoGrafico - 30,
      {
        tamanho: 26,
        peso: 700,
        cor: tema.destaqueDois,
        larguraMaxima: util,
      }
    )
  }
  dias.forEach((dia, indice) => {
    const alturaBarra = Math.max(6, (dia.minutos / maximo) * alturaGrafico)
    const x = MARGEM_IMAGEM + indice * (larguraBarra + intervalo)
    retanguloArredondado(
      prancheta,
      x,
      baseGrafico - alturaBarra,
      larguraBarra,
      alturaBarra,
      Math.min(larguraBarra / 2, 10),
      dia === pico ? tema.destaque : tema.apagado
    )
  })
  const primeiro = dias[0]
  const ultimo = dias[dias.length - 1]
  if (primeiro && ultimo) {
    escrever(prancheta, `dia ${primeiro.dia}`, MARGEM_IMAGEM, baseGrafico + 40, {
      tamanho: 24,
      cor: tema.textoSecundario,
    })
    escrever(prancheta, `dia ${ultimo.dia}`, largura - MARGEM_IMAGEM, baseGrafico + 40, {
      tamanho: 24,
      cor: tema.textoSecundario,
      alinhamento: 'right',
    })
  }
  if (!espacoLista) return

  let yLista = baseGrafico + 110
  escrever(prancheta, 'O QUE MAIS TOCOU', MARGEM_IMAGEM, yLista, {
    tamanho: 28,
    peso: 700,
    cor: tema.destaqueTres,
  })
  yLista += 30
  desenharFilaMusicas(prancheta, dados, {
    inicio: 0,
    x: MARGEM_IMAGEM,
    y: yLista,
    largura: util,
    limite: fim,
    capa: 90,
  })
}

function desenharNumeros(prancheta: Prancheta, dados: DadosDesenhoCapsula) {
  const { tema, altura } = prancheta
  const { capsula } = dados
  const pico = diaDePico(capsula.minutosPorDia)
  const ativos = diasOuvindo(capsula.minutosPorDia)
  const fim = limiteInferior(prancheta)
  const util = larguraUtil(prancheta)
  let y = desenharCabecalho(prancheta, capsula.rotulo, altura >= ALTURA_MEDIA ? 150 : 110)

  const blocos: [string, string][] = [
    ['MINUTOS OUVIDOS', numero(Math.round(capsula.totalMinutos))],
    ['STREAMS', numero(capsula.totalStreams)],
    ['MÚSICAS DIFERENTES', numero(capsula.faixasDistintas)],
    ['DIAS OUVINDO', numero(ativos)],
    ['MÉDIA POR DIA', formatarMinutos(ativos ? capsula.totalMinutos / ativos : 0)],
    ['DIA MAIS OUVIDO', pico ? `dia ${pico.dia}` : '—'],
  ]
  const colunas = paisagem(prancheta) ? 3 : 2
  const espaco = 24
  const larguraBloco = (util - espaco * (colunas - 1)) / colunas
  const alturaBloco = altura >= ALTURA_MEDIA ? 220 : 170
  y += 70
  const destaques = altura >= ALTURA_MEDIA ? 260 : 0
  const linhas = quantidadeQueCabe(
    fim - y - destaques,
    alturaBloco + espaco,
    Math.ceil(blocos.length / colunas)
  )
  blocos.slice(0, linhas * colunas).forEach(([rotulo, valor], indice) => {
    const x = MARGEM_IMAGEM + (indice % colunas) * (larguraBloco + espaco)
    const topo = y + Math.floor(indice / colunas) * (alturaBloco + espaco)
    retanguloArredondado(prancheta, x, topo, larguraBloco, alturaBloco, 28, tema.cartao)
    escrever(prancheta, rotulo, x + 32, topo + 56, {
      tamanho: 24,
      peso: 700,
      cor: tema.textoSecundario,
      larguraMaxima: larguraBloco - 64,
    })
    escrever(prancheta, valor, x + 32, topo + alturaBloco - 44, {
      tamanho: tamanhoQueCabe(
        prancheta,
        valor,
        larguraBloco - 64,
        altura >= ALTURA_MEDIA ? 84 : 64
      ),
      peso: 800,
      cor: indice === 0 ? tema.destaque : tema.texto,
    })
  })
  if (!destaques) return

  y += linhas * (alturaBloco + espaco) + 70
  const artista = capsula.topArtistas[0]
  const musica = capsula.topMusicas[0]
  if (artista && y + 90 < fim) {
    escrever(prancheta, 'ARTISTA DO MÊS', MARGEM_IMAGEM, y, {
      tamanho: 26,
      peso: 700,
      cor: tema.destaqueDois,
    })
    escrever(prancheta, artista.nomeArtista, MARGEM_IMAGEM, y + 62, {
      tamanho: 54,
      peso: 800,
      cor: tema.texto,
      larguraMaxima: util,
    })
    y += 140
  }
  if (musica && y + 90 < fim) {
    escrever(prancheta, 'MÚSICA DO MÊS', MARGEM_IMAGEM, y, {
      tamanho: 26,
      peso: 700,
      cor: tema.destaqueTres,
    })
    escrever(prancheta, `${musica.nomeFaixa} · ${musica.artistaPrincipal}`, MARGEM_IMAGEM, y + 62, {
      tamanho: 46,
      peso: 800,
      cor: tema.texto,
      larguraMaxima: util,
    })
  }
}

function desenharDisco(prancheta: Prancheta, x: number, y: number, raio: number) {
  const { contexto, tema } = prancheta
  contexto.save()
  contexto.fillStyle = COR_DISCO
  contexto.beginPath()
  contexto.arc(x, y, raio, 0, Math.PI * 2)
  contexto.fill()
  contexto.strokeStyle = COR_SULCO
  contexto.lineWidth = 2
  for (let sulco = raio * 0.42; sulco < raio * 0.96; sulco += raio * 0.05) {
    contexto.beginPath()
    contexto.arc(x, y, sulco, 0, Math.PI * 2)
    contexto.stroke()
  }
  contexto.fillStyle = tema.destaque
  contexto.beginPath()
  contexto.arc(x, y, raio * 0.32, 0, Math.PI * 2)
  contexto.fill()
  contexto.fillStyle = COR_DISCO
  contexto.beginPath()
  contexto.arc(x, y, raio * 0.04, 0, Math.PI * 2)
  contexto.fill()
  contexto.restore()
}

function desenharVinil(prancheta: Prancheta, dados: DadosDesenhoCapsula) {
  const { tema, altura, largura } = prancheta
  const { capsula } = dados
  const musica = capsula.topMusicas[0]
  const fim = limiteInferior(prancheta)
  const util = larguraUtil(prancheta)
  const deitado = paisagem(prancheta)
  let y = desenharCabecalho(prancheta, capsula.rotulo, altura >= ALTURA_MEDIA ? 150 : 110) + 70

  const espacoAltura = fim - y
  const capa = Math.round(
    Math.min(deitado ? util * 0.38 : util / 1.4, espacoAltura * (deitado ? 0.92 : 0.44))
  )
  const conjunto = capa * 1.4
  const xCapa = deitado ? MARGEM_IMAGEM : (largura - conjunto) / 2
  desenharDisco(prancheta, xCapa + capa * 0.92, y + capa / 2, capa * 0.48)
  desenharCapa(prancheta, dados.capasMusicas[0] ?? null, xCapa, y, capa, 8)

  const xTexto = deitado ? xCapa + conjunto + 60 : MARGEM_IMAGEM
  const larguraTexto = deitado ? largura - xTexto - MARGEM_IMAGEM : util
  y = deitado ? y + 40 : y + capa + 90
  if (!musica) return
  escrever(prancheta, 'NO REPEAT', xTexto, y, { tamanho: 26, peso: 700, cor: tema.destaqueDois })
  escrever(prancheta, musica.nomeFaixa, xTexto, y + 70, {
    tamanho: tamanhoQueCabe(prancheta, musica.nomeFaixa, larguraTexto, 64),
    peso: 800,
    cor: tema.texto,
    larguraMaxima: larguraTexto,
  })
  escrever(
    prancheta,
    `${musica.artistaPrincipal} · ${plural(musica.totalStreams, 'stream', 'streams')}`,
    xTexto,
    y + 118,
    {
      tamanho: 30,
      cor: tema.textoSecundario,
      larguraMaxima: larguraTexto,
    }
  )
  y += 180
  const faixas = capsula.topMusicas.slice(1)
  const alturaLinha = 66
  const quantidade = quantidadeQueCabe(fim - y, alturaLinha, Math.min(MAXIMO_FILA, faixas.length))
  if (!quantidade) return
  escrever(prancheta, 'LADO A', xTexto, y, {
    tamanho: 24,
    peso: 700,
    cor: tema.destaqueTres,
    fonte: FONTE_MONO,
  })
  faixas.slice(0, quantidade).forEach((faixa, indice) => {
    const topo = y + 24 + indice * alturaLinha
    linhaTracejada(prancheta, xTexto, topo, larguraTexto)
    escrever(prancheta, `A${indice + 2}`, xTexto, topo + 46, {
      tamanho: 26,
      peso: 700,
      cor: tema.apagado,
      fonte: FONTE_MONO,
    })
    escrever(prancheta, `${faixa.nomeFaixa} — ${faixa.artistaPrincipal}`, xTexto + 80, topo + 46, {
      tamanho: 28,
      peso: 600,
      cor: tema.texto,
      larguraMaxima: larguraTexto - 80,
    })
  })
}

function desenharRevista(prancheta: Prancheta, dados: DadosDesenhoCapsula) {
  const { tema, largura, altura } = prancheta
  const { capsula } = dados
  const fim = limiteInferior(prancheta)
  const util = larguraUtil(prancheta)
  const deitado = paisagem(prancheta)
  const titulo = prancheta.estilo.titulo
  const tamanhoTitulo = tamanhoQueCabe(
    prancheta,
    titulo,
    util,
    altura >= ALTURA_MEDIA ? 170 : 130,
    900
  )
  let y = 90 + tamanhoTitulo
  escrever(prancheta, titulo, largura / 2, y, {
    tamanho: tamanhoTitulo,
    peso: 900,
    cor: tema.texto,
    alinhamento: 'center',
  })
  y += 26
  retanguloArredondado(prancheta, MARGEM_IMAGEM, y, util, 4, 0, tema.destaque)
  y += 48
  escrever(prancheta, `EDIÇÃO ${capsula.rotulo.toUpperCase()}`, MARGEM_IMAGEM, y, {
    tamanho: 26,
    peso: 700,
    cor: tema.destaque,
    larguraMaxima: util / 2,
  })
  escrever(
    prancheta,
    plural(capsula.totalStreams, 'STREAM', 'STREAMS'),
    largura - MARGEM_IMAGEM,
    y,
    {
      tamanho: 26,
      peso: 700,
      cor: tema.textoSecundario,
      alinhamento: 'right',
    }
  )
  y += 40

  const capa = Math.round(
    Math.min(
      deitado ? util * 0.4 : util,
      (fim - y) * (deitado ? 0.95 : altura >= ALTURA_MEDIA ? 0.55 : 0.5)
    )
  )
  const xCapa = deitado ? MARGEM_IMAGEM : (largura - capa) / 2
  desenharCapa(prancheta, dados.capasMusicas[0] ?? null, xCapa, y, capa, 6)

  const xTexto = deitado ? xCapa + capa + 60 : MARGEM_IMAGEM
  const larguraTexto = deitado ? largura - xTexto - MARGEM_IMAGEM : util
  let yTexto = deitado ? y + 50 : y + capa + 80
  const artista = capsula.topArtistas[0]
  if (artista && yTexto + 80 < fim) {
    escrever(prancheta, 'O ARTISTA DO MÊS', xTexto, yTexto, {
      tamanho: 26,
      peso: 700,
      cor: tema.destaqueDois,
    })
    escrever(prancheta, artista.nomeArtista.toUpperCase(), xTexto, yTexto + 72, {
      tamanho: tamanhoQueCabe(prancheta, artista.nomeArtista.toUpperCase(), larguraTexto, 76, 900),
      peso: 900,
      cor: tema.destaque,
    })
    yTexto += 140
  }
  const manchetes = [
    `${formatarMinutos(capsula.totalMinutos)} de música`,
    `${plural(capsula.faixasDistintas, 'música diferente', 'músicas diferentes')}`,
    capsula.topMusicas[0] ? `"${capsula.topMusicas[0].nomeFaixa}" no topo` : null,
    capsula.topAlbuns[0] ? `Álbum do mês: ${capsula.topAlbuns[0].album}` : null,
  ].filter((manchete): manchete is string => manchete !== null)
  manchetes.forEach((manchete) => {
    if (yTexto + 10 > fim) return
    escrever(prancheta, `+ ${manchete}`, xTexto, yTexto, {
      tamanho: 34,
      peso: 700,
      cor: tema.texto,
      larguraMaxima: larguraTexto,
    })
    yTexto += 56
  })
}

function desenharIngresso(prancheta: Prancheta, dados: DadosDesenhoCapsula) {
  const { tema, altura, largura } = prancheta
  const { capsula } = dados
  const fim = limiteInferior(prancheta)
  const topo = altura >= ALTURA_MEDIA ? 130 : 90
  const alturaIngresso = fim - topo
  const alturaCanhoto = Math.min(260, alturaIngresso * 0.26)
  const xDentro = MARGEM_IMAGEM + 50
  const larguraDentro = larguraUtil(prancheta) - 100
  retanguloArredondado(
    prancheta,
    MARGEM_IMAGEM,
    topo,
    larguraUtil(prancheta),
    alturaIngresso,
    36,
    tema.cartao
  )

  let y = topo + 90
  escrever(prancheta, `${prancheta.estilo.titulo} APRESENTA`, xDentro, y, {
    tamanho: 26,
    peso: 700,
    cor: tema.destaque,
    larguraMaxima: larguraDentro,
    fonte: FONTE_MONO,
  })
  const artistas = capsula.topArtistas
  const atracao = artistas[0]?.nomeArtista.toUpperCase() ?? capsula.rotulo.toUpperCase()
  const tamanhoAtracao = tamanhoQueCabe(
    prancheta,
    atracao,
    larguraDentro,
    altura >= ALTURA_MEDIA ? 130 : 96,
    900
  )
  y += 30 + tamanhoAtracao
  escrever(prancheta, atracao, xDentro, y, { tamanho: tamanhoAtracao, peso: 900, cor: tema.texto })
  const limiteCorpo = fim - alturaCanhoto - 40
  const convidados = artistas.slice(1, 5).map((artista) => artista.nomeArtista)
  if (convidados.length && y + 70 < limiteCorpo) {
    y += 64
    escrever(prancheta, `com ${convidados.join(' · ')}`, xDentro, y, {
      tamanho: 34,
      peso: 600,
      cor: tema.textoSecundario,
      larguraMaxima: larguraDentro,
    })
  }
  const informacoes: [string, string][] = [
    ['TEMPORADA', capsula.rotulo],
    ['SESSÕES', numero(capsula.totalStreams)],
    ['DURAÇÃO', formatarMinutos(capsula.totalMinutos)],
  ]
  const yInformacoes = Math.min(limiteCorpo - 20, y + (altura >= ALTURA_MEDIA ? 220 : 120))
  const larguraInformacao = larguraDentro / informacoes.length
  if (yInformacoes - 40 > y) {
    informacoes.forEach(([rotulo, valor], indice) => {
      const x = xDentro + indice * larguraInformacao
      escrever(prancheta, rotulo, x, yInformacoes - 44, {
        tamanho: 22,
        peso: 700,
        cor: tema.apagado,
        fonte: FONTE_MONO,
      })
      escrever(prancheta, valor, x, yInformacoes, {
        tamanho: 34,
        peso: 800,
        cor: tema.texto,
        larguraMaxima: larguraInformacao - 20,
      })
    })
  }
  const yPicote = fim - alturaCanhoto
  linhaTracejada(prancheta, MARGEM_IMAGEM + 20, yPicote, larguraUtil(prancheta) - 40)
  escrever(
    prancheta,
    `ADMITE UM · ${plural(capsula.faixasDistintas, 'FAIXA', 'FAIXAS')}`,
    xDentro,
    yPicote + 60,
    {
      tamanho: 26,
      peso: 700,
      cor: tema.textoSecundario,
      fonte: FONTE_MONO,
      larguraMaxima: larguraDentro,
    }
  )
  const larguraCodigo = Math.min(larguraDentro, largura * 0.5)
  if (alturaCanhoto >= 200)
    desenharCodigoBarras(prancheta, capsula.rotulo, xDentro, yPicote + 90, larguraCodigo)
}

function desenharControles(prancheta: Prancheta, centro: number, y: number, raio: number) {
  const { contexto, tema } = prancheta
  contexto.save()
  contexto.fillStyle = tema.destaque
  contexto.beginPath()
  contexto.arc(centro, y, raio, 0, Math.PI * 2)
  contexto.fill()
  contexto.fillStyle = tema.sobreDestaque
  contexto.fillRect(centro - raio * 0.28, y - raio * 0.36, raio * 0.18, raio * 0.72)
  contexto.fillRect(centro + raio * 0.1, y - raio * 0.36, raio * 0.18, raio * 0.72)
  contexto.fillStyle = tema.texto
  for (const direcao of [-1, 1]) {
    const x = centro + direcao * raio * 2.6
    contexto.beginPath()
    contexto.moveTo(x - direcao * raio * 0.4, y - raio * 0.42)
    contexto.lineTo(x + direcao * raio * 0.3, y)
    contexto.lineTo(x - direcao * raio * 0.4, y + raio * 0.42)
    contexto.closePath()
    contexto.fill()
    contexto.fillRect(
      x + direcao * raio * 0.3 - (direcao > 0 ? 0 : raio * 0.12),
      y - raio * 0.42,
      raio * 0.12,
      raio * 0.84
    )
  }
  contexto.restore()
}

function desenharPlayer(prancheta: Prancheta, dados: DadosDesenhoCapsula) {
  const { tema, altura, largura } = prancheta
  const { capsula } = dados
  const musica = capsula.topMusicas[0]
  const fim = limiteInferior(prancheta)
  const util = larguraUtil(prancheta)
  const deitado = paisagem(prancheta)
  let y = altura >= ALTURA_MEDIA ? 140 : 100
  escrever(
    prancheta,
    `${prancheta.estilo.titulo} · ${capsula.rotulo.toUpperCase()}`,
    largura / 2,
    y,
    {
      tamanho: 26,
      peso: 700,
      cor: tema.textoSecundario,
      alinhamento: 'center',
      larguraMaxima: util,
    }
  )
  y += 50
  const capa = Math.round(
    Math.min(deitado ? util * 0.4 : util * 0.86, (fim - y) * (deitado ? 0.95 : 0.46))
  )
  const xCapa = deitado ? MARGEM_IMAGEM : (largura - capa) / 2
  desenharCapa(prancheta, dados.capasMusicas[0] ?? null, xCapa, y, capa, 16)
  if (!musica) return

  const xTexto = deitado ? xCapa + capa + 70 : xCapa
  const larguraTexto = deitado ? largura - xTexto - MARGEM_IMAGEM : capa
  let yTexto = deitado ? y + 70 : y + capa + 80
  escrever(prancheta, musica.nomeFaixa, xTexto, yTexto, {
    tamanho: tamanhoQueCabe(prancheta, musica.nomeFaixa, larguraTexto, 58),
    peso: 800,
    cor: tema.texto,
    larguraMaxima: larguraTexto,
  })
  escrever(prancheta, musica.artistaPrincipal, xTexto, yTexto + 48, {
    tamanho: 32,
    cor: tema.textoSecundario,
    larguraMaxima: larguraTexto,
  })
  yTexto += 100
  retanguloArredondado(prancheta, xTexto, yTexto, larguraTexto, 8, 4, tema.apagado)
  retanguloArredondado(
    prancheta,
    xTexto,
    yTexto,
    larguraTexto * PROGRESSO_PLAYER,
    8,
    4,
    tema.destaque
  )
  const { contexto } = prancheta
  contexto.fillStyle = tema.texto
  contexto.beginPath()
  contexto.arc(xTexto + larguraTexto * PROGRESSO_PLAYER, yTexto + 4, 13, 0, Math.PI * 2)
  contexto.fill()
  escrever(prancheta, plural(musica.totalStreams, 'play', 'plays'), xTexto, yTexto + 46, {
    tamanho: 24,
    cor: tema.textoSecundario,
  })
  escrever(prancheta, formatarMinutos(musica.totalMinutos), xTexto + larguraTexto, yTexto + 46, {
    tamanho: 24,
    cor: tema.textoSecundario,
    alinhamento: 'right',
  })
  yTexto += 120
  if (yTexto + 40 > fim) return
  desenharControles(prancheta, xTexto + larguraTexto / 2, yTexto, 46)
  yTexto += 110
  if (yTexto + 100 > fim) return
  escrever(prancheta, 'A SEGUIR', xTexto, yTexto, {
    tamanho: 26,
    peso: 700,
    cor: tema.destaqueTres,
  })
  desenharFilaMusicas(prancheta, dados, {
    inicio: 1,
    x: xTexto,
    y: yTexto + 30,
    largura: larguraTexto,
    limite: fim,
    capa: 84,
  })
}

export const DESENHOS_MODELOS_EXTRAS: Record<IdModeloExtra, DesenharModelo> = {
  grafico: desenharGrafico,
  numeros: desenharNumeros,
  vinil: desenharVinil,
  revista: desenharRevista,
  ingresso: desenharIngresso,
  player: desenharPlayer,
}
