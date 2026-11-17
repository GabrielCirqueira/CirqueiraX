export interface AtualizarPerfilInput {
  nomeCompleto: string
  email: string
}

export interface AlterarSenhaInput {
  senhaAtual: string
  novaSenha: string
  confirmacaoSenha: string
}
