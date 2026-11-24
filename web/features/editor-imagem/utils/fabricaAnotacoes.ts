import type {
  AnotacaoArraste,
  AnotacaoNumero,
  AnotacaoTexto,
  AnotacaoTraco,
  FerramentaDeArraste,
  FerramentaDeTraco,
  FerramentaEditor,
  FerramentaForma,
  FormatoTexto,
  ImagemEditor,
  Ponto,
  PreferenciasFerramenta,
} from '../types'
import { FERRAMENTAS_FORMA, TAMANHO_MINIMO_ARRASTE } from './constantesEditor'
import { calcularFatorEscala, distanciaEntre } from './geometria'

const FERRAMENTAS_DE_TRACO: FerramentaEditor[] = ['pincel', 'marcaTexto']
const FERRAMENTAS_DE_ARRASTE: FerramentaEditor[] = [
  'seta',
  'linha',
  ...FERRAMENTAS_FORMA,
  'desfoque',
  'recorte',
]

export function isFerramentaDeTraco(ferramenta: FerramentaEditor): ferramenta is FerramentaDeTraco {
  return FERRAMENTAS_DE_TRACO.includes(ferramenta)
}

export function isFerramentaDeArraste(
  ferramenta: FerramentaEditor
): ferramenta is FerramentaDeArraste {
  return FERRAMENTAS_DE_ARRASTE.includes(ferramenta)
}

export function isFerramentaForma(ferramenta: string): ferramenta is FerramentaForma {
  return FERRAMENTAS_FORMA.includes(ferramenta as FerramentaForma)
}

export function gerarIdAnotacao(): string {
  return crypto.randomUUID()
}

function escalar(imagem: ImagemEditor, valorRelativo: number): number {
  return valorRelativo * calcularFatorEscala(imagem)
}

function propriedadesComuns(preferencias: PreferenciasFerramenta) {
  return {
    id: gerarIdAnotacao(),
    cor: preferencias.cor,
    opacidade: preferencias.opacidade,
    sombra: preferencias.sombra,
  }
}

export function formatoDoTexto(preferencias: FormatoTexto): FormatoTexto {
  return {
    fonte: preferencias.fonte,
    negrito: preferencias.negrito,
    italico: preferencias.italico,
    alinhamento: preferencias.alinhamento,
  }
}

export function criarTraco(
  ferramenta: FerramentaDeTraco,
  ponto: Ponto,
  imagem: ImagemEditor,
  preferencias: PreferenciasFerramenta
): AnotacaoTraco {
  return {
    ...propriedadesComuns(preferencias),
    tipo: ferramenta,
    espessura: escalar(imagem, Math.max(1, preferencias.espessura)),
    pontos: [ponto],
  }
}

export function criarArraste(
  ferramenta: FerramentaDeArraste,
  ponto: Ponto,
  imagem: ImagemEditor,
  preferencias: PreferenciasFerramenta
): AnotacaoArraste {
  const espessura = isFerramentaForma(ferramenta)
    ? preferencias.espessura
    : Math.max(1, preferencias.espessura)
  return {
    ...propriedadesComuns(preferencias),
    tipo: ferramenta,
    espessura: escalar(imagem, espessura),
    inicio: ponto,
    fim: ponto,
    raioCanto: escalar(imagem, preferencias.raioCanto),
    estiloBorda: preferencias.estiloBorda,
    preenchimento: preferencias.preenchimento,
    corPreenchimento: preferencias.corPreenchimento,
  }
}

export function calcularTamanhoFonte(
  imagem: ImagemEditor,
  preferencias: PreferenciasFerramenta
): number {
  return escalar(imagem, preferencias.tamanhoFonte)
}

export function criarTexto(
  texto: string,
  posicao: Ponto,
  imagem: ImagemEditor,
  preferencias: PreferenciasFerramenta
): AnotacaoTexto {
  return {
    ...propriedadesComuns(preferencias),
    ...formatoDoTexto(preferencias),
    tipo: 'texto',
    espessura: escalar(imagem, preferencias.espessura),
    posicao,
    texto,
    tamanhoFonte: calcularTamanhoFonte(imagem, preferencias),
    estiloTexto: preferencias.estiloTexto,
  }
}

export function criarNumero(
  numero: number,
  posicao: Ponto,
  imagem: ImagemEditor,
  preferencias: PreferenciasFerramenta
): AnotacaoNumero {
  return {
    ...propriedadesComuns(preferencias),
    tipo: 'numero',
    espessura: escalar(imagem, preferencias.espessura),
    posicao,
    numero,
    raio: escalar(imagem, preferencias.raio),
  }
}

export function isArrasteSignificativo(anotacao: AnotacaoArraste): boolean {
  return distanciaEntre(anotacao.inicio, anotacao.fim) >= TAMANHO_MINIMO_ARRASTE
}
