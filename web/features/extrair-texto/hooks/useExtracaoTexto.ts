import { addToast } from '@/shared/components/ui/toaster'
import { useMountEffect } from '@/shared/hooks'
import { useRef, useState } from 'react'
import type { Worker } from 'tesseract.js'
import { criarLeitorTexto, limparTextoReconhecido } from '../utils/reconhecimentoTexto'

export type EtapaExtracao = 'aguardando' | 'preparando' | 'lendo' | 'concluida' | 'erro'

async function copiarTexto(texto: string): Promise<boolean> {
  if (!texto || !navigator.clipboard?.writeText) return false
  try {
    await navigator.clipboard.writeText(texto)
    return true
  } catch {
    return false
  }
}

export function useExtracaoTexto() {
  const [etapa, setEtapa] = useState<EtapaExtracao>('aguardando')
  const [progresso, setProgresso] = useState(0)
  const [texto, setTexto] = useState('')
  const [urlImagem, setUrlImagem] = useState<string | null>(null)
  const [copiadoAutomaticamente, setCopiadoAutomaticamente] = useState(false)
  const leitorRef = useRef<Promise<Worker> | null>(null)
  const extracaoAtualRef = useRef(0)
  const urlImagemRef = useRef<string | null>(null)

  useMountEffect(() => () => {
    leitorRef.current?.then((leitor) => leitor.terminate())
    if (urlImagemRef.current) URL.revokeObjectURL(urlImagemRef.current)
  })

  function obterLeitor(): Promise<Worker> {
    if (!leitorRef.current) {
      leitorRef.current = criarLeitorTexto(setProgresso).catch((erro) => {
        leitorRef.current = null
        throw erro
      })
    }
    return leitorRef.current
  }

  function trocarImagem(arquivo: File) {
    if (urlImagemRef.current) URL.revokeObjectURL(urlImagemRef.current)
    const url = URL.createObjectURL(arquivo)
    urlImagemRef.current = url
    setUrlImagem(url)
  }

  async function extrair(arquivo: File) {
    const extracao = extracaoAtualRef.current + 1
    extracaoAtualRef.current = extracao
    trocarImagem(arquivo)
    setTexto('')
    setProgresso(0)
    setCopiadoAutomaticamente(false)
    setEtapa(leitorRef.current ? 'lendo' : 'preparando')

    try {
      const leitor = await obterLeitor()
      if (extracao !== extracaoAtualRef.current) return
      setEtapa('lendo')
      const resultado = await leitor.recognize(arquivo)
      if (extracao !== extracaoAtualRef.current) return
      const textoLimpo = limparTextoReconhecido(resultado.data.text)
      setTexto(textoLimpo)
      setEtapa('concluida')
      setCopiadoAutomaticamente(await copiarTexto(textoLimpo))
    } catch {
      if (extracao !== extracaoAtualRef.current) return
      setEtapa('erro')
      addToast({
        title: 'Não foi possível ler a imagem',
        description: 'Verifique a conexão na primeira vez (o leitor é baixado) e tente de novo.',
        type: 'error',
      })
    }
  }

  async function copiar() {
    const copiou = await copiarTexto(texto)
    addToast({
      title: copiou ? 'Texto copiado' : 'Não foi possível copiar',
      description: copiou ? undefined : 'Selecione o texto e use Ctrl + C.',
      type: copiou ? 'success' : 'error',
    })
  }

  return {
    etapa,
    progresso,
    texto,
    urlImagem,
    copiadoAutomaticamente,
    setTexto,
    extrair,
    copiar,
  }
}
