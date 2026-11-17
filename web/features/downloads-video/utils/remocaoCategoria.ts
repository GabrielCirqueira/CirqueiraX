import type { ToastOptions } from '@/shared/components/ui/toaster'

const PROXIMO_PASSO_GOOGLE =
  'Ajuste a data e o horário e categorize de novo para reenviar ao Google Fotos.'

const PROXIMO_PASSO_LOCAL = 'Ajuste a data e o horário e categorize de novo quando quiser.'

function rotuloVideos(total: number): string {
  return total === 1 ? '1 vídeo' : `${total} vídeos`
}

export function montarAvisoRemocaoCategoria(
  removidos: number,
  solicitados: number,
  podeGoogleFotos = true
): ToastOptions {
  const proximoPasso = podeGoogleFotos ? PROXIMO_PASSO_GOOGLE : PROXIMO_PASSO_LOCAL

  if (removidos === 0) {
    return {
      title: 'Nenhuma categoria removida.',
      description: 'Os vídeos selecionados estão sem categoria ou ainda em processamento.',
      color: 'warning',
    }
  }

  if (removidos < solicitados) {
    return {
      title: `${rotuloVideos(removidos)} de ${solicitados} voltaram para "Sem categoria".`,
      description: `Os demais estão sem categoria ou em processamento. ${proximoPasso}`,
      color: 'warning',
      duration: 8000,
    }
  }

  return {
    title: `${rotuloVideos(removidos)} voltaram para "Sem categoria".`,
    description: proximoPasso,
    color: 'success',
    duration: 8000,
  }
}
