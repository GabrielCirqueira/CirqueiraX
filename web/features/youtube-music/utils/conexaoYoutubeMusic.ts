import type { EstadoContaYoutubeMusic, StatusYoutubeMusic } from '../types'

export type SituacaoPainelYoutubeMusic = 'desconectado' | 'conectado' | 'reconectar'

const SITUACAO_POR_ESTADO: Record<EstadoContaYoutubeMusic, SituacaoPainelYoutubeMusic> = {
  nao_configurado: 'desconectado',
  desconectada: 'desconectado',
  conectada: 'conectado',
  reconectar: 'reconectar',
}

export const PASSOS_OBTER_CABECALHOS = [
  'Abra uma janela anônima (no Firefox, janela privada) e entre em music.youtube.com com a sua conta Google.',
  'Abra as ferramentas do desenvolvedor (F12) na aba Rede e filtre por "browse".',
  'Clique em qualquer página do YouTube Music, como a Biblioteca, para aparecer uma requisição "browse".',
  'No Firefox: botão direito na requisição → Copiar valor → Copiar cabeçalhos da requisição. No Chrome: botão direito → Copiar → Copiar como cURL (bash).',
  'Cole tudo no campo abaixo. Depois feche a janela anônima sem clicar em Sair.',
]

export const AVISO_CABECALHOS =
  'Isto dá acesso à sua conta Google. Fica criptografado no servidor e não aparece de novo. Sair da conta no navegador invalida.'

export const NOTA_MARGEM_HORARIO =
  'O YouTube Music não informa o horário exato de cada música. O horário registrado tem uma margem de alguns minutos e os minutos ouvidos são estimados pela duração.'

export function situacaoPainelYoutubeMusic(
  status: StatusYoutubeMusic | undefined
): SituacaoPainelYoutubeMusic {
  if (!status) return 'desconectado'
  return SITUACAO_POR_ESTADO[status.status]
}

const MINUTO_MS = 60_000
const HORA_MS = 3_600_000
const DIA_MS = 86_400_000

export function descreverDeteccaoAproximada(dataIso: string | null, agora: number): string {
  if (!dataIso) return ''
  const diferenca = Math.max(0, agora - new Date(dataIso).getTime())
  if (diferenca < HORA_MS)
    return `há cerca de ${Math.max(1, Math.round(diferenca / MINUTO_MS))} min`
  if (diferenca < DIA_MS) return `há cerca de ${Math.round(diferenca / HORA_MS)} h`
  const dias = Math.round(diferenca / DIA_MS)
  return dias === 1 ? 'há cerca de 1 dia' : `há cerca de ${dias} dias`
}
