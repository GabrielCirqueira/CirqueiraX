import type {
  AlcaTransformacao,
  AlteracaoAnotacao,
  Anotacao,
  AnotacaoArraste,
  Ponto,
  PropriedadeEditavel,
} from '../types'
import { LIMITES_PROPRIEDADE } from './constantesEditor'
import { medirCaixaTexto } from './desenhoCanvas'
import { gerarIdAnotacao } from './fabricaAnotacoes'
import { distanciaEntre, normalizarRetangulo } from './geometria'

const EFEITOS: PropriedadeEditavel[] = ['opacidade', 'sombra']
const BORDA: PropriedadeEditavel[] = ['cor', 'espessura', 'estiloBorda']
const PREENCHIMENTO: PropriedadeEditavel[] = ['preenchimento', 'corPreenchimento']
const FORMA: PropriedadeEditavel[] = [...BORDA, ...PREENCHIMENTO, ...EFEITOS]
const TEXTO: PropriedadeEditavel[] = [
  'cor',
  'tamanhoFonte',
  'fonte',
  'negrito',
  'italico',
  'alinhamento',
  'estiloTexto',
  ...EFEITOS,
]
const RAZAO_RAIO_PELA_DIAGONAL = Math.SQRT2
const TAMANHO_MINIMO_REDIMENSIONADO = 2

export const PROPRIEDADES_ESCALAVEIS: PropriedadeEditavel[] = [
  'espessura',
  'raioCanto',
  'tamanhoFonte',
  'raio',
]

const PROPRIEDADES_POR_TIPO: Record<Anotacao['tipo'], PropriedadeEditavel[]> = {
  retangulo: [...FORMA, 'raioCanto'],
  balao: [...FORMA, 'raioCanto'],
  elipse: FORMA,
  triangulo: FORMA,
  losango: FORMA,
  estrela: FORMA,
  hexagono: FORMA,
  seta: [...BORDA, ...EFEITOS],
  linha: [...BORDA, ...EFEITOS],
  pincel: ['cor', 'espessura', ...EFEITOS],
  marcaTexto: ['cor', 'espessura', 'opacidade'],
  texto: TEXTO,
  numero: ['cor', 'raio', ...EFEITOS],
  desfoque: [],
  recorte: [],
}

function deslocarPonto(ponto: Ponto, dx: number, dy: number): Ponto {
  return { x: ponto.x + dx, y: ponto.y + dy }
}

export function propriedadesDoTipo(tipo: Anotacao['tipo']): PropriedadeEditavel[] {
  return PROPRIEDADES_POR_TIPO[tipo]
}

export function propriedadesEditaveis(anotacao: Anotacao): PropriedadeEditavel[] {
  return PROPRIEDADES_POR_TIPO[anotacao.tipo]
}

export function isPropriedadeEditavel(anotacao: Anotacao, propriedade: PropriedadeEditavel) {
  return propriedadesEditaveis(anotacao).includes(propriedade)
}

export function deslocarAnotacao(anotacao: Anotacao, dx: number, dy: number): Anotacao {
  switch (anotacao.tipo) {
    case 'pincel':
    case 'marcaTexto':
      return { ...anotacao, pontos: anotacao.pontos.map((ponto) => deslocarPonto(ponto, dx, dy)) }
    case 'texto':
    case 'numero':
      return { ...anotacao, posicao: deslocarPonto(anotacao.posicao, dx, dy) }
    default:
      return {
        ...anotacao,
        inicio: deslocarPonto(anotacao.inicio, dx, dy),
        fim: deslocarPonto(anotacao.fim, dx, dy),
      }
  }
}

function redimensionarCaixa(
  anotacao: AnotacaoArraste,
  alca: AlcaTransformacao,
  ponto: Ponto,
  manterProporcao: boolean
): AnotacaoArraste {
  const area = normalizarRetangulo(anotacao.inicio, anotacao.fim)
  let esquerda = area.x
  let direita = area.x + area.largura
  let topo = area.y
  let base = area.y + area.altura

  if (alca.includes('w')) esquerda = ponto.x
  if (alca.includes('e')) direita = ponto.x
  if (alca.includes('n')) topo = ponto.y
  if (alca.includes('s')) base = ponto.y

  const isCanto = alca.length === 2
  if (manterProporcao && isCanto && area.largura > 0 && area.altura > 0) {
    const proporcao = area.largura / area.altura
    const novaAltura = Math.abs(base - topo)
    const novaLargura = novaAltura * proporcao
    if (alca.includes('w')) esquerda = direita - novaLargura * Math.sign(direita - esquerda || 1)
    else direita = esquerda + novaLargura * Math.sign(direita - esquerda || 1)
  }

  return {
    ...anotacao,
    inicio: { x: Math.min(esquerda, direita), y: Math.min(topo, base) },
    fim: { x: Math.max(esquerda, direita), y: Math.max(topo, base) },
  }
}

export function redimensionarAnotacao(
  anotacao: Anotacao,
  alca: AlcaTransformacao,
  ponto: Ponto,
  manterProporcao = false
): Anotacao {
  if (anotacao.tipo === 'texto') {
    const caixa = medirCaixaTexto(anotacao)
    const novaAltura = Math.max(TAMANHO_MINIMO_REDIMENSIONADO, ponto.y - caixa.y)
    const tamanhoFonte = (anotacao.tamanhoFonte * novaAltura) / Math.max(1, caixa.altura)
    return {
      ...anotacao,
      tamanhoFonte: Math.max(LIMITES_PROPRIEDADE.tamanhoFonte.minimo, tamanhoFonte),
    }
  }
  if (anotacao.tipo === 'numero') {
    const raio = distanciaEntre(anotacao.posicao, ponto) / RAZAO_RAIO_PELA_DIAGONAL
    return { ...anotacao, raio: Math.max(LIMITES_PROPRIEDADE.raio.minimo, raio) }
  }
  if (!('inicio' in anotacao)) return anotacao
  if (anotacao.tipo === 'seta' || anotacao.tipo === 'linha') {
    if (alca === 'inicio') return { ...anotacao, inicio: ponto }
    if (alca === 'fim') return { ...anotacao, fim: ponto }
    return anotacao
  }
  return redimensionarCaixa(anotacao, alca, ponto, manterProporcao)
}

export function alterarAnotacao(anotacao: Anotacao, alteracao: AlteracaoAnotacao): Anotacao {
  const permitidas = propriedadesEditaveis(anotacao)
  const filtrada = Object.fromEntries(
    Object.entries(alteracao).filter(([chave]) => permitidas.includes(chave as PropriedadeEditavel))
  )
  return { ...anotacao, ...filtrada } as Anotacao
}

export function escalarAlteracao(alteracao: AlteracaoAnotacao, fator: number): AlteracaoAnotacao {
  return Object.fromEntries(
    Object.entries(alteracao).map(([chave, valor]) =>
      PROPRIEDADES_ESCALAVEIS.includes(chave as PropriedadeEditavel) && typeof valor === 'number'
        ? [chave, valor * fator]
        : [chave, valor]
    )
  ) as AlteracaoAnotacao
}

export function duplicarAnotacao(anotacao: Anotacao, deslocamento: number): Anotacao {
  return { ...deslocarAnotacao(anotacao, deslocamento, deslocamento), id: gerarIdAnotacao() }
}
