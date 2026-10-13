import { addToast } from '@/shared/components/ui/toaster'
import { Globe } from 'lucide-react'
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { criarPedidoDownload } from '../api'
import { identificarPlataforma, type PlataformaDetectada } from '../utils/plataformaVideo'

export type StatusItemFila = 'pendente' | 'baixando' | 'concluido' | 'erro'

export interface ItemFilaDownload {
  id: string
  url: string
  categoriaId: string | null
  nomeCategoria?: string
  status: StatusItemFila
  plataforma: PlataformaDetectada
  titulo?: string
  erro?: string
  adicionadoEm: number
  iniciadoEm?: number
  finalizadoEm?: number
}

interface FilaDownloadsState {
  itens: ItemFilaDownload[]
  pausado: boolean
  painelAberto: boolean
  processandoAtivo: boolean

  // Ações da Fila
  adicionarUrls: (
    urls: string[],
    categoriaId?: string | null,
    nomeCategoria?: string,
    onItemConcluido?: () => void
  ) => number
  removerItem: (id: string) => void
  limparConcluidos: () => void
  limparTudo: () => void
  pausar: () => void
  retomar: (onItemConcluido?: () => void) => void
  retentarItem: (id: string, onItemConcluido?: () => void) => void
  retentarTodosErros: (onItemConcluido?: () => void) => void
  setPainelAberto: (aberto: boolean) => void
  togglePainel: () => void

  // Processamento Sequencial
  processarFila: (onItemConcluido?: () => void) => Promise<void>
}

// Callback global para atualizar listas quando um download finalizar
let callbackConclusaoGlobal: (() => void) | null = null

export const useFilaDownloadsStore = create<FilaDownloadsState>()(
  persist(
    (set, get) => ({
      itens: [],
      pausado: false,
      painelAberto: true,
      processandoAtivo: false,

      setPainelAberto: (aberto) => set({ painelAberto: aberto }),
      togglePainel: () => set((state) => ({ painelAberto: !state.painelAberto })),

      adicionarUrls: (urls, categoriaId = null, nomeCategoria, onItemConcluido) => {
        if (onItemConcluido) {
          callbackConclusaoGlobal = onItemConcluido
        }

        const novosItens: ItemFilaDownload[] = []
        const urlsLimpos = urls.map((u) => u.trim()).filter(Boolean)

        for (const url of urlsLimpos) {
          // Identifica a plataforma do link
          const plataforma: PlataformaDetectada = identificarPlataforma(url) || {
            id: 'web',
            nome: 'Vídeo Web',
            icone: Globe,
            colorPalette: 'gray',
            conhecido: false,
          }

          novosItens.push({
            id: `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
            url,
            categoriaId: categoriaId || null,
            nomeCategoria,
            status: 'pendente',
            plataforma,
            adicionadoEm: Date.now(),
          })
        }

        if (novosItens.length === 0) {
          return 0
        }

        set((state) => ({
          itens: [...state.itens, ...novosItens],
          painelAberto: true,
        }))

        addToast({
          title:
            novosItens.length === 1
              ? 'Vídeo adicionado à fila de downloads!'
              : `${novosItens.length} vídeos adicionados à fila de downloads!`,
          color: 'primary',
        })

        // Inicia o processamento automático da fila
        setTimeout(() => {
          get().processarFila(callbackConclusaoGlobal ?? undefined)
        }, 50)

        return novosItens.length
      },

      removerItem: (id) => {
        set((state) => ({
          itens: state.itens.filter((item) => item.id !== id),
        }))
      },

      limparConcluidos: () => {
        set((state) => ({
          itens: state.itens.filter((item) => item.status !== 'concluido'),
        }))
      },

      limparTudo: () => {
        set({ itens: [] })
      },

      pausar: () => {
        set({ pausado: true })
        addToast({ title: 'Fila de downloads pausada.', color: 'info' })
      },

      retomar: (onItemConcluido) => {
        if (onItemConcluido) {
          callbackConclusaoGlobal = onItemConcluido
        }
        set({ pausado: false })
        addToast({ title: 'Fila de downloads retomada!', color: 'primary' })
        setTimeout(() => {
          get().processarFila(callbackConclusaoGlobal ?? undefined)
        }, 50)
      },

      retentarItem: (id, onItemConcluido) => {
        if (onItemConcluido) {
          callbackConclusaoGlobal = onItemConcluido
        }
        set((state) => ({
          itens: state.itens.map((item) =>
            item.id === id ? { ...item, status: 'pendente', erro: undefined } : item
          ),
        }))
        setTimeout(() => {
          get().processarFila(callbackConclusaoGlobal ?? undefined)
        }, 50)
      },

      retentarTodosErros: (onItemConcluido) => {
        if (onItemConcluido) {
          callbackConclusaoGlobal = onItemConcluido
        }
        set((state) => ({
          itens: state.itens.map((item) =>
            item.status === 'erro' ? { ...item, status: 'pendente', erro: undefined } : item
          ),
        }))
        setTimeout(() => {
          get().processarFila(callbackConclusaoGlobal ?? undefined)
        }, 50)
      },

      processarFila: async (onItemConcluido) => {
        const state = get()

        if (onItemConcluido) {
          callbackConclusaoGlobal = onItemConcluido
        }

        if (state.pausado || state.processandoAtivo) {
          return
        }

        // Verifica se há algum item já em download
        const temItemBaixando = state.itens.some((it) => it.status === 'baixando')
        if (temItemBaixando) {
          return
        }

        // Pega o próximo item pendente
        const proximo = state.itens.find((it) => it.status === 'pendente')
        if (!proximo) {
          set({ processandoAtivo: false })
          return
        }

        set({ processandoAtivo: true })

        // Marca como 'baixando'
        set((s) => ({
          itens: s.itens.map((it) =>
            it.id === proximo.id
              ? { ...it, status: 'baixando', iniciadoEm: Date.now() }
              : it
          ),
        }))

        try {
          const resposta = await criarPedidoDownload({
            url: proximo.url,
            categoriaId: proximo.categoriaId,
          })

          const titulo =
            (resposta as any)?.mediaItem?.metadata?.titulo ||
            (resposta as any)?.titulo ||
            resposta.plataformaDescricao ||
            'Vídeo'

          // Marca como concluído
          set((s) => ({
            itens: s.itens.map((it) =>
              it.id === proximo.id
                ? {
                    ...it,
                    status: 'concluido',
                    titulo,
                    finalizadoEm: Date.now(),
                  }
                : it
            ),
          }))

          addToast({
            title: `Download concluído: ${titulo}`,
            color: 'success',
          })

          // Notifica a lista de downloads para atualizar
          if (callbackConclusaoGlobal) {
            callbackConclusaoGlobal()
          }
        } catch (error: any) {
          const mensagemErro =
            error?.response?.data?.message ||
            error?.response?.data?.detalhes ||
            error?.message ||
            'Falha no download do vídeo'

          set((s) => ({
            itens: s.itens.map((it) =>
              it.id === proximo.id
                ? {
                    ...it,
                    status: 'erro',
                    erro: mensagemErro,
                    finalizadoEm: Date.now(),
                  }
                : it
            ),
          }))

          addToast({
            title: `Erro ao baixar (${proximo.plataforma.nome}): ${mensagemErro}`,
            color: 'danger',
          })
        } finally {
          set({ processandoAtivo: false })

          // Continua automaticamente para o próximo item
          setTimeout(() => {
            get().processarFila(callbackConclusaoGlobal ?? undefined)
          }, 200)
        }
      },
    }),
    {
      name: 'cirqueirax-fila-downloads-v2',
      partialize: (state) => ({
        // Reseta qualquer item que estivesse travado como 'baixando' para 'pendente'
        // e garante que nenhum objeto de componente React seja persistido no JSON
        itens: state.itens.map((it) => ({
          ...it,
          status: it.status === 'baixando' ? ('pendente' as const) : it.status,
          plataforma: it.plataforma
            ? {
                id: it.plataforma.id,
                nome: it.plataforma.nome,
                colorPalette: it.plataforma.colorPalette,
                conhecido: it.plataforma.conhecido,
                icone: undefined as any,
              }
            : it.plataforma,
        })),
        pausado: state.pausado,
        painelAberto: state.painelAberto,
      }),
    }
  )
)
