import { addToast } from '@/shared/components/ui/toaster'
import { useState } from 'react'
import type { Anotacao, ImagemEditor } from '../types'
import {
  baixarArquivo,
  copiarImagemParaAreaTransferencia,
  isAreaTransferenciaDisponivel,
} from '../utils/areaTransferencia'
import { TIPO_IMAGEM_EXPORTADA } from '../utils/constantesEditor'
import { gerarImagemEditada, sugerirNomeArquivo } from '../utils/exportacaoImagem'

export function useExportacaoEdicao() {
  const [copiando, setCopiando] = useState(false)

  async function copiar(imagem: ImagemEditor, anotacoes: Anotacao[]) {
    if (!isAreaTransferenciaDisponivel()) {
      addToast({
        title: 'Seu navegador não liberou a área de transferência',
        description: 'A imagem foi baixada no lugar. Copiar exige HTTPS.',
        color: 'warning',
      })
      await baixar(imagem, anotacoes)
      return
    }

    setCopiando(true)
    try {
      await copiarImagemParaAreaTransferencia(
        () => gerarImagemEditada(imagem, anotacoes),
        TIPO_IMAGEM_EXPORTADA
      )
      addToast({
        title: 'Imagem copiada',
        description: 'É só colar com Ctrl + V.',
        color: 'success',
      })
    } catch {
      addToast({
        title: 'Não foi possível copiar a imagem',
        description: 'Tente baixar a imagem.',
        color: 'danger',
      })
    } finally {
      setCopiando(false)
    }
  }

  async function baixar(imagem: ImagemEditor, anotacoes: Anotacao[]) {
    const conteudo = await gerarImagemEditada(imagem, anotacoes)
    baixarArquivo(conteudo, sugerirNomeArquivo(imagem))
  }

  return { copiando, copiar, baixar }
}
