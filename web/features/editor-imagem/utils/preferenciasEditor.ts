import type {
  Anotacao,
  EstiloBorda,
  FerramentaComPreferencias,
  FerramentaEditor,
  ImagemEditor,
  NivelEspessura,
  PreferenciasEditor,
  PreferenciasFerramenta,
  TipoPreenchimento,
} from '../types'
import {
  COR_PADRAO,
  ESPESSURA_POR_NIVEL,
  NIVEIS_ESPESSURA,
  RAIO_CANTO_PADRAO,
  TAMANHO_FONTE_PADRAO,
  TAMANHO_RAIO_NUMERO_PADRAO,
} from './constantesEditor'
import { calcularFatorEscala } from './geometria'
import { propriedadesEditaveis } from './transformacaoAnotacoes'

const FERRAMENTAS_COM_PREFERENCIAS: FerramentaEditor[] = [
  'pincel',
  'marcaTexto',
  'seta',
  'linha',
  'retangulo',
  'elipse',
  'texto',
  'numero',
  'desfoque',
]

const ESTILOS_BORDA: EstiloBorda[] = ['solida', 'tracejada']
const TIPOS_PREENCHIMENTO: TipoPreenchimento[] = ['nenhum', 'translucido', 'solido']
const FORMATO_COR_HEXADECIMAL = /^#[0-9a-f]{6}$/i
const FERRAMENTA_DE_REFERENCIA: FerramentaComPreferencias = 'seta'
const TOLERANCIA_NIVEL_ESPESSURA = 0.05
const CASAS_DECIMAIS_PREFERENCIA = 100

export const FERRAMENTAS_PERSISTIVEIS: FerramentaEditor[] = [
  'selecionar',
  ...FERRAMENTAS_COM_PREFERENCIAS,
]

export const PREFERENCIAS_PADRAO: PreferenciasFerramenta = {
  cor: COR_PADRAO,
  espessura: ESPESSURA_POR_NIVEL.media,
  raioCanto: RAIO_CANTO_PADRAO,
  estiloBorda: 'solida',
  preenchimento: 'nenhum',
  tamanhoFonte: TAMANHO_FONTE_PADRAO,
  comFundo: false,
  raio: TAMANHO_RAIO_NUMERO_PADRAO,
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

function sanitizarPreferencias(bruto: unknown): Partial<PreferenciasFerramenta> {
  if (!isPreferenciasEditor(bruto)) return {}
  const valores = bruto as Record<string, unknown>
  const sanitizadas: Partial<PreferenciasFerramenta> = {
    espessura: numeroPositivo(valores.espessura),
    raioCanto: numeroPositivo(valores.raioCanto),
    tamanhoFonte: numeroPositivo(valores.tamanhoFonte),
    raio: numeroPositivo(valores.raio),
  }
  if (typeof valores.cor === 'string' && FORMATO_COR_HEXADECIMAL.test(valores.cor)) {
    sanitizadas.cor = valores.cor
  }
  if (ESTILOS_BORDA.includes(valores.estiloBorda as EstiloBorda)) {
    sanitizadas.estiloBorda = valores.estiloBorda as EstiloBorda
  }
  if (TIPOS_PREENCHIMENTO.includes(valores.preenchimento as TipoPreenchimento)) {
    sanitizadas.preenchimento = valores.preenchimento as TipoPreenchimento
  }
  if (typeof valores.comFundo === 'boolean') sanitizadas.comFundo = valores.comFundo
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
  const extraidas: Partial<PreferenciasFerramenta> = { cor: anotacao.cor }

  for (const propriedade of propriedadesEditaveis(anotacao)) {
    if (propriedade === 'cor') continue
    const valor = (anotacao as unknown as Record<string, unknown>)[propriedade]
    if (typeof valor === 'number') {
      Object.assign(extraidas, { [propriedade]: arredondar(valor / fator) })
      continue
    }
    Object.assign(extraidas, { [propriedade]: valor })
  }

  return extraidas
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
