import type { FuncionalidadeSistema } from '@/shared/utils/funcionalidadesSistema'
import { funcionalidadeDaRota } from '@/shared/utils/funcionalidadesSistema'

export const HREF_POR_FUNCIONALIDADE: Record<FuncionalidadeSistema, string> = {
  dashboard: '/dashboard',
  musica: '/musica',
  central_midias: '/central-midias',
  downloads_video: '/downloads',
  downloads_audio: '/downloads-mp3',
  livros_audio: '/livros-audio',
  transcricoes: '/transcricoes',
  prints: '/prints',
  editor_imagem: '/editor-imagem',
  extrair_texto: '/extrair-texto',
  pronuncia: '/pronuncia',
  upload_manual: '/upload-manual',
  google_fotos: '/google-fotos',
  gerenciar_usuarios: '/usuarios',
}

export function funcionalidadeDoHref(href: string): FuncionalidadeSistema | null {
  return funcionalidadeDaRota(href)
}
