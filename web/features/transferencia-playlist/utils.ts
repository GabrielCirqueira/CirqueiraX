import axios from 'axios'
import type {
  DecisaoPlaylistDestino,
  ItemConfirmacaoPrevia,
  ItemTransferencia,
  ParPlaylist,
  PlaylistInicio,
  PlaylistResumo,
  ServicoPlaylist,
  StatusTransferencia,
  TransferenciaDetalhe,
} from './types'

export const CHAVE_RETORNO_YOUTUBE_OAUTH = 'cirqueirax_youtube_oauth_retorno'
export const ROTA_RETORNO_GERENCIAR = '/musica/gerenciar'

export function extrairMensagemErroApi(erro: unknown, padrao: string): string {
  if (axios.isAxiosError(erro)) {
    const corpo = erro.response?.data as { error?: string; message?: string } | undefined
    return corpo?.error || corpo?.message || padrao
  }
  return padrao
}

export function labelServico(servico: ServicoPlaylist): string {
  return servico === 'spotify' ? 'Spotify' : 'YouTube Music'
}

export function rotuloDirecao(
  origem: ServicoPlaylist | null,
  destino: ServicoPlaylist | null
): string {
  if (!origem || !destino) {
    return 'origem → destino'
  }
  return `${labelServico(origem)} → ${labelServico(destino)}`
}

export function formatarDecisao(
  decisao: DecisaoPlaylistDestino,
  origem?: ServicoPlaylist | null,
  destino?: ServicoPlaylist | null
): string {
  const de = origem ? labelServico(origem) : 'origem'
  const para = destino ? labelServico(destino) : 'destino'

  switch (decisao) {
    case 'criar_nova':
      return `Criar nova no ${para}`
    case 'atualizar_origem_para_destino':
      return `Espelhar ${de} → ${para}`
    case 'atualizar_destino_para_origem':
      return `Espelhar ${para} → ${de}`
    case 'so_vincular':
      return 'Só vincular (sem mudar faixas)'
  }
}

export function descreverDecisao(
  decisao: DecisaoPlaylistDestino,
  origem?: ServicoPlaylist | null,
  destino?: ServicoPlaylist | null,
  nomePar?: string | null
): string {
  const de = origem ? labelServico(origem) : 'origem'
  const para = destino ? labelServico(destino) : 'destino'
  const par = nomePar ? ` “${nomePar}”` : ' parecida'

  switch (decisao) {
    case 'criar_nova':
      return `Ignora a playlist${par} que já existe no ${para} e cria uma cópia nova.`
    case 'atualizar_origem_para_destino':
      return `A do ${de} manda: o ${para} ganha as faixas novas e perde as que você tirou no ${de}.`
    case 'atualizar_destino_para_origem':
      return `A do ${para} manda: o ${de} acompanha o que já está no ${para}.`
    case 'so_vincular':
      return `Liga as duas playlists para sincronizar depois, sem adicionar nem remover faixas agora.`
  }
}

export function idsComParNoDestino(
  playlists: PlaylistResumo[],
  origem: ServicoPlaylist,
  pares: ParPlaylist[]
): string[] {
  return playlists
    .filter((playlist) => Boolean(encontrarParOrientado(playlist.id, origem, pares)?.destino))
    .map((playlist) => playlist.id)
}

export function destinoOposto(origem: ServicoPlaylist): ServicoPlaylist {
  return origem === 'spotify' ? 'youtube' : 'spotify'
}

export function salvarRetornoYoutubeOAuth(rota: string = ROTA_RETORNO_GERENCIAR): void {
  try {
    sessionStorage.setItem(CHAVE_RETORNO_YOUTUBE_OAUTH, rota)
  } catch {
    return
  }
}

export function lerRetornoYoutubeOAuth(): string {
  try {
    const retorno = sessionStorage.getItem(CHAVE_RETORNO_YOUTUBE_OAUTH)
    sessionStorage.removeItem(CHAVE_RETORNO_YOUTUBE_OAUTH)
    return retorno?.startsWith('/musica') ? retorno : ROTA_RETORNO_GERENCIAR
  } catch {
    return ROTA_RETORNO_GERENCIAR
  }
}

export function filtrarPlaylistsPorBusca(
  playlists: PlaylistResumo[],
  busca: string
): PlaylistResumo[] {
  const termo = busca.trim().toLowerCase()
  if (!termo) return playlists
  return playlists.filter((playlist) => playlist.nome.toLowerCase().includes(termo))
}

export function totalFaixasSelecionadas(
  playlists: PlaylistResumo[],
  idsSelecionados: ReadonlySet<string>
): number {
  return playlists.reduce(
    (acc, playlist) => (idsSelecionados.has(playlist.id) ? acc + playlist.totalFaixas : acc),
    0
  )
}

export function encontrarParOrientado(
  playlistId: string,
  origem: ServicoPlaylist,
  pares: ParPlaylist[]
): ParPlaylist | null {
  if (origem === 'spotify') {
    const par = pares.find((item) => item.origem.id === playlistId)
    if (!par?.destino) return null
    return par
  }

  const par = pares.find((item) => item.destino?.id === playlistId)
  if (!par?.destino) return null

  return {
    origem: par.destino,
    destino: par.origem,
    similaridade: par.similaridade,
  }
}

export function idDestinoExistenteDoPar(par: ParPlaylist | null): string | undefined {
  return par?.destino?.id
}

export function montarPlaylistsInicio(
  idsSelecionados: string[],
  decisoes: Record<string, DecisaoPlaylistDestino>,
  pares: ParPlaylist[],
  origem: ServicoPlaylist
): PlaylistInicio[] {
  return idsSelecionados.map((idExterno) => {
    const par = encontrarParOrientado(idExterno, origem, pares)
    const decisao = decisoes[idExterno] ?? 'criar_nova'
    const idDestinoExistente = decisao === 'criar_nova' ? undefined : idDestinoExistenteDoPar(par)

    return {
      idExterno,
      decisao,
      ...(idDestinoExistente ? { idDestinoExistente } : {}),
    }
  })
}

export function deveRefetchDetalhe(status?: StatusTransferencia): number | false {
  if (!status) return false
  if (status === 'casando' || status === 'pausada_cota') {
    return 2000
  }
  if (status === 'executando') {
    return 1000
  }
  return false
}

export function agruparItensPrevia(itens: ItemTransferencia[]) {
  return {
    casadas: itens.filter((item) => item.status === 'casada'),
    duvidosas: itens.filter((item) => item.status === 'duvidosa'),
    naoEncontradas: itens.filter((item) => item.status === 'nao_encontrada'),
  }
}

export function montarPayloadConfirmacaoPrevia(
  detalhe: TransferenciaDetalhe,
  ignorados: ReadonlySet<string>
): { itens: ItemConfirmacaoPrevia[]; uuidsIgnorados: string[] } {
  if (detalhe.itensResumo) {
    return {
      itens: [],
      uuidsIgnorados: Array.from(ignorados),
    }
  }

  return {
    itens: detalhe.itens
      .filter((item) => ['casada', 'duvidosa', 'nao_encontrada'].includes(item.status))
      .map((item) => {
        if (ignorados.has(item.uuid)) {
          return { uuid: item.uuid, status: 'ignorada' as const }
        }

        if (item.status === 'casada' || item.status === 'duvidosa') {
          return {
            uuid: item.uuid,
            status: 'casada' as const,
            idExternoDestino: item.idExternoDestino,
            tituloDestino: item.tituloDestino,
            artistasDestino: item.artistasDestino,
          }
        }

        return { uuid: item.uuid, status: 'nao_encontrada' as const }
      }),
    uuidsIgnorados: Array.from(ignorados),
  }
}

/** @deprecated use montarPayloadConfirmacaoPrevia */
export function montarItensConfirmacaoPrevia(
  detalhe: TransferenciaDetalhe,
  ignorados: ReadonlySet<string>
): ItemConfirmacaoPrevia[] {
  return montarPayloadConfirmacaoPrevia(detalhe, ignorados).itens
}

export function formatarNumero(valor: number): string {
  return new Intl.NumberFormat('pt-BR').format(valor)
}

export function formatarDataCurta(valor: string | null | undefined): string {
  if (!valor) return '—'
  try {
    return new Intl.DateTimeFormat('pt-BR', {
      dateStyle: 'short',
      timeStyle: 'short',
    }).format(new Date(valor))
  } catch {
    return valor
  }
}

export const OPCOES_DECISAO: DecisaoPlaylistDestino[] = [
  'criar_nova',
  'atualizar_origem_para_destino',
  'atualizar_destino_para_origem',
  'so_vincular',
]
