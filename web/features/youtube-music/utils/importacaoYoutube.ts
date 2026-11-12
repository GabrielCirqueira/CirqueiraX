import axios from 'axios'
import type {
  DadosRelatorioImportacaoYoutube,
  ImportacaoYoutube,
  ListaImportacoesYoutubeDados,
  StatusImportacaoYoutube,
} from '../types'

const INTERVALO_CONSULTA_MS = 2_500
const INTERVALO_LISTA_EM_ANDAMENTO_MS = 15_000
const INTERVALO_LISTA_PARADA_MS = 120_000
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

export function intervaloConsultaImportacoes(
  lista: ListaImportacoesYoutubeDados | undefined
): number {
  const emAndamento = lista?.recentes.some((importacao) => !importacao.isFinalizada) ?? false
  return emAndamento ? INTERVALO_LISTA_EM_ANDAMENTO_MS : INTERVALO_LISTA_PARADA_MS
}

export function descreverSituacaoImportacao(importacao: ImportacaoYoutube): string {
  if (importacao.naFila) return 'Na fila: começa quando a importação anterior terminar'
  if (importacao.aguardandoConfirmacao) return 'Esperando você confirmar o custo da IA'
  if (importacao.status === 'concluida') return 'Concluída'
  if (importacao.status === 'erro') return importacao.erroMotivo ?? 'A importação falhou'
  if (importacao.status === 'classificando') {
    return `Identificando as músicas · ${percentualClassificacao(importacao)}%`
  }
  return importacao.etapaDescricao
}

export function corSituacaoImportacao(importacao: ImportacaoYoutube): string {
  if (importacao.status === 'concluida') return 'cirqueira.musica.verde'
  if (importacao.status === 'erro') return 'cirqueira.red.300'
  if (importacao.aguardandoConfirmacao || importacao.naFila) return 'cirqueira.musica.amarelo'
  return 'cirqueira.musica.azul'
}

export function formatarDataImportacao(iso: string | null): string {
  if (!iso) return ''
  return new Date(iso).toLocaleString('pt-BR', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function totalIdentificadas(relatorio: DadosRelatorioImportacaoYoutube): number {
  return relatorio.musicas + relatorio.mashups
}

export function totalParaRevisao(relatorio: DadosRelatorioImportacaoYoutube): number {
  return relatorio.revisar + relatorio.pendentes + relatorio.compilacoes + relatorio.indisponiveis
}

export interface ItemRelatorioImportacao {
  rotulo: string
  valor: string
  detalhe?: string
}

export interface SecaoRelatorioImportacao {
  titulo: string
  itens: ItemRelatorioImportacao[]
}

function juntarDetalhes(partes: [number, string][]): string | undefined {
  const texto = partes
    .filter(([valor]) => valor > 0)
    .map(([valor, rotulo]) => `${formatarNumero(valor)} ${rotulo}`)
    .join(' · ')
  return texto || undefined
}

export function montarSecoesRelatorio(
  relatorio: DadosRelatorioImportacaoYoutube,
  importacao: ImportacaoYoutube
): SecaoRelatorioImportacao[] {
  return [
    {
      titulo: 'Identificação',
      itens: [
        {
          rotulo: 'Músicas identificadas',
          valor: formatarNumero(totalIdentificadas(relatorio)),
          detalhe: juntarDetalhes([
            [relatorio.identificadasPorRegra, 'pelo canal oficial'],
            [relatorio.identificadasPelaIa, 'pela IA'],
            [relatorio.identificadasPorVoce, 'por você'],
            [relatorio.mashups, 'delas são mashups'],
          ]),
        },
        {
          rotulo: 'Foram para a revisão',
          valor: formatarNumero(totalParaRevisao(relatorio)),
          detalhe: juntarDetalhes([
            [relatorio.revisar + relatorio.pendentes, 'sem certeza'],
            [relatorio.compilacoes, 'compilações'],
            [relatorio.indisponiveis, 'indisponíveis'],
          ]),
        },
        {
          rotulo: 'Não eram música',
          valor: formatarNumero(relatorio.naoMusica),
          detalhe: 'podcasts, vídeos, tutoriais…',
        },
        {
          rotulo: 'Vídeos no arquivo',
          valor: formatarNumero(relatorio.videosUnicos),
          detalhe: juntarDetalhes([[relatorio.videosNovos, 'novos no sistema']]),
        },
      ],
    },
    {
      titulo: 'Reproduções do arquivo',
      itens: [
        { rotulo: 'Lidas', valor: formatarNumero(relatorio.reproducoesLidas) },
        { rotulo: 'Novas no sistema', valor: formatarNumero(relatorio.reproducoesNovas) },
        {
          rotulo: 'Já estavam no sistema',
          valor: formatarNumero(relatorio.reproducoesJaExistiam),
          detalhe: 'de importações anteriores; não contam duas vezes',
        },
        {
          rotulo: 'Juntadas com o coletor',
          valor: formatarNumero(relatorio.reproducoesUnificadas),
          detalhe: 'já capturadas ao vivo; viraram uma só',
        },
      ],
    },
    {
      titulo: 'O que você ouviu',
      itens: [
        {
          rotulo: 'Minutos de música',
          valor: formatarNumero(relatorio.minutosDeMusica),
          detalhe: 'estimados',
        },
        { rotulo: 'Streams', valor: formatarNumero(relatorio.streamsDeMusica) },
        { rotulo: 'Músicas diferentes', valor: formatarNumero(relatorio.musicasDistintas) },
        { rotulo: 'Artistas diferentes', valor: formatarNumero(relatorio.artistasDistintos) },
        {
          rotulo: 'Período',
          valor: formatarPeriodoCoberto(
            importacao.leitura.primeiraReproducaoEm,
            importacao.leitura.ultimaReproducaoEm
          ),
          detalhe: `${formatarNumero(relatorio.mesesComDados)} meses com dados`,
        },
        { rotulo: 'Custo da IA', valor: formatarDolares(importacao.classificacao.custoRealUsd) },
      ],
    },
  ]
}
