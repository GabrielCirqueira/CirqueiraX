import type { Usuario } from '@/shared/types'
import {
  funcionalidadeDaRota,
  primeiraRotaPermitida,
  usuarioPossuiPermissao,
} from '@/shared/utils/funcionalidadesSistema'

const ROTA_LOGIN = '/login'

export function destinoAposLogin(estado: unknown, usuario?: Usuario | null): string {
  const fallback = primeiraRotaPermitida(usuario)

  if (typeof estado !== 'object' || estado === null || !('voltarPara' in estado)) {
    return fallback
  }

  const destino = estado.voltarPara
  if (
    typeof destino !== 'string' ||
    !destino.startsWith('/') ||
    destino.startsWith('//') ||
    destino.startsWith(ROTA_LOGIN)
  ) {
    return fallback
  }

  if (!usuario) return destino

  const funcionalidade = funcionalidadeDaRota(destino)
  if (funcionalidade && !usuarioPossuiPermissao(usuario, funcionalidade)) {
    return fallback
  }

  return destino
}
