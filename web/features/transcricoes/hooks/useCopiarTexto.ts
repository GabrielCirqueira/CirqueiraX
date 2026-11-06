import { addToast } from '@/shared/components/ui/toaster'

export function useCopiarTexto() {
  return async function copiar(texto: string, descricao: string) {
    try {
      await navigator.clipboard.writeText(texto)
      addToast({ title: 'Copiado', description: descricao, type: 'success', duration: 2000 })
    } catch {
      addToast({
        title: 'Não foi possível copiar',
        description: 'Seu navegador bloqueou a área de transferência.',
        type: 'error',
      })
    }
  }
}
