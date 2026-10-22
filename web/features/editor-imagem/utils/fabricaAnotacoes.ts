import type {
  AnotacaoArraste,
  AnotacaoNumero,
  AnotacaoTexto,
  AnotacaoTraco,
  FerramentaDeArraste,
  FerramentaDeTraco,
  FerramentaEditor,
  ImagemEditor,
  Ponto,
  PreferenciasFerramenta,
} from '../types'
import { TAMANHO_MINIMO_ARRASTE } from './constantesEditor'
import { calcularFatorEscala, distanciaEntre } from './geometria'

const FERRAMENTAS_DE_TRACO: FerramentaEditor[] = ['pincel', 'marcaTexto']
const FERRAMENTAS_DE_ARRASTE: FerramentaEditor[] = [
  'seta',
  'linha',
  'retangulo',
  'elipse',
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

export function gerarIdAnotacao(): string {
  return crypto.randomUUID()
}

function escalar(imagem: ImagemEditor, valorRelativo: number): number {
  return valorRelativo * calcularFatorEscala(imagem)
}

export function criarTraco(
  ferramenta: FerramentaDeTraco,
  ponto: Ponto,
  imagem: ImagemEditor,
  preferencias: PreferenciasFerramenta
): AnotacaoTraco {
  return {
    id: gerarIdAnotacao(),
    tipo: ferramenta,
    cor: preferencias.cor,
    espessura: escalar(imagem, preferencias.espessura),
    pontos: [ponto],
  }
}

export function criarArraste(
  ferramenta: FerramentaDeArraste,
  ponto: Ponto,
  imagem: ImagemEditor,
  preferencias: PreferenciasFerramenta
): AnotacaoArraste {
  return {
    id: gerarIdAnotacao(),
    tipo: ferramenta,
    cor: preferencias.cor,
    espessura: escalar(imagem, preferencias.espessura),
    inicio: ponto,
    fim: ponto,
    raioCanto: escalar(imagem, preferencias.raioCanto),
    estiloBorda: preferencias.estiloBorda,
    preenchimento: preferencias.preenchimento,
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
    id: gerarIdAnotacao(),
    tipo: 'texto',
    cor: preferencias.cor,
    espessura: escalar(imagem, preferencias.espessura),
    posicao,
    texto,
    tamanhoFonte: calcularTamanhoFonte(imagem, preferencias),
    comFundo: preferencias.comFundo,
  }
}

export function criarNumero(
  numero: number,
  posicao: Ponto,
  imagem: ImagemEditor,
  preferencias: PreferenciasFerramenta
): AnotacaoNumero {
  return {
    id: gerarIdAnotacao(),
    tipo: 'numero',
    cor: preferencias.cor,
    espessura: escalar(imagem, preferencias.espessura),
    posicao,
    numero,
    raio: escalar(imagem, preferencias.raio),
  }
}

export function isArrasteSignificativo(anotacao: AnotacaoArraste): boolean {
  return distanciaEntre(anotacao.inicio, anotacao.fim) >= TAMANHO_MINIMO_ARRASTE
}
