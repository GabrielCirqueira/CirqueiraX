import { Badge, Box, Flex, Grid, HStack, Heading, Text, VStack } from '@chakra-ui/react'
import { Sparkles } from 'lucide-react'
import { memo } from 'react'
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis } from 'recharts'
import type { VisaoGeralMusica } from '../typesBlocos'
import {
  CORES_GRAFICO_MUSICA,
  formatarMinutos,
  formatarMinutosEmHorasExtenso,
  formatarNumeroPtBr,
  formatarPercentualVariacao,
  rotuloPontoSerie,
} from '../utils'
import { DivisaoFontesMusica } from './DivisaoFontesMusica'
import { TooltipMusica } from './MinutosMusica'
import { NumeroDestaqueMusica } from './PecasBlocoMusica'

export const VisaoGeralDestaque = memo(function VisaoGeralDestaque({
  dados,
}: {
  dados: VisaoGeralMusica
}) {
  const { totais, serie } = dados
  const pontos = serie.pontos.map((ponto) => ({
    ...ponto,
    rotulo: rotuloPontoSerie(ponto, serie.granularidade),
  }))

  return (
    <Box
      position="relative"
      overflow="hidden"
      borderRadius="16px"
      p={{ base: 5, md: 7 }}
      bgGradient="to-br"
      gradientFrom="cirqueira.musica.verde"
      gradientVia="cirqueira.musica.azul"
      gradientTo="cirqueira.musica.fundo"
      color="cirqueira.musica.fundo"
    >
      <Grid
        templateColumns={{ base: 'minmax(0, 1fr)', lg: 'minmax(0, 1fr) minmax(0, 1.2fr)' }}
        gap={{ base: 5, md: 8 }}
      >
        <VStack align="flex-start" gap={3}>
          <HStack gap={2}>
            <Sparkles size={16} />
            <Text fontSize="xs" fontWeight="bold" textTransform="uppercase" letterSpacing="widest">
              {dados.periodo.rotulo}
            </Text>
            {dados.variacaoMinutosPercentual !== null && (
              <Badge
                size="sm"
                borderRadius="full"
                bg="cirqueira.musica.fundo"
                color={
                  dados.variacaoMinutosPercentual >= 0
                    ? 'cirqueira.musica.verde'
                    : 'cirqueira.musica.fonteYoutubeMusic'
                }
              >
                {formatarPercentualVariacao(dados.variacaoMinutosPercentual)}
              </Badge>
            )}
          </HStack>
          <TooltipMusica conteudo={formatarMinutosEmHorasExtenso(totais.minutos)}>
            <Heading
              as="h3"
              fontSize={{ base: '5xl', md: '6xl' }}
              fontWeight="black"
              lineHeight="1"
              letterSpacing="tight"
              cursor="default"
            >
              {formatarNumeroPtBr(totais.minutos)}
            </Heading>
          </TooltipMusica>
          <Text fontSize="md" fontWeight="bold" mt={-1}>
            minutos ouvidos
          </Text>
          <DivisaoFontesMusica
            porFonte={totais.porFonte}
            destaque
            cor="cirqueira.musica.textoPrincipal"
          />
          <Flex gap={{ base: 4, md: 6 }} pt={1} wrap="wrap">
            <NumeroDestaqueMusica valor={formatarNumeroPtBr(totais.streams)} rotulo="streams" />
            <NumeroDestaqueMusica valor={formatarNumeroPtBr(totais.artistas)} rotulo="artistas" />
            <NumeroDestaqueMusica valor={formatarNumeroPtBr(totais.musicas)} rotulo="músicas" />
            <NumeroDestaqueMusica
              valor={formatarNumeroPtBr(totais.dias)}
              rotulo="dias com música"
            />
          </Flex>
        </VStack>

        <Box
          bg="cirqueira.musica.fundo"
          borderRadius="12px"
          p={3}
          minH="180px"
          css={{ '& .recharts-text': { fontSize: '10px' } }}
        >
          <Text fontSize="2xs" fontWeight="bold" color="cirqueira.musica.textoSecundario" mb={1}>
            Minutos por {serie.granularidade === 'dia' ? 'dia' : 'mês'}
          </Text>
          <Box h="160px">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={pontos} margin={{ top: 6, right: 4, left: 4, bottom: 0 }}>
                <defs>
                  <linearGradient id="preenchimentoVisaoGeral" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={CORES_GRAFICO_MUSICA.verde} stopOpacity={0.6} />
                    <stop offset="100%" stopColor={CORES_GRAFICO_MUSICA.verde} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis
                  dataKey="rotulo"
                  stroke={CORES_GRAFICO_MUSICA.eixo}
                  tickLine={false}
                  axisLine={false}
                  interval="preserveStartEnd"
                  minTickGap={24}
                />
                <Tooltip
                  cursor={{ stroke: CORES_GRAFICO_MUSICA.apagado }}
                  content={({ active, payload }) => {
                    const ponto = payload?.[0]?.payload as (typeof pontos)[number] | undefined
                    if (!active || !ponto) return null
                    return (
                      <Box
                        bg="cirqueira.musica.cartao"
                        border="1px solid"
                        borderColor="cirqueira.musica.cartaoElevado"
                        p={2}
                        borderRadius="6px"
                        fontSize="xs"
                        color="cirqueira.musica.textoPrincipal"
                      >
                        <Text fontWeight="bold">{ponto.rotulo}</Text>
                        <Text>{formatarMinutos(ponto.minutos)}</Text>
                        <Text color="cirqueira.musica.textoSecundario">
                          {formatarNumeroPtBr(ponto.streams)} streams
                        </Text>
                      </Box>
                    )
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="minutos"
                  stroke={CORES_GRAFICO_MUSICA.verde}
                  strokeWidth={2}
                  fill="url(#preenchimentoVisaoGeral)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </Box>
        </Box>
      </Grid>
    </Box>
  )
})
