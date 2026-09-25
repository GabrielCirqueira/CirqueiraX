import { AppContainer } from '@/layouts/AppContainer'
import { cn } from '@/shared/lib/cn'
import { Container } from '@/shared/ui/layout'
import {
  AlertTriangle,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Download,
  Filter,
  FolderPlus,
  Loader2,
  RefreshCw,
  RotateCcw,
  Search,
  Trash2,
  Video,
  X,
} from 'lucide-react'
import { useCallback, useMemo, useState } from 'react'
import { BarraAcoesEmLote } from './components/BarraAcoesEmLote'
import { CampoNovoLink } from './components/CampoNovoLink'
import { GridVideos } from './components/GridVideos'
import {
  useApagarLote,
  useAtualizarMetadata,
  useCategorias,
  useCategorizarLote,
  useClassificarIndividual,
  useMediaItens,
  useRebaixarLote,
  useRetentarMediaItem,
  useRetentarTodos,
} from './hooks/useDownloadsVideo'
import type { FiltrosMediaItem, MediaItem } from './types'

export default function DownloadsVideo() {
  const [pagina, setPagina] = useState(1)
  const [busca, setBusca] = useState('')
  const [statusFiltro, setStatusFiltro] = useState<string>('')
  const [origemFiltro, setOrigemFiltro] = useState<string>('')
  const [selecionados, setSelecionados] = useState<string[]>([])

  const [itemEditarMetadata, setItemEditarMetadata] = useState<MediaItem | null>(null)
  const [novoTitulo, setNovoTitulo] = useState('')
  const [novoUploader, setNovoUploader] = useState('')

  const [modalCategorizarAberto, setModalCategorizarAberto] = useState(false)
  const [categoriaAlvoUuid, setCategoriaAlvoUuid] = useState<string | null>(null)
  const [categoriaSelecionadaId, setCategoriaSelecionadaId] = useState<string>('')

  const [modalConfirmarApagar, setModalConfirmarApagar] = useState(false)
  const [itemApagarAlvo, setItemApagarAlvo] = useState<string | null>(null)

  const [modalConfirmarRebaixar, setModalConfirmarRebaixar] = useState(false)
  const [itemRebaixarAlvo, setItemRebaixarAlvo] = useState<string | null>(null)

  const filtros = useMemo<FiltrosMediaItem>(() => {
    const obj: FiltrosMediaItem = {
      pagina,
      porPagina: 12,
    }
    if (busca.trim()) {
      obj.busca = busca.trim()
    }
    if (statusFiltro) {
      obj.status = statusFiltro
    }
    if (origemFiltro) {
      obj.origem = origemFiltro
    }
    return obj
  }, [pagina, busca, statusFiltro, origemFiltro])

  const { data: respostaPaginada, isLoading, isFetching, refetch } = useMediaItens(filtros)
  const { data: categorias = [] } = useCategorias()

  const { mutate: categorizarLoteMutate, isPending: pendenteCategorizarLote } = useCategorizarLote()
  const { mutate: classificarIndividualMutate, isPending: pendenteClassificarIndividual } =
    useClassificarIndividual()
  const { mutate: rebaixarLoteMutate, isPending: pendenteRebaixar } = useRebaixarLote()
  const { mutate: apagarLoteMutate, isPending: pendenteApagar } = useApagarLote()
  const { mutate: atualizarMetadataMutate, isPending: pendenteMetadata } = useAtualizarMetadata()
  const { mutate: retentarItemMutate } = useRetentarMediaItem()
  const { mutate: retentarTodosMutate, isPending: pendenteRetentarTodos } = useRetentarTodos()

  const itens = respostaPaginada?.data ?? []
  const paginacao = respostaPaginada?.paginacao
  const totalPaginas = paginacao ? Math.ceil(paginacao.total / paginacao.porPagina) : 1
  const temItensComErro = itens.some((item) => item.status === 'erro')

  const handleToggleSelect = useCallback((uuid: string) => {
    setSelecionados((prev) =>
      prev.includes(uuid) ? prev.filter((id) => id !== uuid) : [...prev, uuid]
    )
  }, [])

  const handleToggleSelectAll = useCallback(() => {
    if (selecionados.length === itens.length) {
      setSelecionados([])
    } else {
      setSelecionados(itens.map((item) => item.uuid))
    }
  }, [selecionados.length, itens])

  const handleLimparSelecao = useCallback(() => {
    setSelecionados([])
  }, [])

  const handleAbrirEditarMetadata = (item: MediaItem) => {
    setItemEditarMetadata(item)
    setNovoTitulo(item.metadata?.titulo || '')
    setNovoUploader(item.metadata?.uploader || '')
  }

  const handleSalvarMetadata = () => {
    if (!itemEditarMetadata) return
    atualizarMetadataMutate(
      {
        uuid: itemEditarMetadata.uuid,
        input: {
          titulo: novoTitulo.trim(),
          uploader: novoUploader.trim(),
        },
      },
      {
        onSuccess: () => {
          setItemEditarMetadata(null)
        },
      }
    )
  }

  const handleAbrirCategorizarIndividual = (item: MediaItem) => {
    setCategoriaAlvoUuid(item.uuid)
    setCategoriaSelecionadaId(item.categoriaId || '')
    setModalCategorizarAberto(true)
  }

  const handleAbrirCategorizarLote = () => {
    setCategoriaAlvoUuid(null)
    setCategoriaSelecionadaId('')
    setModalCategorizarAberto(true)
  }

  const handleConfirmarCategorizar = () => {
    if (!categoriaSelecionadaId) return

    if (categoriaAlvoUuid) {
      classificarIndividualMutate(
        {
          uuid: categoriaAlvoUuid,
          categoriaId: categoriaSelecionadaId,
        },
        {
          onSuccess: () => {
            setModalCategorizarAberto(false)
            setCategoriaAlvoUuid(null)
          },
        }
      )
    } else if (selecionados.length > 0) {
      categorizarLoteMutate(
        {
          uuids: selecionados,
          categoriaId: categoriaSelecionadaId,
        },
        {
          onSuccess: () => {
            setModalCategorizarAberto(false)
            setSelecionados([])
          },
        }
      )
    }
  }

  const handleAbrirApagarIndividual = (uuid: string) => {
    setItemApagarAlvo(uuid)
    setModalConfirmarApagar(true)
  }

  const handleAbrirApagarLote = () => {
    setItemApagarAlvo(null)
    setModalConfirmarApagar(true)
  }

  const handleConfirmarApagar = () => {
    const uuidsParaApagar = itemApagarAlvo ? [itemApagarAlvo] : selecionados
    if (uuidsParaApagar.length === 0) return

    apagarLoteMutate(
      { uuids: uuidsParaApagar },
      {
        onSuccess: () => {
          setModalConfirmarApagar(false)
          setItemApagarAlvo(null)
          setSelecionados((prev) => prev.filter((id) => !uuidsParaApagar.includes(id)))
        },
      }
    )
  }

  const handleAbrirRebaixarIndividual = (uuid: string) => {
    setItemRebaixarAlvo(uuid)
    setModalConfirmarRebaixar(true)
  }

  const handleAbrirRebaixarLote = () => {
    setItemRebaixarAlvo(null)
    setModalConfirmarRebaixar(true)
  }

  const handleConfirmarRebaixar = () => {
    const uuidsParaRebaixar = itemRebaixarAlvo ? [itemRebaixarAlvo] : selecionados
    if (uuidsParaRebaixar.length === 0) return

    rebaixarLoteMutate(
      { uuids: uuidsParaRebaixar },
      {
        onSuccess: () => {
          setModalConfirmarRebaixar(false)
          setItemRebaixarAlvo(null)
          setSelecionados((prev) => prev.filter((id) => !uuidsParaRebaixar.includes(id)))
        },
      }
    )
  }

  return (
    <AppContainer maxWidth="7xl" paddingY="8" paddingX="6">
      <Container size="full" className="space-y-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-zinc-200 dark:border-zinc-800 pb-6">
          <div className="space-y-1">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-brand-500/10 text-brand-500">
                <Video className="size-6" />
              </div>
              <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
                Downloads de Vídeo
              </h1>
            </div>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              Cole links de vídeos do YouTube, TikTok, Twitter e Instagram para ingestão e
              processamento automático.
            </p>
          </div>

          <div className="flex items-center gap-2">
            {temItensComErro && (
              <button
                type="button"
                onClick={() => retentarTodosMutate()}
                disabled={pendenteRetentarTodos}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900 hover:bg-amber-100 transition-colors"
              >
                {pendenteRetentarTodos ? (
                  <Loader2 className="size-3.5 animate-spin" />
                ) : (
                  <RotateCcw className="size-3.5" />
                )}
                <span>Retentar Falhas</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => refetch()}
              disabled={isFetching}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-zinc-700 dark:text-zinc-200 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
            >
              <RefreshCw className={cn('size-3.5', isFetching && 'animate-spin')} />
              <span>Atualizar</span>
            </button>
          </div>
        </div>

        <CampoNovoLink onDownloadIniciado={() => refetch()} />

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-zinc-50 dark:bg-zinc-900/60 p-3 rounded-2xl border border-zinc-200 dark:border-zinc-800">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-zinc-400" />
            <input
              type="text"
              value={busca}
              onChange={(e) => {
                setBusca(e.target.value)
                setPagina(1)
              }}
              placeholder="Buscar por título, canal ou hash..."
              className="w-full h-10 pl-9 pr-4 rounded-xl text-xs font-medium bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
            />
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 text-xs text-zinc-500">
              <Filter className="size-3.5" />
              <span>Status:</span>
            </div>
            <select
              value={statusFiltro}
              onChange={(e) => {
                setStatusFiltro(e.target.value)
                setPagina(1)
              }}
              className="h-10 px-3 rounded-xl text-xs font-medium bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 focus:outline-none focus:ring-2 focus:ring-brand-500/20 cursor-pointer"
            >
              <option value="">Todos os status</option>
              <option value="baixando">Baixando</option>
              <option value="recebido">Recebido</option>
              <option value="em_fila">Em Fila</option>
              <option value="classificado">Classificado</option>
              <option value="distribuindo">Distribuindo</option>
              <option value="distribuido_local">Distribuído</option>
              <option value="enviando_google_fotos">Google Fotos</option>
              <option value="concluido">Concluído</option>
              <option value="erro">Com Erro</option>
            </select>

            <select
              value={origemFiltro}
              onChange={(e) => {
                setOrigemFiltro(e.target.value)
                setPagina(1)
              }}
              className="h-10 px-3 rounded-xl text-xs font-medium bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 focus:outline-none focus:ring-2 focus:ring-brand-500/20 cursor-pointer"
            >
              <option value="">Todas as origens</option>
              <option value="manual">Manual / Web</option>
              <option value="bot_telegram">Bot Telegram</option>
              <option value="print_empresa">Print Empresa</option>
              <option value="print_pessoal">Print Pessoal</option>
            </select>
          </div>
        </div>

        <GridVideos
          itens={itens}
          carregando={isLoading}
          selecionados={selecionados}
          onToggleSelect={handleToggleSelect}
          onToggleSelectAll={handleToggleSelectAll}
          onEditarMetadata={handleAbrirEditarMetadata}
          onCategorizar={handleAbrirCategorizarIndividual}
          onRebaixar={handleAbrirRebaixarIndividual}
          onRetentar={(uuid) => retentarItemMutate(uuid)}
          onApagar={handleAbrirApagarIndividual}
        />

        {paginacao && paginacao.total > 0 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-zinc-200 dark:border-zinc-800">
            <span className="text-xs text-zinc-500 dark:text-zinc-400">
              Mostrando {itens.length} de {paginacao.total} registros (Página {pagina} de{' '}
              {totalPaginas})
            </span>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setPagina((p) => Math.max(1, p - 1))}
                disabled={pagina <= 1 || isFetching}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-200 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft className="size-4" />
                <span>Anterior</span>
              </button>

              <button
                type="button"
                onClick={() => setPagina((p) => Math.min(totalPaginas, p + 1))}
                disabled={pagina >= totalPaginas || isFetching}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-200 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <span>Próxima</span>
                <ChevronRight className="size-4" />
              </button>
            </div>
          </div>
        )}

        <BarraAcoesEmLote
          totalSelecionados={selecionados.length}
          selecionados={selecionados}
          onLimparSelecao={handleLimparSelecao}
          onCategorizarLote={handleAbrirCategorizarLote}
          onRebaixarLote={handleAbrirRebaixarLote}
          onApagarLote={handleAbrirApagarLote}
          processando={pendenteCategorizarLote || pendenteRebaixar || pendenteApagar}
        />

        {itemEditarMetadata && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in">
            <div className="w-full max-w-lg rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-6 shadow-2xl space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-zinc-100 dark:border-zinc-800">
                <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
                  Editar Metadados
                </h3>
                <button
                  type="button"
                  onClick={() => setItemEditarMetadata(null)}
                  className="p-1 rounded-lg text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
                >
                  <X className="size-4" />
                </button>
              </div>

              <div className="space-y-3">
                <div className="space-y-1">
                  <label
                    htmlFor="campo-editar-titulo"
                    className="text-xs font-semibold text-zinc-700 dark:text-zinc-300"
                  >
                    Título
                  </label>
                  <input
                    id="campo-editar-titulo"
                    type="text"
                    value={novoTitulo}
                    onChange={(e) => setNovoTitulo(e.target.value)}
                    className="w-full h-10 px-3 rounded-xl text-xs font-medium bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                  />
                </div>

                <div className="space-y-1">
                  <label
                    htmlFor="campo-editar-uploader"
                    className="text-xs font-semibold text-zinc-700 dark:text-zinc-300"
                  >
                    Uploader / Canal
                  </label>
                  <input
                    id="campo-editar-uploader"
                    type="text"
                    value={novoUploader}
                    onChange={(e) => setNovoUploader(e.target.value)}
                    className="w-full h-10 px-3 rounded-xl text-xs font-medium bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-zinc-100 dark:border-zinc-800">
                <button
                  type="button"
                  onClick={() => setItemEditarMetadata(null)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleSalvarMetadata}
                  disabled={pendenteMetadata}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-brand-500 hover:bg-brand-600 text-white disabled:opacity-50"
                >
                  {pendenteMetadata && <Loader2 className="size-3.5 animate-spin" />}
                  <span>Salvar Alterações</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {modalCategorizarAberto && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in">
            <div className="w-full max-w-md rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-6 shadow-2xl space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-zinc-100 dark:border-zinc-800">
                <div className="flex items-center gap-2">
                  <FolderPlus className="size-5 text-brand-500" />
                  <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
                    {categoriaAlvoUuid
                      ? 'Categorizar Vídeo'
                      : `Categorizar ${selecionados.length} Itens`}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setModalCategorizarAberto(false)}
                  className="p-1 rounded-lg text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
                >
                  <X className="size-4" />
                </button>
              </div>

              <div className="space-y-2">
                <label
                  htmlFor="campo-selecionar-categoria"
                  className="text-xs font-semibold text-zinc-700 dark:text-zinc-300"
                >
                  Selecione a Categoria de Destino
                </label>
                <select
                  id="campo-selecionar-categoria"
                  value={categoriaSelecionadaId}
                  onChange={(e) => setCategoriaSelecionadaId(e.target.value)}
                  className="w-full h-11 px-3 rounded-xl text-xs font-medium bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 focus:outline-none focus:ring-2 focus:ring-brand-500/20 cursor-pointer"
                >
                  <option value="">Selecione uma categoria...</option>
                  {categorias.map((cat) => (
                    <option key={cat.uuid} value={cat.uuid}>
                      {cat.nome}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-zinc-100 dark:border-zinc-800">
                <button
                  type="button"
                  onClick={() => setModalCategorizarAberto(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleConfirmarCategorizar}
                  disabled={
                    !categoriaSelecionadaId ||
                    pendenteCategorizarLote ||
                    pendenteClassificarIndividual
                  }
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-brand-500 hover:bg-brand-600 text-white disabled:opacity-50"
                >
                  {(pendenteCategorizarLote || pendenteClassificarIndividual) && (
                    <Loader2 className="size-3.5 animate-spin" />
                  )}
                  <span>Confirmar Categoria</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {modalConfirmarApagar && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in">
            <div className="w-full max-w-md rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-6 shadow-2xl space-y-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-full bg-rose-500/10 text-rose-500">
                  <Trash2 className="size-6" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
                    Confirmar Exclusão
                  </h3>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">
                    Esta ação removerá o arquivo físico e o registro do banco.
                  </p>
                </div>
              </div>

              <p className="text-xs text-zinc-600 dark:text-zinc-300">
                Tem certeza que deseja apagar{' '}
                <strong>
                  {itemApagarAlvo ? 'este arquivo' : `${selecionados.length} arquivos selecionados`}
                </strong>
                ?
              </p>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-zinc-100 dark:border-zinc-800">
                <button
                  type="button"
                  onClick={() => setModalConfirmarApagar(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleConfirmarApagar}
                  disabled={pendenteApagar}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-rose-600 hover:bg-rose-700 text-white disabled:opacity-50"
                >
                  {pendenteApagar && <Loader2 className="size-3.5 animate-spin" />}
                  <span>Sim, Apagar</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {modalConfirmarRebaixar && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in">
            <div className="w-full max-w-md rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-6 shadow-2xl space-y-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-full bg-blue-500/10 text-blue-500">
                  <Download className="size-6" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
                    Rebaixar Vídeo(s)
                  </h3>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">
                    O download será reenfileirado a partir da URL original gravada nos metadados.
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-zinc-100 dark:border-zinc-800">
                <button
                  type="button"
                  onClick={() => setModalConfirmarRebaixar(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleConfirmarRebaixar}
                  disabled={pendenteRebaixar}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50"
                >
                  {pendenteRebaixar && <Loader2 className="size-3.5 animate-spin" />}
                  <span>Confirmar Rebaixamento</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </Container>
    </AppContainer>
  )
}
