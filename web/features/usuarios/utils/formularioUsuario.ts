import type { FuncionalidadeSistema } from '@/shared/utils/funcionalidadesSistema'
import type { FormularioUsuarioValores, UsuarioSistema } from '../types'

export function valoresIniciaisCadastro(): FormularioUsuarioValores {
  return {
    nomeCompleto: '',
    username: '',
    email: '',
    senha: '',
    administrador: false,
    permissoes: [],
  }
}

export function valoresIniciaisEdicao(usuario: UsuarioSistema): FormularioUsuarioValores {
  return {
    nomeCompleto: usuario.nomeCompleto,
    username: usuario.username,
    email: usuario.email,
    senha: '',
    administrador: usuario.administrador,
    permissoes: usuario.administrador ? [] : [...usuario.permissoes],
  }
}

export function alternarPermissao(
  atuais: FuncionalidadeSistema[],
  codigo: FuncionalidadeSistema
): FuncionalidadeSistema[] {
  if (atuais.includes(codigo)) {
    return atuais.filter((item) => item !== codigo)
  }
  return [...atuais, codigo]
}

export function resumoPermissoes(usuario: UsuarioSistema): string {
  if (usuario.administrador) return 'Acesso total'
  if (usuario.permissoes.length === 0) return 'Nenhuma permissão'
  if (usuario.permissoes.length === 1) return '1 funcionalidade'
  return `${usuario.permissoes.length} funcionalidades`
}

export function formularioValido(
  valores: FormularioUsuarioValores,
  modo: 'cadastro' | 'edicao'
): boolean {
  if (valores.nomeCompleto.trim().length < 3) return false
  if (valores.email.trim().length < 5) return false
  if (modo === 'cadastro') {
    if (valores.username.trim().length < 3) return false
    if (valores.senha.trim().length < 6) return false
  }
  if (modo === 'edicao' && valores.senha.trim() !== '' && valores.senha.trim().length < 6) {
    return false
  }
  if (!valores.administrador && valores.permissoes.length === 0) return false
  return true
}
