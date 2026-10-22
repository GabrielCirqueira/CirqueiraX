import type {
  AlcaTransformacao,
  AlteracaoAnotacao,
  Anotacao,
  AnotacaoArraste,
  Ponto,
} from '../types'
import { gerarIdAnotacao } from './fabricaAnotacoes'
import { normalizarRetangulo } from './geometria'

type PropriedadeEditavel = keyof AlteracaoAnotacao

const PROPRIEDADES_POR_TIPO: Record<Anotacao['tipo'], PropriedadeEditavel[]> = {
  retangulo: ['cor', 'espessura', 'raioCanto', 'estiloBorda', 'preenchimento'],
  elipse: ['cor', 'espessura', 'estiloBorda', 'preenchimento'],
  seta: ['cor', 'espessura', 'estiloBorda'],
  linha: ['cor', 'espessura', 'estiloBorda'],
  pincel: ['cor', 'espessura'],
  marcaTexto: ['cor', 'espessura'],
  texto: ['cor', 'tamanhoFonte', 'comFundo'],
  numero: ['cor', 'raio'],
  desfoque: [],
  recorte: [],
}

function deslocarPonto(ponto: Ponto, dx: number, dy: number): Ponto {
  return { x: ponto.x + dx, y: ponto.y + dy }
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
  ponto: Ponto
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

  return {
    ...anotacao,
    inicio: { x: Math.min(esquerda, direita), y: Math.min(topo, base) },
    fim: { x: Math.max(esquerda, direita), y: Math.max(topo, base) },
  }
}

export function redimensionarAnotacao(
  anotacao: Anotacao,
  alca: AlcaTransformacao,
  ponto: Ponto
): Anotacao {
  if (anotacao.tipo !== 'seta' && anotacao.tipo !== 'linha') {
    if (!('inicio' in anotacao)) return anotacao
    return redimensionarCaixa(anotacao, alca, ponto)
  }
  if (alca === 'inicio') return { ...anotacao, inicio: ponto }
  if (alca === 'fim') return { ...anotacao, fim: ponto }
  return anotacao
}

export function alterarAnotacao(anotacao: Anotacao, alteracao: AlteracaoAnotacao): Anotacao {
  const permitidas = propriedadesEditaveis(anotacao)
  const filtrada = Object.fromEntries(
    Object.entries(alteracao).filter(([chave]) => permitidas.includes(chave as PropriedadeEditavel))
  )
  return { ...anotacao, ...filtrada } as Anotacao
}

export function duplicarAnotacao(anotacao: Anotacao, deslocamento: number): Anotacao {
  return { ...deslocarAnotacao(anotacao, deslocamento, deslocamento), id: gerarIdAnotacao() }
}
