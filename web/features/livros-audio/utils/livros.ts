import type { ItemFilaGeracao, LivroAudio, StatusLivroAudio } from '../types'

export interface AparenciaStatusLivro {
  rotulo: string
  paleta: 'green' | 'brand' | 'yellow' | 'red' | 'grey'
}

const APARENCIA_STATUS: Record<StatusLivroAudio, AparenciaStatusLivro> = {
  enviado: { rotulo: 'Na fila', paleta: 'grey' },
  extraindo: { rotulo: 'Extraindo texto', paleta: 'yellow' },
  gerando_audio: { rotulo: 'Gerando áudio', paleta: 'brand' },
  parcial: { rotulo: 'Áudio parcial', paleta: 'yellow' },
  pronto: { rotulo: 'Pronto', paleta: 'green' },
  erro: { rotulo: 'Erro', paleta: 'red' },
}

export function obterAparenciaStatusLivro(status: StatusLivroAudio): AparenciaStatusLivro {
  return APARENCIA_STATUS[status] ?? { rotulo: status, paleta: 'grey' }
}

export function calcularProgressoLeitura(paginaAtual: number, totalPaginas: number | null): number {
  if (!totalPaginas || totalPaginas <= 0) return 0
  const percentual = Math.round((paginaAtual / totalPaginas) * 100)
  return Math.min(100, Math.max(0, percentual))
}

export function formatarTamanhoLivro(bytes: number): string {
  if (bytes <= 0) return '0 B'
  const kb = bytes / 1024
  if (kb < 1024) return `${kb.toFixed(0)} KB`
  const mb = kb / 1024
  if (mb < 1024) return `${mb.toFixed(1).replace('.', ',')} MB`
  return `${(mb / 1024).toFixed(1).replace('.', ',')} GB`
}

export function formatarTempoRestante(segundos: number): string {
  if (segundos < 60) return 'menos de 1 min'
  const minutos = Math.round(segundos / 60)
  if (minutos < 60) return `${minutos} min`
  const horas = Math.floor(minutos / 60)
  const resto = minutos % 60
  return resto > 0 ? `${horas} h ${resto} min` : `${horas} h`
}

export function formatarDataRelativa(dataIso: string | null): string {
  if (!dataIso) return 'Nunca'
  const data = new Date(dataIso)
  const agora = Date.now()
  const diferencaSegundos = Math.floor((agora - data.getTime()) / 1000)

  if (diferencaSegundos < 60) return 'Agora há pouco'
  const minutos = Math.floor(diferencaSegundos / 60)
  if (minutos < 60) return `${minutos} min atrás`
  const horas = Math.floor(minutos / 60)
  if (horas < 24) return `${horas} h atrás`
  const dias = Math.floor(horas / 24)
  if (dias === 1) return 'Ontem'
  if (dias < 30) return `${dias} dias atrás`

  return data.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

export interface ContagemStatusLivros {
  total: number
  prontos: number
  emProcessamento: number
  comErro: number
}

export function contarLivrosPorStatus(livros: LivroAudio[] | undefined): ContagemStatusLivros {
  const lista = livros ?? []
  return {
    total: lista.length,
    prontos: lista.filter((l) => l.isPronto).length,
    emProcessamento: lista.filter((l) => l.isEmProcessamento).length,
    comErro: lista.filter((l) => l.isErro).length,
  }
}

const MINUTOS_POR_PARTE = 1

export interface ProgressoAudioLivro {
  percentual: number
  titulo: string
  detalhe: string
}

export function formatarDuracaoResumida(totalSegundos: number): string {
  const minutos = Math.round(totalSegundos / 60)
  if (minutos < 60) return `${minutos} min`
  const horas = Math.floor(minutos / 60)
  const resto = minutos % 60
  return resto > 0 ? `${horas}h${String(resto).padStart(2, '0')}` : `${horas}h`
}

function contarPartesRestantes(livro: LivroAudio): number {
  return Math.max(0, livro.totalBlocos - livro.blocosProntos - livro.blocosComErro)
}

export function contarPartesNaFrente(livro: LivroAudio, livros: LivroAudio[] = []): number {
  return livros
    .filter((outro) => outro.isEmProcessamento && outro.criadoEm < livro.criadoEm)
    .reduce((soma, outro) => soma + contarPartesRestantes(outro), 0)
}

function descreverTempoEstimado(partes: number): string {
  return formatarDuracaoResumida(partes * MINUTOS_POR_PARTE * 60)
}

export function obterProgressoAudio(
  livro: LivroAudio,
  partesNaFrente = 0,
  itemFila?: ItemFilaGeracao
): ProgressoAudioLivro {
  const { totalBlocos, blocosProntos, blocosComErro, segundosAudioProntos } = livro
  const percentual = totalBlocos > 0 ? Math.floor((blocosProntos / totalBlocos) * 100) : 0
  const audioPronto = formatarDuracaoResumida(segundosAudioProntos)

  if (livro.isErro && blocosProntos === 0) {
    return {
      percentual,
      titulo: 'Não foi possível gerar o áudio',
      detalhe: livro.erroMotivo ?? 'Ocorreu um erro ao processar este livro.',
    }
  }

  if (totalBlocos === 0) {
    return {
      percentual: 0,
      titulo: 'Aguardando a vez',
      detalhe:
        partesNaFrente > 0
          ? `Este livro começa depois do anterior, em cerca de ${descreverTempoEstimado(partesNaFrente)}.`
          : 'A preparação do texto começa em instantes.',
    }
  }

  if (livro.isPronto) {
    return {
      percentual: 100,
      titulo: `Áudio completo: ${audioPronto}`,
      detalhe: `${totalBlocos} de ${totalBlocos} partes prontas.`,
    }
  }

  const titulo = `${blocosProntos} de ${totalBlocos} partes prontas`
  const falhas = blocosComErro > 0 ? ` ${blocosComErro} com erro.` : ''
  const restantes = contarPartesRestantes(livro)
  const previsao = livro.filaPausada
    ? ' Geração pausada.'
    : itemFila?.segundosParaTerminar
      ? ` Termina em cerca de ${formatarTempoRestante(itemFila.segundosParaTerminar)}.`
      : restantes > 0
        ? ` Faltam cerca de ${descreverTempoEstimado(restantes + partesNaFrente)}.`
        : ''

  if (blocosProntos === 0) {
    return {
      percentual,
      titulo,
      detalhe: `A primeira parte já está sendo gerada.${previsao}${falhas}`,
    }
  }

  return {
    percentual,
    titulo,
    detalhe: `Você já pode ouvir ${audioPronto}.${previsao}${falhas}`,
  }
}
