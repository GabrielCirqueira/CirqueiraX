import {
  FUNCIONALIDADES_SISTEMA,
  type FuncionalidadeSistema,
  ROTULOS_FUNCIONALIDADE,
} from '@/shared/utils/funcionalidadesSistema'
import type { FuncionalidadeOpcao } from '../types'

export function catalogoFuncionalidadesSistema(): FuncionalidadeOpcao[] {
  return FUNCIONALIDADES_SISTEMA.map((codigo: FuncionalidadeSistema) => ({
    codigo,
    descricao: ROTULOS_FUNCIONALIDADE[codigo],
  }))
}
