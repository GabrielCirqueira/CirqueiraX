const PREFIXO_PADRAO = 'cirqueirax:'

export const CHAVES_STORAGE = {
  DOWNLOADS_MODO_VISUALIZACAO: 'downloads:modo-visualizacao',
  DOWNLOADS_COLUNAS_GRID: 'downloads:colunas-grid',
  DOWNLOADS_COLUNAS_COMPACTO: 'downloads:colunas-compacto',
  DOWNLOADS_POR_PAGINA: 'downloads:por-pagina',
  CENTRAL_MIDIAS_MODO_VISUALIZACAO: 'central-midias:modo-visualizacao',
  CENTRAL_MIDIAS_POR_PAGINA: 'central-midias:por-pagina',
  PRINTS_MODO_VISUALIZACAO: 'prints:modo-visualizacao',
  PRINTS_POR_PAGINA: 'prints:por-pagina',
  EDITOR_IMAGEM_FERRAMENTA: 'editor-imagem:ferramenta',
  EDITOR_IMAGEM_PREFERENCIAS: 'editor-imagem:preferencias',
} as const

export interface OpcoesLeituraStorage<T> {
  /**
   * Lista de valores permitidos. Se o valor salvo não estiver na lista, retorna o valorPadrao.
   */
  valoresPermitidos?: readonly T[]
  /**
   * Função validadora customizada. Se retornar false, retorna o valorPadrao.
   */
  validar?: (valor: unknown) => valor is T
}

function resolverChaveCompleta(chave: string): string {
  return chave.startsWith(PREFIXO_PADRAO) ? chave : `${PREFIXO_PADRAO}${chave}`
}

function estaDisponivel(): boolean {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined'
}

function validarValor<T>(candidato: unknown, opcoes?: OpcoesLeituraStorage<T>): candidato is T {
  if (opcoes?.validar) {
    return opcoes.validar(candidato)
  }
  if (opcoes?.valoresPermitidos) {
    return opcoes.valoresPermitidos.includes(candidato as T)
  }
  return candidato !== undefined && candidato !== null
}

export const localStorageService = {
  resolverChave: resolverChaveCompleta,

  obter<T>(chave: string, valorPadrao: T, opcoes?: OpcoesLeituraStorage<T>): T {
    if (!estaDisponivel()) {
      return valorPadrao
    }

    try {
      const chaveCompleta = resolverChaveCompleta(chave)
      const bruto = window.localStorage.getItem(chaveCompleta)
      if (bruto === null) {
        return valorPadrao
      }

      let interpretado: unknown
      try {
        interpretado = JSON.parse(bruto)
      } catch {
        // Suporte retrocompatível para strings/números gravados sem JSON.stringify
        if (typeof valorPadrao === 'number') {
          const num = Number(bruto)
          interpretado = Number.isNaN(num) ? bruto : num
        } else if (typeof valorPadrao === 'boolean') {
          interpretado = bruto === 'true'
        } else {
          interpretado = bruto
        }
      }

      if (validarValor<T>(interpretado, opcoes)) {
        return interpretado
      }

      return valorPadrao
    } catch {
      return valorPadrao
    }
  },

  salvar<T>(chave: string, valor: T): boolean {
    if (!estaDisponivel()) {
      return false
    }

    try {
      const chaveCompleta = resolverChaveCompleta(chave)
      const serializado = JSON.stringify(valor)
      window.localStorage.setItem(chaveCompleta, serializado)
      return true
    } catch {
      return false
    }
  },

  remover(chave: string): void {
    if (!estaDisponivel()) {
      return
    }

    try {
      const chaveCompleta = resolverChaveCompleta(chave)
      window.localStorage.removeItem(chaveCompleta)
    } catch {}
  },

  limparTudoDoSistema(): void {
    if (!estaDisponivel()) {
      return
    }

    try {
      const chavesParaRemover: string[] = []
      for (let i = 0; i < window.localStorage.length; i++) {
        const k = window.localStorage.key(i)
        if (k && k.startsWith(PREFIXO_PADRAO)) {
          chavesParaRemover.push(k)
        }
      }
      chavesParaRemover.forEach((k) => window.localStorage.removeItem(k))
    } catch {}
  },
}
