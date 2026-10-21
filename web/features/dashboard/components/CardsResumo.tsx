import { Grid, Skeleton, VStack } from '@chakra-ui/react'
import { memo } from 'react'
import type { ResumoDashboard } from '../types'
import { calcularResumoPipeline, pluralizar } from '../utils/metricasDashboard'
import { IndicadorMetrica, PainelDashboard } from './PainelDashboard'

export interface CardsResumoProps {
  resumo?: ResumoDashboard
  carregando?: boolean
  onSelecionarAba?: (aba: string) => void
}

const COLUNAS_INDICADORES = { base: '1fr', sm: 'repeat(2, 1fr)', lg: 'repeat(4, 1fr)' }
const CHAVES_CARREGANDO = ['resumo-sk-1', 'resumo-sk-2', 'resumo-sk-3', 'resumo-sk-4']

export const CardsResumo = memo(function CardsResumo({
  resumo,
  carregando = false,
  onSelecionarAba,
}: CardsResumoProps) {
  if (carregando) {
    return (
      <PainelDashboard semEspacamento>
        <Grid templateColumns={COLUNAS_INDICADORES} gap="1px" bg="border.subtle">
          {CHAVES_CARREGANDO.map((chave) => (
            <VStack key={chave} align="flex-start" gap={2} p={5} bg="bg.panel">
              <Skeleton h={3} w={20} />
              <Skeleton h={7} w={16} />
              <Skeleton h={3} w={28} />
            </VStack>
          ))}
        </Grid>
      </PainelDashboard>
    )
  }

  const pipeline = calcularResumoPipeline(resumo)
  const pendentes = pipeline.emProcessamento + pipeline.semCategoria

  return (
    <PainelDashboard semEspacamento>
      <Grid templateColumns={COLUNAS_INDICADORES} gap="1px" bg="border.subtle">
        <IndicadorMetrica
          rotulo="Total de mídias"
          valor={pipeline.total}
          detalhe={`${resumo?.tamanhoTotalFormatado ?? '0 B'} em disco`}
        />
        <IndicadorMetrica
          rotulo="Concluídas"
          valor={pipeline.concluidos}
          detalhe={`${pipeline.taxaConclusao}% do total`}
        />
        <IndicadorMetrica
          rotulo="Em processamento"
          valor={pendentes}
          tom={pipeline.semCategoria > 0 ? 'alerta' : 'neutro'}
          detalhe={
            pendentes === 0
              ? 'Fila vazia'
              : `${pipeline.emProcessamento} em execução · ${pipeline.semCategoria} sem categoria`
          }
          onClick={() => onSelecionarAba?.('categorias')}
        />
        <IndicadorMetrica
          rotulo="Erros"
          valor={pipeline.erros}
          tom={pipeline.erros > 0 ? 'erro' : 'neutro'}
          detalhe={
            pipeline.erros > 0
              ? `${pluralizar(pipeline.erros, 'falha', 'falhas')} para revisar`
              : 'Nenhuma falha'
          }
          onClick={() => onSelecionarAba?.('erros')}
        />
      </Grid>
    </PainelDashboard>
  )
})
