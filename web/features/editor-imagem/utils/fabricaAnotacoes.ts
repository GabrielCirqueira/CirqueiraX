import type {
  AnotacaoArraste,
  AnotacaoNumero,
  AnotacaoTexto,
  AnotacaoTraco,
  EstiloAnotacao,
  FerramentaDeArraste,
  FerramentaDeTraco,
  FerramentaEditor,
  ImagemEditor,
  Ponto,
} from '../types'
import {
  ESPESSURA_POR_NIVEL,
  MULTIPLICADOR_FONTE,
  MULTIPLICADOR_RAIO_NUMERO,
  RAIO_MINIMO_NUMERO,
  TAMANHO_MINIMO_ARRASTE,
  TAMANHO_MINIMO_FONTE,
} from './constantesEditor'
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

export function calcularEspessura(imagem: ImagemEditor, estilo: EstiloAnotacao): number {
  return ESPESSURA_POR_NIVEL[estilo.nivelEspessura] * calcularFatorEscala(imagem)
}

export function calcularTamanhoFonte(imagem: ImagemEditor, estilo: EstiloAnotacao): number {
  return Math.max(
    TAMANHO_MINIMO_FONTE * calcularFatorEscala(imagem),
    calcularEspessura(imagem, estilo) * MULTIPLICADOR_FONTE
  )
}

export function criarTraco(
  ferramenta: FerramentaDeTraco,
  ponto: Ponto,
  imagem: ImagemEditor,
  estilo: EstiloAnotacao
): AnotacaoTraco {
  return {
    id: gerarIdAnotacao(),
    tipo: ferramenta,
    cor: estilo.cor,
    espessura: calcularEspessura(imagem, estilo),
    pontos: [ponto],
  }
}

export function criarArraste(
  ferramenta: FerramentaDeArraste,
  ponto: Ponto,
  imagem: ImagemEditor,
  estilo: EstiloAnotacao
): AnotacaoArraste {
  return {
    id: gerarIdAnotacao(),
    tipo: ferramenta,
    cor: estilo.cor,
    espessura: calcularEspessura(imagem, estilo),
    inicio: ponto,
    fim: ponto,
  }
}

export function criarTexto(
  texto: string,
  posicao: Ponto,
  imagem: ImagemEditor,
  estilo: EstiloAnotacao
): AnotacaoTexto {
  return {
    id: gerarIdAnotacao(),
    tipo: 'texto',
    cor: estilo.cor,
    espessura: calcularEspessura(imagem, estilo),
    posicao,
    texto,
    tamanhoFonte: calcularTamanhoFonte(imagem, estilo),
  }
}

export function criarNumero(
  numero: number,
  posicao: Ponto,
  imagem: ImagemEditor,
  estilo: EstiloAnotacao
): AnotacaoNumero {
  const espessura = calcularEspessura(imagem, estilo)
  return {
    id: gerarIdAnotacao(),
    tipo: 'numero',
    cor: estilo.cor,
    espessura,
    posicao,
    numero,
    raio: Math.max(
      RAIO_MINIMO_NUMERO * calcularFatorEscala(imagem),
      espessura * MULTIPLICADOR_RAIO_NUMERO
    ),
  }
}

export function isArrasteSignificativo(anotacao: AnotacaoArraste): boolean {
  return distanciaEntre(anotacao.inicio, anotacao.fim) >= TAMANHO_MINIMO_ARRASTE
}
