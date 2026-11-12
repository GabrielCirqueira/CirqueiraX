const DESTINO_PADRAO = '/dashboard'
const ROTA_LOGIN = '/login'

export function destinoAposLogin(estado: unknown): string {
  if (typeof estado !== 'object' || estado === null || !('voltarPara' in estado)) {
    return DESTINO_PADRAO
  }

  const destino = estado.voltarPara
  if (
    typeof destino !== 'string' ||
    !destino.startsWith('/') ||
    destino.startsWith('//') ||
    destino.startsWith(ROTA_LOGIN)
  ) {
    return DESTINO_PADRAO
  }

  return destino
}
