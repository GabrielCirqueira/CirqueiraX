import { addToast } from '@/shared/components/ui/toaster'
import { useCallback, useState } from 'react'
import { enviarArquivoUpload } from '../api'
import type { ArquivoFilaUpload } from '../types'

export function useUploadManual() {
  const [fila, setFila] = useState<ArquivoFilaUpload[]>([])
  const [categoriaPadraoId, setCategoriaPadraoId] = useState<string | null>(null)
  const [estaProcessando, setEstaProcessando] = useState(false)

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
      addToast({ title: `${novosArquivos.length} arquivo(s) adicionado(s) à fila.`, color: 'success' })
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

  const enviarItem = async (item: ArquivoFilaUpload): Promise<void> => {
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

      setFila((prev) =>
        prev.map((f) =>
          f.id === item.id
            ? {
                ...f,
                status: resultado.ehDuplicado ? 'duplicado' : 'sucesso',
                progresso: 100,
                ehDuplicado: resultado.ehDuplicado,
                mediaItem: resultado.mediaItem,
              }
            : f
        )
      )

      if (resultado.ehDuplicado) {
        addToast({ title: `"${item.nome}" já existia no banco e foi identificado como duplicado.`, color: 'warning' })
      } else {
        addToast({ title: `"${item.nome}" enviado com sucesso!`, color: 'success' })
      }
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'Falha ao enviar arquivo'
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
      addToast({ title: `Erro ao enviar "${item.nome}": ${msg}`, color: 'danger' })
    }
  }

  const enviarTodosPendentes = useCallback(async () => {
    const pendentes = fila.filter((f) => f.status === 'pendente' || f.status === 'erro')
    if (pendentes.length === 0) {
      addToast({ title: 'Nenhum arquivo pendente para enviar.', color: 'warning' })
      return
    }

    setEstaProcessando(true)
    for (const item of pendentes) {
      await enviarItem(item)
    }
    setEstaProcessando(false)
  }, [fila])

  const reenviarItemIndividual = useCallback(
    async (id: string) => {
      const item = fila.find((f) => f.id === id)
      if (!item) return

      setEstaProcessando(true)
      await enviarItem(item)
      setEstaProcessando(false)
    },
    [fila]
  )

  return {
    fila,
    estaProcessando,
    categoriaPadraoId,
    setCategoriaPadraoId,
    adicionarArquivos,
    removerArquivo,
    atualizarCategoriaItem,
    limparConcluidos,
    enviarTodosPendentes,
    reenviarItemIndividual,
  }
}
