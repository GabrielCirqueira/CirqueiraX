import { extrairMensagemErroApi } from '@/features/youtube-music/utils'
import { addToast } from '@/shared/components/ui/toaster'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import {
  aplicarAcaoEmLote,
  aplicarAcaoPorFiltro,
  classificarCanal,
  corrigirVideo,
  descartarDuplicata,
  unirMusicas,
} from '../api'
import type {
  AcaoLoteRevisao,
  ClassificacaoCanal,
  ContagensRevisao,
  DuplicataRevisao,
  FiltrosRevisao,
  PaginaRevisao,
  TipoRevisao,
  VideoRevisao,
} from '../types'
import {
  descontarContagem,
  descreverQuantidadeVideos,
  payloadAceitarSugestao,
  principalDaDuplicata,
  removerCanalDaPagina,
  removerDuplicataDaPagina,
  removerVideosDaPagina,
  sugereNaoMusica,
} from '../utils'
import { REVISAO_QUERY_KEYS } from './chavesQueryRevisao'

const CONCORRENCIA = 3

const ROTULOS_ACAO: Record<AcaoLoteRevisao, string> = {
  nao_musica: 'marcados como não música',
  manter_compilacao: 'mantidos como compilação',
}

interface ResultadoMassa {
  sucesso: number
  falhas: number
}

async function executarEmSequencia<T>(
  itens: T[],
  executar: (item: T) => Promise<unknown>
): Promise<ResultadoMassa> {
  const fila = [...itens]
  const resultado: ResultadoMassa = { sucesso: 0, falhas: 0 }
  const trabalhador = async () => {
    for (let item = fila.shift(); item !== undefined; item = fila.shift()) {
      try {
        await executar(item)
        resultado.sucesso += 1
      } catch {
        resultado.falhas += 1
      }
    }
  }
  await Promise.all(Array.from({ length: CONCORRENCIA }, trabalhador))
  return resultado
}

function useAtualizarRevisao(tipo: TipoRevisao) {
  const queryClient = useQueryClient()

  return {
    remover(
      transformar: (pagina: PaginaRevisao | undefined) => PaginaRevisao | undefined,
      quantidade: number
    ) {
      queryClient.setQueriesData<PaginaRevisao | undefined>(
        { queryKey: REVISAO_QUERY_KEYS.listasDoTipo(tipo) },
        transformar
      )
      queryClient.setQueryData<ContagensRevisao | undefined>(
        REVISAO_QUERY_KEYS.contagens,
        (atual) => descontarContagem(atual, tipo, quantidade)
      )
    },
    sincronizar() {
      queryClient.invalidateQueries({ queryKey: ['musica'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
    },
  }
}

function avisarResultado(titulo: string, resultado: ResultadoMassa, descricao: string) {
  addToast({
    type: resultado.falhas > 0 ? 'warning' : 'success',
    title: titulo,
    description:
      resultado.falhas > 0 ? `${descricao} ${resultado.falhas} não puderam ser salvos.` : descricao,
  })
}

function avisarErro(titulo: string, erro: unknown) {
  addToast({
    type: 'error',
    title: titulo,
    description: extrairMensagemErroApi(erro, 'Tente de novo em instantes.'),
  })
}

export interface AcaoLoteVariaveis {
  videoUuids: string[]
  acao: AcaoLoteRevisao
}

export function useAcaoEmLote(tipo: TipoRevisao) {
  const revisao = useAtualizarRevisao(tipo)

  return useMutation({
    mutationFn: ({ videoUuids, acao }: AcaoLoteVariaveis) => aplicarAcaoEmLote(videoUuids, acao),
    onMutate: ({ videoUuids }) =>
      revisao.remover((pagina) => removerVideosDaPagina(pagina, videoUuids), videoUuids.length),
    onError: (erro) => avisarErro('Não foi possível aplicar a ação', erro),
    onSuccess: (afetados, { acao }) =>
      addToast({
        type: 'success',
        title: 'Pronto',
        description: `${descreverQuantidadeVideos(afetados)} ${ROTULOS_ACAO[acao]}.`,
      }),
    onSettled: () => revisao.sincronizar(),
  })
}

export interface AcaoFiltroVariaveis {
  filtros: FiltrosRevisao
  acao: AcaoLoteRevisao
}

export function useAcaoPorFiltro(tipo: TipoRevisao) {
  const revisao = useAtualizarRevisao(tipo)

  return useMutation({
    mutationFn: ({ filtros, acao }: AcaoFiltroVariaveis) =>
      aplicarAcaoPorFiltro(tipo, filtros, acao),
    onError: (erro) => avisarErro('Não foi possível aplicar a ação', erro),
    onSuccess: (afetados, { acao }) =>
      addToast({
        type: 'success',
        title: 'Pronto',
        description: `${descreverQuantidadeVideos(afetados)} ${ROTULOS_ACAO[acao]}.`,
      }),
    onSettled: () => revisao.sincronizar(),
  })
}

export function useAceitarSugestoesEmLote(tipo: TipoRevisao) {
  const revisao = useAtualizarRevisao(tipo)

  return useMutation({
    mutationFn: async (videos: VideoRevisao[]) => {
      const naoMusica = videos.filter(sugereNaoMusica).map((video) => video.uuid)
      const comMusica = videos.filter((video) => !sugereNaoMusica(video))
      const resultado = await executarEmSequencia(comMusica, (video) => {
        const payload = payloadAceitarSugestao(video)
        return payload
          ? corrigirVideo(video.uuid, payload)
          : Promise.reject(new Error('sem sugestão'))
      })
      if (naoMusica.length === 0) return resultado
      try {
        const afetados = await aplicarAcaoEmLote(naoMusica, 'nao_musica')
        return { ...resultado, sucesso: resultado.sucesso + afetados }
      } catch {
        return { ...resultado, falhas: resultado.falhas + naoMusica.length }
      }
    },
    onMutate: (videos) => {
      const uuids = videos.map((video) => video.uuid)
      revisao.remover((pagina) => removerVideosDaPagina(pagina, uuids), uuids.length)
    },
    onError: (erro) => avisarErro('Não foi possível aceitar as sugestões', erro),
    onSuccess: (resultado) =>
      avisarResultado(
        'Sugestões aceitas',
        resultado,
        `${descreverQuantidadeVideos(resultado.sucesso)} resolvidos com a sugestão da IA.`
      ),
    onSettled: () => revisao.sincronizar(),
  })
}

export interface CanaisLoteVariaveis {
  canais: string[]
  classificacao: ClassificacaoCanal
}

export function useClassificarCanaisEmLote() {
  const revisao = useAtualizarRevisao('canal_novo')

  return useMutation({
    mutationFn: ({ canais, classificacao }: CanaisLoteVariaveis) =>
      executarEmSequencia(canais, (canal) => classificarCanal(canal, classificacao)),
    onMutate: ({ canais }) =>
      revisao.remover(
        (pagina) => canais.reduce((atual, canal) => removerCanalDaPagina(atual, canal), pagina),
        canais.length
      ),
    onError: (erro) => avisarErro('Não foi possível salvar as regras', erro),
    onSuccess: (resultado, { classificacao }) =>
      avisarResultado(
        'Regras salvas',
        resultado,
        `${resultado.sucesso} ${resultado.sucesso === 1 ? 'canal marcado' : 'canais marcados'} como ${classificacao === 'musica' ? 'música' : 'não música'}.`
      ),
    onSettled: () => revisao.sincronizar(),
  })
}

export type ModoDuplicatasLote = 'mais_ouvida_principal' | 'diferentes'

export interface DuplicatasLoteVariaveis {
  pares: DuplicataRevisao[]
  modo: ModoDuplicatasLote
}

export function useResolverDuplicatasEmLote() {
  const revisao = useAtualizarRevisao('possivel_duplicata')

  return useMutation({
    mutationFn: ({ pares, modo }: DuplicatasLoteVariaveis) =>
      executarEmSequencia(pares, (par) => {
        const { principal, outra } = principalDaDuplicata(par.musicas)
        return modo === 'diferentes'
          ? descartarDuplicata(par.musicas[0].uuid, par.musicas[1].uuid)
          : unirMusicas(outra.uuid, principal.uuid)
      }),
    onMutate: ({ pares }) => {
      const uuids = pares.flatMap((par) => par.musicas.map((musica) => musica.uuid))
      revisao.remover((pagina) => removerDuplicataDaPagina(pagina, uuids), pares.length)
    },
    onError: (erro) => avisarErro('Não foi possível resolver os pares', erro),
    onSuccess: (resultado, { modo }) =>
      avisarResultado(
        'Pares resolvidos',
        resultado,
        modo === 'diferentes'
          ? `${resultado.sucesso} pares marcados como músicas diferentes.`
          : `${resultado.sucesso} pares unidos com a mais ouvida como principal.`
      ),
    onSettled: () => revisao.sincronizar(),
  })
}
