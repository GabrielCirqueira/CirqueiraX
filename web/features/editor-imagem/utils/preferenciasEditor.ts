import type {
  AlinhamentoTexto,
  Anotacao,
  EstiloBorda,
  EstiloTexto,
  FerramentaComPreferencias,
  FerramentaEditor,
  FonteTexto,
  ImagemEditor,
  NivelEspessura,
  PreferenciasEditor,
  PreferenciasFerramenta,
  TipoPreenchimento,
} from '../types'
import {
  COR_PADRAO,
  ESPESSURA_POR_NIVEL,
  FERRAMENTAS_FORMA,
  FONTE_PADRAO,
  NIVEIS_ESPESSURA,
  OPACIDADE_PADRAO,
  OPCOES_FONTE,
  RAIO_CANTO_PADRAO,
  TAMANHO_FONTE_PADRAO,
  TAMANHO_RAIO_NUMERO_PADRAO,
} from './constantesEditor'
import { calcularFatorEscala } from './geometria'
import { PROPRIEDADES_ESCALAVEIS, propriedadesEditaveis } from './transformacaoAnotacoes'

const FERRAMENTAS_COM_PREFERENCIAS: FerramentaEditor[] = [
  'pincel',
  'marcaTexto',
  'seta',
  'linha',
  ...FERRAMENTAS_FORMA,
  'texto',
  'numero',
  'desfoque',
]

const ESTILOS_BORDA: EstiloBorda[] = ['solida', 'tracejada', 'pontilhada']
const TIPOS_PREENCHIMENTO: TipoPreenchimento[] = ['nenhum', 'translucido', 'solido']
const ESTILOS_TEXTO: EstiloTexto[] = ['simples', 'contorno', 'etiqueta']
const ALINHAMENTOS: AlinhamentoTexto[] = ['esquerda', 'centro', 'direita']
const FONTES: FonteTexto[] = OPCOES_FONTE.map((opcao) => opcao.valor)
const FORMATO_COR_HEXADECIMAL = /^#[0-9a-f]{6}$/i
const FERRAMENTA_DE_REFERENCIA: FerramentaComPreferencias = 'seta'
const TOLERANCIA_NIVEL_ESPESSURA = 0.05
const CASAS_DECIMAIS_PREFERENCIA = 100
const CAMPOS_NUMERICOS = ['espessura', 'raioCanto', 'tamanhoFonte', 'raio', 'opacidade'] as const
const CAMPOS_BOOLEANOS = ['negrito', 'italico', 'sombra'] as const
const CAMPOS_COR = ['cor', 'corPreenchimento'] as const

export const FERRAMENTAS_PERSISTIVEIS: FerramentaEditor[] = [
  'selecionar',
  ...FERRAMENTAS_COM_PREFERENCIAS,
]

export const PREFERENCIAS_PADRAO: PreferenciasFerramenta = {
  cor: COR_PADRAO,
  corPreenchimento: COR_PADRAO,
  espessura: ESPESSURA_POR_NIVEL.media,
  raioCanto: RAIO_CANTO_PADRAO,
  estiloBorda: 'solida',
  preenchimento: 'nenhum',
  tamanhoFonte: TAMANHO_FONTE_PADRAO,
  estiloTexto: 'contorno',
  fonte: FONTE_PADRAO,
  negrito: true,
  italico: false,
  alinhamento: 'esquerda',
  raio: TAMANHO_RAIO_NUMERO_PADRAO,
  opacidade: OPACIDADE_PADRAO,
  sombra: false,
}

export function isFerramentaComPreferencias(
  ferramenta: FerramentaEditor | Anotacao['tipo']
): ferramenta is FerramentaComPreferencias {
  return FERRAMENTAS_COM_PREFERENCIAS.includes(ferramenta as FerramentaEditor)
}

export function ferramentaDeReferencia(ferramenta: FerramentaEditor): FerramentaComPreferencias {
  return isFerramentaComPreferencias(ferramenta) ? ferramenta : FERRAMENTA_DE_REFERENCIA
}

export function isPreferenciasEditor(valor: unknown): valor is PreferenciasEditor {
  return typeof valor === 'object' && valor !== null && !Array.isArray(valor)
}

function numeroPositivo(valor: unknown): number | undefined {
  return typeof valor === 'number' && Number.isFinite(valor) && valor >= 0 ? valor : undefined
}

function valorDaLista<T>(lista: readonly T[], valor: unknown): T | undefined {
  return lista.includes(valor as T) ? (valor as T) : undefined
}

function sanitizarPreferencias(bruto: unknown): Partial<PreferenciasFerramenta> {
  if (!isPreferenciasEditor(bruto)) return {}
  const valores = bruto as Record<string, unknown>
  const sanitizadas: Record<string, unknown> = {
    estiloBorda: valorDaLista(ESTILOS_BORDA, valores.estiloBorda),
    preenchimento: valorDaLista(TIPOS_PREENCHIMENTO, valores.preenchimento),
    estiloTexto: valorDaLista(ESTILOS_TEXTO, valores.estiloTexto),
    alinhamento: valorDaLista(ALINHAMENTOS, valores.alinhamento),
    fonte: valorDaLista(FONTES, valores.fonte),
  }
  for (const campo of CAMPOS_NUMERICOS) sanitizadas[campo] = numeroPositivo(valores[campo])
  for (const campo of CAMPOS_BOOLEANOS) {
    if (typeof valores[campo] === 'boolean') sanitizadas[campo] = valores[campo]
  }
  for (const campo of CAMPOS_COR) {
    const cor = valores[campo]
    if (typeof cor === 'string' && FORMATO_COR_HEXADECIMAL.test(cor)) sanitizadas[campo] = cor
  }
  return Object.fromEntries(
    Object.entries(sanitizadas).filter(([, valor]) => valor !== undefined)
  ) as Partial<PreferenciasFerramenta>
}

export function resolverPreferencias(
  preferencias: PreferenciasEditor,
  ferramenta: FerramentaEditor
): PreferenciasFerramenta {
  const salvas = sanitizarPreferencias(preferencias[ferramentaDeReferencia(ferramenta)])
  return { ...PREFERENCIAS_PADRAO, ...salvas }
}

function arredondar(valor: number): number {
  return Math.round(valor * CASAS_DECIMAIS_PREFERENCIA) / CASAS_DECIMAIS_PREFERENCIA
}

export function extrairPreferencias(
  anotacao: Anotacao,
  imagem: ImagemEditor
): Partial<PreferenciasFerramenta> {
  const fator = calcularFatorEscala(imagem)
  const extraidas: Record<string, unknown> = { cor: anotacao.cor }

  for (const propriedade of propriedadesEditaveis(anotacao)) {
    const valor = (anotacao as unknown as Record<string, unknown>)[propriedade]
    if (valor === undefined) continue
    extraidas[propriedade] =
      typeof valor === 'number' && PROPRIEDADES_ESCALAVEIS.includes(propriedade)
        ? arredondar(valor / fator)
        : valor
  }

  return extraidas as Partial<PreferenciasFerramenta>
}

export function valoresDaAnotacao(
  anotacao: Anotacao,
  imagem: ImagemEditor
): PreferenciasFerramenta {
  return { ...PREFERENCIAS_PADRAO, ...extrairPreferencias(anotacao, imagem) }
}

export function mesclarPreferencias(
  preferencias: PreferenciasEditor,
  ferramenta: FerramentaComPreferencias,
  alteracao: Partial<PreferenciasFerramenta>
): PreferenciasEditor {
  return {
    ...preferencias,
    [ferramenta]: { ...sanitizarPreferencias(preferencias[ferramenta]), ...alteracao },
  }
}

export function nivelDaEspessura(espessuraRelativa: number): NivelEspessura | null {
  return (
    NIVEIS_ESPESSURA.find(
      (nivel) =>
        Math.abs(ESPESSURA_POR_NIVEL[nivel] - espessuraRelativa) < TOLERANCIA_NIVEL_ESPESSURA
    ) ?? null
  )
}
