import { api } from '@/config/api'
import type { RespostaApi, RespostaPaginada } from '@/shared/types/api'
import type {
  CategoriaMetrica,
  ItemFilaErro,
  PastaSync,
  ResultadoSincronizacao,
  ResumoDashboard,
  StatusSyncthing,
} from './types'

export async function obterResumoDashboard(): Promise<ResumoDashboard> {
  const { data } = await api.get<RespostaApi<ResumoDashboard>>('/api/v1/dashboard/resumo')
  return data.data
}

export async function obterCategoriasMetricas(): Promise<CategoriaMetrica[]> {
  const { data } = await api.get<RespostaApi<CategoriaMetrica[]>>('/api/v1/dashboard/categorias')
  return data.data
}

export async function obterFilaErros(
  pagina = 1,
  limite = 20
): Promise<RespostaPaginada<ItemFilaErro>> {
  const { data } = await api.get<RespostaPaginada<ItemFilaErro>>('/api/v1/dashboard/erros', {
    params: { pagina, limite },
  })
  return data
}

export async function retentarTodosErros(): Promise<ItemFilaErro[]> {
  const { data } = await api.post<RespostaApi<ItemFilaErro[]>>('/api/v1/dashboard/erros/retentar')
  return data.data
}

export async function retentarErroIndividual(uuid: string): Promise<ItemFilaErro> {
  const { data } = await api.post<RespostaApi<ItemFilaErro>>(`/api/v1/media-itens/${uuid}/retentar`)
  return data.data
}

export async function obterStatusSync(): Promise<StatusSyncthing> {
  const { data } = await api.get<RespostaApi<StatusSyncthing | PastaSync[]>>('/api/v1/sync/pastas')
  if (Array.isArray(data.data)) {
    return {
      online: true,
      versao: null,
      pastas: data.data,
    }
  }
  return {
    online: data.data?.online ?? false,
    versao: data.data?.versao ?? null,
    pastas: data.data?.pastas ?? [],
  }
}

export async function obterPastasSync(): Promise<PastaSync[]> {
  const status = await obterStatusSync()
  return status.pastas
}

export async function sincronizarPasta(pastaId: string): Promise<ResultadoSincronizacao> {
  const { data } = await api.post<RespostaApi<ResultadoSincronizacao>>(
    `/api/v1/sync/pastas/${pastaId}/sincronizar`
  )
  return data.data
}

export async function criarCategoria(dados: {
  nome: string
  pastaLocal: string
  googlePhotosAlbumId?: string | null
}): Promise<CategoriaMetrica> {
  const { data } = await api.post<RespostaApi<CategoriaMetrica>>('/api/v1/categorias', dados)
  return data.data
}

export async function atualizarMapeamentoCategoria(
  uuid: string,
  dados: { nome?: string; pastaLocal?: string }
): Promise<CategoriaMetrica> {
  const { data } = await api.patch<RespostaApi<CategoriaMetrica>>(
    `/api/v1/categorias/${uuid}`,
    dados
  )
  return data.data
}

export async function reclassificarMediaItem(
  uuid: string,
  categoriaId: string
): Promise<ItemFilaErro> {
  const { data } = await api.patch<RespostaApi<ItemFilaErro>>(
    `/api/v1/media-itens/${uuid}/categoria`,
    {
      categoriaId,
    }
  )
  return data.data
}
