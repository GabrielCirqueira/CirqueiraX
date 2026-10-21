import { Box, Button, Grid, HStack, Skeleton, Text, VStack } from '@chakra-ui/react'
import { ArrowRight } from 'lucide-react'
import { memo } from 'react'
import { Link } from 'react-router-dom'
import type { MetricasVideosDashboard } from '../types'
import { COR_TOKEN, calcularResumoVideos, pluralizar } from '../utils/metricasDashboard'
import { BarraProporcao, IndicadorMetrica, PainelDashboard } from './PainelDashboard'

export interface CardsVideosMetricasProps {
  metricas?: MetricasVideosDashboard
  carregando?: boolean
}

const COLUNAS_INDICADORES = { base: '1fr', sm: 'repeat(2, 1fr)', lg: 'repeat(4, 1fr)' }

export const CardsVideosMetricas = memo(function CardsVideosMetricas({
  metricas,
  carregando = false,
}: CardsVideosMetricasProps) {
  const videos = calcularResumoVideos(metricas)

  return (
    <PainelDashboard
      semEspacamento
      titulo="Vídeos"
      descricao="Downloads, arquivos em disco e limpeza automática semanal"
      acao={
        <Button asChild size="xs" variant="ghost" borderRadius="lg" color="fg.muted">
          <Link to="/downloads-video">
            Ver downloads
            <ArrowRight size={12} />
          </Link>
        </Button>
      }
    >
      <Box borderTopWidth="1px" borderColor="border.subtle">
        {carregando ? (
          <Skeleton h="92px" borderRadius="none" />
        ) : (
          <Grid templateColumns={COLUNAS_INDICADORES} gap="1px" bg="border.subtle">
            <IndicadorMetrica
              rotulo="Baixados"
              valor={videos.totalBaixados}
              detalhe="Histórico completo"
            />
            <IndicadorMetrica
              rotulo="No disco"
              valor={videos.permanecem}
              detalhe={`${videos.tamanhoPermanecem} · ${videos.percentualPermanecem}%`}
            />
            <IndicadorMetrica
              rotulo="Apagados hoje"
              valor={videos.removidosHoje}
              detalhe={videos.removidosHoje > 0 ? 'Pela rotina de limpeza' : 'Nenhum hoje'}
            />
            <IndicadorMetrica
              rotulo="Espaço liberado"
              valor={videos.espacoLiberado}
              detalhe={pluralizar(videos.totalRemovidos, 'vídeo removido', 'vídeos removidos')}
            />
          </Grid>
        )}
      </Box>

      {!carregando && videos.totalBaixados > 0 && (
        <VStack
          align="stretch"
          gap={2}
          px={5}
          py={4}
          borderTopWidth="1px"
          borderColor="border.subtle"
        >
          <BarraProporcao
            segmentos={[
              { percentual: videos.percentualPermanecem, cor: COR_TOKEN.marca },
              { percentual: videos.percentualRemovidos, cor: COR_TOKEN.roxo },
            ]}
          />
          <HStack gap={4} fontSize="xs" color="fg.subtle" flexWrap="wrap">
            <HStack gap={1.5}>
              <Box w={2} h={2} borderRadius="full" bg={COR_TOKEN.marca} />
              <Text as="span">No disco {videos.percentualPermanecem}%</Text>
            </HStack>
            <HStack gap={1.5}>
              <Box w={2} h={2} borderRadius="full" bg={COR_TOKEN.roxo} />
              <Text as="span">Removidos {videos.percentualRemovidos}%</Text>
            </HStack>
          </HStack>
        </VStack>
      )}
    </PainelDashboard>
  )
})
