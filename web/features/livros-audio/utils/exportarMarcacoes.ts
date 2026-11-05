import type { MarcacaoLivro } from '../types'

function citar(texto: string): string {
  return texto
    .split('\n')
    .map((linha) => `> ${linha}`)
    .join('\n')
}

export function gerarMarkdownMarcacoes(titulo: string, marcacoes: MarcacaoLivro[]): string {
  const linhas = [`# ${titulo}`, '', `Exportado em ${new Date().toLocaleString('pt-BR')}.`, '']
  const grupos: [string, MarcacaoLivro[]][] = [
    ['Marcadores', marcacoes.filter((item) => item.tipo === 'marcador')],
    ['Destaques', marcacoes.filter((item) => item.tipo === 'destaque')],
    ['Notas', marcacoes.filter((item) => item.tipo === 'nota')],
  ]

  for (const [nome, itens] of grupos) {
    if (itens.length === 0) continue
    linhas.push(`## ${nome}`, '')
    for (const item of itens) {
      linhas.push(`### Página ${item.pagina}`, '')
      if (item.texto) linhas.push(citar(item.texto), '')
      if (item.nota) linhas.push(item.nota, '')
    }
  }

  return `${linhas.join('\n').trim()}\n`
}

export function baixarArquivoTexto(nome: string, conteudo: string, tipo = 'text/markdown') {
  const url = URL.createObjectURL(new Blob([conteudo], { type: `${tipo};charset=utf-8` }))
  const link = document.createElement('a')
  link.href = url
  link.download = nome
  link.click()
  window.setTimeout(() => URL.revokeObjectURL(url), 1000)
}
