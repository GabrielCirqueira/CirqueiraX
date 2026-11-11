import type { EstadoContaYoutubeMusic, StatusYoutubeMusic } from '../types'

export type SituacaoPainelYoutubeMusic = 'desconectado' | 'conectado' | 'reconectar'

const SITUACAO_POR_ESTADO: Record<EstadoContaYoutubeMusic, SituacaoPainelYoutubeMusic> = {
  nao_configurado: 'desconectado',
  desconectada: 'desconectado',
  conectada: 'conectado',
  reconectar: 'reconectar',
}

export const PASSOS_OBTER_CABECALHOS = [
  'Abra uma janela anônima e entre em music.youtube.com com a sua conta Google.',
  'Abra as ferramentas do desenvolvedor (F12) na aba Rede e filtre por "browse".',
  'Clique em qualquer página do YouTube Music, escolha uma requisição "browse" e copie os cabeçalhos da requisição.',
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
