import {
  FUNCIONALIDADES_SISTEMA,
  ROTULOS_FUNCIONALIDADE,
  type FuncionalidadeSistema,
} from '@/shared/utils/funcionalidadesSistema'
import type { FuncionalidadeOpcao } from '../types'

export function catalogoFuncionalidadesSistema(): FuncionalidadeOpcao[] {
  return FUNCIONALIDADES_SISTEMA.map((codigo: FuncionalidadeSistema) => ({
    codigo,
    descricao: ROTULOS_FUNCIONALIDADE[codigo],
  }))
}
