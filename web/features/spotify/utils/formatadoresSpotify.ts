import axios from 'axios'
import type { CapsulaMensal, ItemRankingArtistaCapsula, ItemRankingMusicaCapsula } from '../types'

export function extrairMensagemErroApi(erro: unknown, padrao: string): string {
  if (axios.isAxiosError(erro)) {
    const corpo = erro.response?.data as { error?: string; message?: string } | undefined
    return corpo?.error || corpo?.message || padrao
  }
  return padrao
}

const NOMES_MESES = [
  'Janeiro',
  'Fevereiro',
  'Março',
  'Abril',
  'Maio',
  'Junho',
  'Julho',
  'Agosto',
  'Setembro',
  'Outubro',
  'Novembro',
  'Dezembro',
]

const NOMES_MESES_ABREV = [
  'Jan',
  'Fev',
  'Mar',
  'Abr',
  'Mai',
  'Jun',
  'Jul',
  'Ago',
  'Set',
  'Out',
  'Nov',
  'Dez',
]

export function formatarMinutos(minutos: number): string {
  return `${Math.max(0, Math.round(minutos)).toLocaleString('pt-BR')} min`
}

export function formatarMinutosEmHorasExtenso(minutos: number): string {
  const minutosArredondados = Math.max(0, Math.round(minutos))
  const horas = Math.floor(minutosArredondados / 60)
  const minutosRestantes = minutosArredondados % 60
  const textoHoras = `${horas.toLocaleString('pt-BR')} ${horas === 1 ? 'hora' : 'horas'}`
  if (minutosRestantes === 0) return textoHoras
  return `${textoHoras} e ${minutosRestantes} ${minutosRestantes === 1 ? 'minuto' : 'minutos'}`
}

export function formatarMinutosParaHorasEMinutos(minutos: number): string {
  const minutosArredondados = Math.max(0, Math.round(minutos))
  const horas = Math.floor(minutosArredondados / 60)
  const minutosRestantes = minutosArredondados % 60

  if (horas === 0) {
    return `${minutosRestantes} min`
  }

  if (minutosRestantes === 0) {
    return `${horas}h`
  }

  return `${horas}h ${minutosRestantes}m`
}

export function formatarNomeMes(mes: number): string {
  if (mes < 1 || mes > 12) {
    return ''
  }
  return NOMES_MESES[mes - 1]
}

export function formatarNomeMesAbreviado(mes: number): string {
  if (mes < 1 || mes > 12) {
    return ''
  }
  return NOMES_MESES_ABREV[mes - 1]
}

export function formatarRotuloMesAno(ano: number, mes: number): string {
  const mesFormatado = formatarNomeMes(mes)
  return `${mesFormatado} de ${ano}`
}

export function formatarPercentualVariacao(variacao: number | null): string {
  if (variacao === null || Number.isNaN(variacao)) {
    return '0%'
  }

  const prefixo = variacao > 0 ? '+' : ''
  return `${prefixo}${variacao.toFixed(1).replace('.', ',')}%`
}

export function formatarDataHoraPtBr(dataIso: string | null): string {
  if (!dataIso) {
    return '—'
  }

  try {
    const data = new Date(dataIso)
    return new Intl.DateTimeFormat('pt-BR', {
      dateStyle: 'short',
      timeStyle: 'short',
    }).format(data)
  } catch {
    return dataIso
  }
}

export function formatarDataPtBr(dataIso: string | null): string {
  if (!dataIso) {
    return '—'
  }

  try {
    const data = new Date(dataIso)
    return new Intl.DateTimeFormat('pt-BR', {
      dateStyle: 'short',
    }).format(data)
  } catch {
    return dataIso
  }
}

function escaparCampoCsv(valor: string | number | null | undefined): string {
  if (valor === null || valor === undefined) {
    return '""'
  }

  const stringValor = String(valor).replace(/"/g, '""')
  return `"${stringValor}"`
}

export function exportarResumoCapsulaParaCsv(capsula: CapsulaMensal): string {
  const linhas: string[] = []

  linhas.push('SEÇÃO;MÉTRICA;VALOR')
  linhas.push(`Resumo Geral;Período;${escaparCampoCsv(capsula.rotulo)}`)
  linhas.push(`Resumo Geral;Total de Minutos;${escaparCampoCsv(capsula.totalMinutos)}`)
  linhas.push(`Resumo Geral;Total de Streams;${escaparCampoCsv(capsula.totalStreams)}`)
  linhas.push(`Resumo Geral;Faixas Distintas;${escaparCampoCsv(capsula.faixasDistintas)}`)

  linhas.push('')
  linhas.push('TOP MÚSICAS;POSIÇÃO;NOME;ARTISTA;ÁLBUM;STREAMS;MINUTOS;ESTREIA;MESES NO TOP 5')
  capsula.topMusicas.forEach((musica: ItemRankingMusicaCapsula) => {
    linhas.push(
      [
        'Top Música',
        escaparCampoCsv(musica.posicao),
        escaparCampoCsv(musica.nomeFaixa),
        escaparCampoCsv(musica.artistaPrincipal),
        escaparCampoCsv(musica.album),
        escaparCampoCsv(musica.totalStreams),
        escaparCampoCsv(musica.totalMinutos),
        escaparCampoCsv(musica.isEstreia ? 'Sim' : 'Não'),
        escaparCampoCsv(musica.mesesNoTop5),
      ].join(';')
    )
  })

  linhas.push('')
  linhas.push('TOP ARTISTAS;POSIÇÃO;NOME;STREAMS;MINUTOS;ESTREIA')
  capsula.topArtistas.forEach((artista: ItemRankingArtistaCapsula) => {
    linhas.push(
      [
        'Top Artista',
        escaparCampoCsv(artista.posicao),
        escaparCampoCsv(artista.nomeArtista),
        escaparCampoCsv(artista.totalStreams),
        escaparCampoCsv(artista.totalMinutos),
        escaparCampoCsv(artista.isEstreia ? 'Sim' : 'Não'),
      ].join(';')
    )
  })

  linhas.push('')
  linhas.push('HISTÓRICO DIÁRIO;DATA;DIA;MINUTOS')
  capsula.minutosPorDia.forEach((dia) => {
    linhas.push(
      [
        'Minutos por Dia',
        escaparCampoCsv(dia.data),
        escaparCampoCsv(dia.dia),
        escaparCampoCsv(dia.minutos),
      ].join(';')
    )
  })

  return `\uFEFF${linhas.join('\r\n')}`
}

export function baixarArquivoCsv(conteudo: string, nomeArquivo: string): void {
  const blob = new Blob([conteudo], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.setAttribute('href', url)
  link.setAttribute('download', nomeArquivo)
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}
