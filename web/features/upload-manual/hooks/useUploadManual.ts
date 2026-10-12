import { addToast } from '@/shared/components/ui/toaster'
import { useCallback, useState } from 'react'
import { enviarArquivoUpload, forcarSincronizacaoGoogleFotos } from '../api'
import type { ItemDuplicadoConfirmacao } from '../components/ModalConfirmarSincronizacaoDuplicado'
import type { ArquivoFilaUpload } from '../types'

export function useUploadManual() {
  const [fila, setFila] = useState<ArquivoFilaUpload[]>([])
  const [categoriaPadraoId, setCategoriaPadraoId] = useState<string | null>(null)
  const [estaProcessando, setEstaProcessando] = useState(false)
  const [itemDuplicadoPendente, setItemDuplicadoPendente] =
    useState<ItemDuplicadoConfirmacao | null>(null)
  const [sincronizandoDuplicado, setSincronizandoDuplicado] = useState(false)

  const gerarPreviewUrl = (file: File): string | null => {
    if (file.type.startsWith('image/') || file.type.startsWith('video/')) {
      return URL.createObjectURL(file)
    }
    return null
  }

  const adicionarArquivos = useCallback(
    (files: FileList | File[]) => {
      const novosArquivos = Array.from(files).map((file) => {
        const id = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
        const item: ArquivoFilaUpload = {
          id,
          file,
          nome: file.name,
          tamanhoBytes: file.size,
          tipoMime: file.type,
          previewUrl: gerarPreviewUrl(file),
          progresso: 0,
          status: 'pendente',
          mensagemErro: null,
          ehDuplicado: false,
          categoriaId: categoriaPadraoId,
          mediaItem: null,
        }
        return item
      })

      if (novosArquivos.length === 0) return

      setFila((prev) => [...prev, ...novosArquivos])
      addToast({
        title: `${novosArquivos.length} arquivo(s) adicionado(s) à fila.`,
        color: 'success',
      })
    },
    [categoriaPadraoId]
  )

  const removerArquivo = useCallback((id: string) => {
    setFila((prev) => {
      const item = prev.find((f) => f.id === id)
      if (item?.previewUrl) {
        URL.revokeObjectURL(item.previewUrl)
      }
      return prev.filter((f) => f.id !== id)
    })
  }, [])

  const atualizarCategoriaItem = useCallback((id: string, categoriaId: string | null) => {
    setFila((prev) => prev.map((item) => (item.id === id ? { ...item, categoriaId } : item)))
  }, [])

  const aplicarCategoriaParaTodos = useCallback((categoriaId: string | null) => {
    setFila((prev) =>
      prev.map((item) =>
        item.status === 'pendente' || item.status === 'erro'
          ? { ...item, categoriaId }
          : item
      )
    )
  }, [])

  const aplicarCategoriaParaSelecionados = useCallback(
    (ids: string[], categoriaId: string | null) => {
      setFila((prev) =>
        prev.map((item) => (ids.includes(item.id) ? { ...item, categoriaId } : item))
      )
    },
    []
  )

  const aplicarCategoriaParaSemCategoria = useCallback((categoriaId: string) => {
    setFila((prev) =>
      prev.map((item) =>
        !item.categoriaId && (item.status === 'pendente' || item.status === 'erro')
          ? { ...item, categoriaId }
          : item
      )
    )
  }, [])

  const limparConcluidos = useCallback(() => {
    setFila((prev) => {
      const mantidos: ArquivoFilaUpload[] = []
      for (const item of prev) {
        if (item.status === 'sucesso' || item.status === 'duplicado') {
          if (item.previewUrl) {
            URL.revokeObjectURL(item.previewUrl)
          }
        } else {
          mantidos.push(item)
        }
      }
      return mantidos
    })
  }, [])

  const enviarItemInterno = async (
    item: ArquivoFilaUpload,
    isLote = false
  ): Promise<'sucesso' | 'duplicado' | 'erro'> => {
    setFila((prev) =>
      prev.map((f) =>
        f.id === item.id ? { ...f, status: 'enviando', progresso: 0, mensagemErro: null } : f
      )
    )

    try {
      const resultado = await enviarArquivoUpload({
        arquivo: item.file,
        categoriaId: item.categoriaId,
        onProgress: (progresso) => {
          setFila((prev) => prev.map((f) => (f.id === item.id ? { ...f, progresso } : f)))
        },
      })

      const statusFinal = resultado.ehDuplicado ? 'duplicado' : 'sucesso'

      setFila((prev) =>
        prev.map((f) =>
          f.id === item.id
            ? {
                ...f,
                status: statusFinal,
                progresso: 100,
                ehDuplicado: resultado.ehDuplicado,
                mediaItem: resultado.mediaItem,
              }
            : f
        )
      )

      if (!isLote) {
        if (resultado.ehDuplicado) {
          addToast({
            title: `"${item.nome}" já existia no sistema e foi mantido sem duplicação.`,
            color: 'warning',
          })
        } else {
          addToast({ title: `"${item.nome}" enviado com sucesso!`, color: 'success' })
        }
      }

      return statusFinal
    } catch (error: unknown) {
      let msg = error instanceof Error ? error.message : 'Falha ao enviar arquivo'
      if (
        (typeof error === 'object' &&
          error !== null &&
          'response' in error &&
          (error as { response?: { status?: number } }).response?.status === 413) ||
        msg.includes('413')
      ) {
        msg = 'Arquivo excede o limite do servidor (413 Request Entity Too Large).'
      }

      setFila((prev) =>
        prev.map((f) =>
          f.id === item.id
            ? {
                ...f,
                status: 'erro',
                mensagemErro: msg,
                progresso: 0,
              }
            : f
        )
      )
      if (!isLote) {
        addToast({ title: `Erro ao enviar "${item.nome}": ${msg}`, color: 'danger' })
      }
      return 'erro'
    }
  }

  const enviarTodosPendentes = useCallback(async () => {
    const pendentes = fila.filter((f) => f.status === 'pendente' || f.status === 'erro')
    if (pendentes.length === 0) {
      addToast({ title: 'Nenhum arquivo pendente para enviar.', color: 'warning' })
      return
    }

    setEstaProcessando(true)
    let novosCount = 0
    let duplicadosCount = 0
    let errosCount = 0

    for (const item of pendentes) {
      const res = await enviarItemInterno(item, true)
      if (res === 'sucesso') novosCount++
      else if (res === 'duplicado') duplicadosCount++
      else errosCount++
    }

    setEstaProcessando(false)

    if (duplicadosCount > 0 && novosCount > 0) {
      addToast({
        title: `Upload concluído: ${novosCount} novo(s) arquivo(s) enviado(s). ${duplicadosCount} arquivo(s) já existiam no sistema e foram preservados sem duplicar!`,
        color: 'success',
      })
    } else if (duplicadosCount > 0 && novosCount === 0) {
      addToast({
        title: `Todos os ${duplicadosCount} arquivos já existiam no sistema e foram identificados como duplicados (nenhum registro foi duplicado).`,
        color: 'warning',
      })
    } else if (novosCount > 0) {
      addToast({
        title: `${novosCount} arquivo(s) enviado(s) com sucesso!`,
        color: 'success',
      })
    }

    if (errosCount > 0) {
      addToast({
        title: `${errosCount} arquivo(s) falharam durante o envio.`,
        color: 'danger',
      })
    }
  }, [fila])

  const reenviarItemIndividual = useCallback(
    async (id: string) => {
      const item = fila.find((f) => f.id === id)
      if (!item) return

      setEstaProcessando(true)
      await enviarItemInterno(item, false)
      setEstaProcessando(false)
    },
    [fila]
  )

  const abrirConfirmacaoDuplicado = useCallback((confirmacao: ItemDuplicadoConfirmacao) => {
    setItemDuplicadoPendente(confirmacao)
  }, [])

  const fecharConfirmacaoDuplicado = useCallback(() => {
    setItemDuplicadoPendente(null)
  }, [])

  const confirmarSincronizacaoDuplicado = useCallback(
    async (categoriaId?: string) => {
      if (!itemDuplicadoPendente?.mediaItem?.uuid) return

      setSincronizandoDuplicado(true)
      try {
        const itemAtualizado = await forcarSincronizacaoGoogleFotos(
          itemDuplicadoPendente.mediaItem.uuid,
          categoriaId
        )

        setFila((prev) =>
          prev.map((f) =>
            f.mediaItem?.uuid === itemDuplicadoPendente.mediaItem.uuid ||
            f.nome === itemDuplicadoPendente.nome
              ? {
                  ...f,
                  status: 'sucesso',
                  mediaItem: itemAtualizado,
                }
              : f
          )
        )

        addToast({
          title: `"${itemDuplicadoPendente.nome}" sincronizado com o Google Fotos com sucesso!`,
          color: 'success',
        })
        setItemDuplicadoPendente(null)
      } catch (error: unknown) {
        const msg = error instanceof Error ? error.message : 'Falha ao sincronizar com Google Fotos'
        addToast({
          title: `Erro ao sincronizar com Google Fotos: ${msg}`,
          color: 'danger',
        })
      } finally {
        setSincronizandoDuplicado(false)
      }
    },
    [itemDuplicadoPendente]
  )

  return {
    fila,
    estaProcessando,
    categoriaPadraoId,
    itemDuplicadoPendente,
    sincronizandoDuplicado,
    setCategoriaPadraoId,
    adicionarArquivos,
    removerArquivo,
    atualizarCategoriaItem,
    aplicarCategoriaParaTodos,
    aplicarCategoriaParaSelecionados,
    aplicarCategoriaParaSemCategoria,
    limparConcluidos,
    enviarTodosPendentes,
    reenviarItemIndividual,
    abrirConfirmacaoDuplicado,
    fecharConfirmacaoDuplicado,
    confirmarSincronizacaoDuplicado,
  }
}
