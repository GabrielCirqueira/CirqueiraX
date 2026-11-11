import axios from 'axios'
import type { ImportacaoYoutube, StatusImportacaoYoutube } from '../types'

const INTERVALO_CONSULTA_MS = 2_500
const MICRODOLARES_POR_DOLAR = 1_000_000
const EXTENSOES_ACEITAS = ['.zip', '.json']
const TIPOS_ACEITOS = ['application/zip', 'application/x-zip-compressed', 'application/json']

export type PassoImportacaoYoutube =
  | 'lendo'
  | 'confirmacao'
  | 'classificando'
  | 'concluida'
  | 'erro'

export const PASSOS_IMPORTACAO_YOUTUBE: { chave: PassoImportacaoYoutube; rotulo: string }[] = [
  { chave: 'lendo', rotulo: 'Lendo' },
  { chave: 'confirmacao', rotulo: 'Aguardando confirmação' },
  { chave: 'classificando', rotulo: 'Classificando' },
  { chave: 'concluida', rotulo: 'Concluída' },
]

const PASSO_POR_STATUS: Record<StatusImportacaoYoutube, PassoImportacaoYoutube> = {
  enviada: 'lendo',
  processando: 'lendo',
  aguardando_confirmacao: 'confirmacao',
  classificando: 'classificando',
  concluida: 'concluida',
  erro: 'erro',
}

export function extrairMensagemErroApi(erro: unknown, padrao: string): string {
  if (axios.isAxiosError(erro)) {
    const corpo = erro.response?.data as { error?: string; message?: string } | undefined
    return corpo?.error || corpo?.message || padrao
  }
  return padrao
}

export function passoDaImportacao(
  importacao: ImportacaoYoutube | undefined
): PassoImportacaoYoutube {
  if (!importacao) return 'lendo'
  if (importacao.status === 'processando' && importacao.etapa === 'tempo_ouvido') {
    return 'classificando'
  }
  return PASSO_POR_STATUS[importacao.status]
}

export function indicePasso(passo: PassoImportacaoYoutube): number {
  return PASSOS_IMPORTACAO_YOUTUBE.findIndex((item) => item.chave === passo)
}

export function intervaloConsultaImportacao(dados: ImportacaoYoutube | undefined): number | false {
  if (!dados) return INTERVALO_CONSULTA_MS
  if (dados.isFinalizada || dados.aguardandoConfirmacao) return false
  return INTERVALO_CONSULTA_MS
}

export function percentualClassificacao(importacao: ImportacaoYoutube): number {
  const total = importacao.previa.paraIa
  if (total <= 0) return 100
  return Math.min(100, Math.round((importacao.classificacao.classificados / total) * 100))
}

export function formatarDolares(valor: number): string {
  return valor.toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 4,
  })
}

export function formatarMicrodolares(microdolares: number): string {
  return formatarDolares(microdolares / MICRODOLARES_POR_DOLAR)
}

export function formatarNumero(valor: number): string {
  return valor.toLocaleString('pt-BR')
}

export function formatarPeriodoCoberto(inicio: string | null, fim: string | null): string {
  if (!inicio || !fim) return 'Sem datas'
  const formatar = (iso: string) =>
    new Date(iso).toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' })
  return `${formatar(inicio)} a ${formatar(fim)}`
}

export function isArquivoTakeoutValido(arquivo: File): boolean {
  const nome = arquivo.name.toLowerCase()
  return (
    EXTENSOES_ACEITAS.some((extensao) => nome.endsWith(extensao)) ||
    TIPOS_ACEITOS.includes(arquivo.type)
  )
}

export const INSTRUCOES_TAKEOUT = [
  {
    titulo: 'Como pedir só o histórico',
    texto:
      'Em takeout.google.com, clique em "Desmarcar tudo", marque só "YouTube e YouTube Music", abra "Todos os dados do YouTube incluídos" e deixe marcado apenas "histórico". Em "Formatos", troque o histórico para JSON.',
  },
  {
    titulo: 'Quanto demora',
    texto:
      'O Google costuma mandar o link por e-mail em alguns minutos, mas pode levar horas. Baixe o .zip e envie aqui do jeito que veio.',
  },
  {
    titulo: 'Confira a exclusão automática',
    texto:
      'Em myactivity.google.com, veja se o histórico do YouTube não está configurado para apagar sozinho depois de 3 ou 18 meses. Se estiver, o arquivo só terá esse período.',
  },
]

export const AVISO_PRIVACIDADE_TAKEOUT =
  'Só o arquivo de histórico de visualizações é lido. Pesquisas, comentários, inscrições e endereços IP são ignorados.'
