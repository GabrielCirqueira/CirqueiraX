import { api } from '@/config/api'

const HOSTS_SERVIDOS_PELO_SISTEMA =
  /^(yt3\.googleusercontent\.com|lh3\.googleusercontent\.com|yt3\.ggpht\.com|i\.ytimg\.com)$/
const ROTA_CAPA = '/api/v1/musica/capa'

export function urlCapaExibicao(url: string | null | undefined): string | null {
  if (!url) return null

  try {
    const endereco = new URL(url)
    if (endereco.protocol !== 'https:' || !HOSTS_SERVIDOS_PELO_SISTEMA.test(endereco.hostname))
      return url
  } catch {
    return url
  }

  return `${api.defaults.baseURL ?? ''}${ROTA_CAPA}?url=${encodeURIComponent(url)}`
}
