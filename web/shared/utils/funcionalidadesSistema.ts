export const FUNCIONALIDADES_SISTEMA = [
  'dashboard',
  'musica',
  'central_midias',
  'downloads_video',
  'downloads_audio',
  'livros_audio',
  'transcricoes',
  'prints',
  'editor_imagem',
  'extrair_texto',
  'pronuncia',
  'upload_manual',
  'google_fotos',
  'gerenciar_usuarios',
] as const

export type FuncionalidadeSistema = (typeof FUNCIONALIDADES_SISTEMA)[number]

export const ROTULOS_FUNCIONALIDADE: Record<FuncionalidadeSistema, string> = {
  dashboard: 'Dashboard',
  musica: 'Música',
  central_midias: 'Central de Mídias',
  downloads_video: 'Downloads de Vídeo',
  downloads_audio: 'Downloads MP3',
  livros_audio: 'Livros em Áudio',
  transcricoes: 'Transcrições',
  prints: 'Prints & Capturas',
  editor_imagem: 'Editor de Imagem',
  extrair_texto: 'Extrair Texto',
  pronuncia: 'Inglês & Pronúncia',
  upload_manual: 'Upload Manual',
  google_fotos: 'Google Fotos',
  gerenciar_usuarios: 'Gerenciar Usuários',
}

export const ROTA_INICIAL_POR_FUNCIONALIDADE: Record<FuncionalidadeSistema, string> = {
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

const PREFIXOS_ROTA: Array<{ prefixo: string; funcionalidade: FuncionalidadeSistema }> = [
  { prefixo: '/usuarios', funcionalidade: 'gerenciar_usuarios' },
  { prefixo: '/musica', funcionalidade: 'musica' },
  { prefixo: '/spotify', funcionalidade: 'musica' },
  { prefixo: '/central-midias', funcionalidade: 'central_midias' },
  { prefixo: '/todas-midias', funcionalidade: 'central_midias' },
  { prefixo: '/downloads-mp3', funcionalidade: 'downloads_audio' },
  { prefixo: '/downloads', funcionalidade: 'downloads_video' },
  { prefixo: '/livros-audio', funcionalidade: 'livros_audio' },
  { prefixo: '/transcricoes', funcionalidade: 'transcricoes' },
  { prefixo: '/prints', funcionalidade: 'prints' },
  { prefixo: '/editor-imagem', funcionalidade: 'editor_imagem' },
  { prefixo: '/extrair-texto', funcionalidade: 'extrair_texto' },
  { prefixo: '/pronuncia', funcionalidade: 'pronuncia' },
  { prefixo: '/upload-manual', funcionalidade: 'upload_manual' },
  { prefixo: '/google-fotos', funcionalidade: 'google_fotos' },
  { prefixo: '/dashboard', funcionalidade: 'dashboard' },
  { prefixo: '/app', funcionalidade: 'dashboard' },
]

export function funcionalidadeDaRota(pathname: string): FuncionalidadeSistema | null {
  if (pathname === '/') return 'dashboard'
  for (const item of PREFIXOS_ROTA) {
    if (pathname === item.prefixo || pathname.startsWith(`${item.prefixo}/`)) {
      return item.funcionalidade
    }
  }
  return null
}

type UsuarioPermissao =
  | {
      administrador?: boolean
      roles?: string[]
      permissoes?: string[]
    }
  | null
  | undefined

export function usuarioEhAdministrador(usuario: UsuarioPermissao): boolean {
  if (!usuario) return false
  if (usuario.administrador) return true
  const papeis = usuario.roles ?? []
  return papeis.includes('ROLE_ADMIN') || papeis.includes('ROLE_SUPER_ADMIN')
}

export function usuarioPossuiPermissao(
  usuario: UsuarioPermissao,
  funcionalidade: FuncionalidadeSistema
): boolean {
  if (!usuario) return false
  if (usuarioEhAdministrador(usuario)) return true
  return (usuario.permissoes ?? []).includes(funcionalidade)
}

export function primeiraRotaPermitida(usuario: UsuarioPermissao): string {
  if (!usuario) return '/dashboard'
  if (usuarioEhAdministrador(usuario)) return '/dashboard'
  for (const codigo of FUNCIONALIDADES_SISTEMA) {
    if (usuarioPossuiPermissao(usuario, codigo)) {
      return ROTA_INICIAL_POR_FUNCIONALIDADE[codigo]
    }
  }
  return '/dashboard'
}

export function normalizarUsuarioAuth<
  T extends {
    roles?: string[]
    administrador?: boolean
    permissoes?: string[] | null
  },
>(usuario: T): T & { administrador: boolean; permissoes: string[] } {
  const permissoes = Array.isArray(usuario.permissoes) ? usuario.permissoes : []
  return {
    ...usuario,
    administrador: usuarioEhAdministrador(usuario),
    permissoes,
  }
}
