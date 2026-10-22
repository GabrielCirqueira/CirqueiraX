import type { Anotacao, ImagemEditor } from '../types'
import { LIMITES_PROPRIEDADE } from './constantesEditor'
import { calcularFatorEscala, normalizarRetangulo } from './geometria'
import { isPropriedadeEditavel } from './transformacaoAnotacoes'

export type PropriedadeDeslizante = 'espessura' | 'raioCanto' | 'tamanhoFonte' | 'raio'

export interface ConfiguracaoDeslizante {
  propriedade: PropriedadeDeslizante
  rotulo: string
  minimo: number
  maximo: number
  valor: number
}

export const ROTULO_TIPO_ANOTACAO: Record<Anotacao['tipo'], string> = {
  seta: 'Seta',
  linha: 'Linha',
  retangulo: 'Retângulo',
  elipse: 'Círculo',
  pincel: 'Pincel',
  marcaTexto: 'Marca-texto',
  texto: 'Texto',
  numero: 'Marcador',
  desfoque: 'Área pixelada',
  recorte: 'Recorte',
}

function rotuloDaEspessura(anotacao: Anotacao): string {
  return anotacao.tipo === 'retangulo' || anotacao.tipo === 'elipse' ? 'Borda' : 'Espessura'
}

function limitar(valor: number, minimo: number, maximo: number): number {
  return Math.min(Math.max(valor, minimo), maximo)
}

function deslizante(
  propriedade: PropriedadeDeslizante,
  rotulo: string,
  minimo: number,
  maximo: number,
  valor: number
): ConfiguracaoDeslizante {
  const maximoSeguro = Math.max(maximo, minimo + 1)
  return {
    propriedade,
    rotulo,
    minimo: Math.round(minimo),
    maximo: Math.round(maximoSeguro),
    valor: Math.round(limitar(valor, minimo, maximoSeguro)),
  }
}

export function montarDeslizantes(
  anotacao: Anotacao,
  imagem: ImagemEditor
): ConfiguracaoDeslizante[] {
  const fator = calcularFatorEscala(imagem)
  const deslizantes: ConfiguracaoDeslizante[] = []

  if (isPropriedadeEditavel(anotacao, 'espessura')) {
    const { minimo, maximo } = LIMITES_PROPRIEDADE.espessura
    deslizantes.push(
      deslizante(
        'espessura',
        rotuloDaEspessura(anotacao),
        minimo,
        maximo * fator,
        anotacao.espessura
      )
    )
  }

  if (anotacao.tipo === 'retangulo') {
    const area = normalizarRetangulo(anotacao.inicio, anotacao.fim)
    const maximo = Math.min(area.largura, area.altura) / 2
    deslizantes.push(deslizante('raioCanto', 'Arredondamento', 0, maximo, anotacao.raioCanto))
  }

  if (anotacao.tipo === 'texto') {
    const { minimo, maximo } = LIMITES_PROPRIEDADE.tamanhoFonte
    deslizantes.push(
      deslizante('tamanhoFonte', 'Tamanho', minimo * fator, maximo * fator, anotacao.tamanhoFonte)
    )
  }

  if (anotacao.tipo === 'numero') {
    const { minimo, maximo } = LIMITES_PROPRIEDADE.raio
    deslizantes.push(deslizante('raio', 'Tamanho', minimo * fator, maximo * fator, anotacao.raio))
  }

  return deslizantes
}
