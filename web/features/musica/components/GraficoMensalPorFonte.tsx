import { Box, HStack, Text } from '@chakra-ui/react'
import { memo } from 'react'
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import type { PontoMensal } from '../types'
import {
  CORES_GRAFICO_MUSICA,
  type PontoMensalPorFonte,
  formatarMinutos,
  formatarNomeMes,
  formatarNumeroPtBr,
  separarPontosPorFonte,
} from '../utils'

export interface GraficoMensalPorFonteProps {
  pontos: PontoMensal[]
  metrica: 'minutos' | 'streams'
  altura?: string
}

export const GraficoMensalPorFonte = memo(function GraficoMensalPorFonte({
  pontos,
  metrica,
  altura = '220px',
}: GraficoMensalPorFonteProps) {
  const dados = separarPontosPorFonte(pontos, metrica)
  const formatar = (valor: number) =>
    metrica === 'minutos' ? formatarMinutos(valor) : `${formatarNumeroPtBr(valor)} streams`

  return (
    <Box h={altura} w="full" css={{ '& .recharts-text': { fontSize: '11px' } }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={dados} margin={{ top: 10, right: 4, left: 0, bottom: 0 }}>
          <CartesianGrid
            strokeDasharray="3 3"
            stroke={CORES_GRAFICO_MUSICA.grade}
            vertical={false}
          />
          <XAxis
            dataKey="rotulo"
            stroke={CORES_GRAFICO_MUSICA.eixo}
            fontSize={10}
            tickLine={false}
            interval="preserveStartEnd"
            minTickGap={12}
          />
          <YAxis
            stroke={CORES_GRAFICO_MUSICA.eixo}
            fontSize={10}
            tickLine={false}
            width={48}
            tickFormatter={(valor: number) => formatarNumeroPtBr(Math.round(valor))}
          />
          <Tooltip
            cursor={{ fill: 'rgba(255, 255, 255, 0.04)' }}
            content={({ active, payload }) => {
              const ponto = payload?.[0]?.payload as PontoMensalPorFonte | undefined
              if (!active || !ponto) return null
              return (
                <Box
                  bg="cirqueira.musica.cartao"
                  border="1px solid"
                  borderColor="cirqueira.musica.cartaoElevado"
                  p={2}
                  borderRadius="6px"
                  fontSize="xs"
                >
                  <Text fontWeight="bold" color="cirqueira.musica.textoPrincipal">
                    {formatarNomeMes(ponto.mes)} de {ponto.ano}
                  </Text>
                  <Text color="cirqueira.musica.fonteSpotify">
                    Spotify: {formatar(ponto.spotify)}
                  </Text>
                  <Text color="cirqueira.musica.fonteYoutubeMusic">
                    YouTube Music: {formatar(ponto.youtube_music)}
                    {metrica === 'minutos' && ponto.youtube_music > 0 ? ' (estimado)' : ''}
                  </Text>
                </Box>
              )
            }}
          />
          <Bar
            dataKey="spotify"
            stackId="fonte"
            fill={CORES_GRAFICO_MUSICA.fonteSpotify}
            maxBarSize={36}
          />
          <Bar
            dataKey="youtube_music"
            stackId="fonte"
            fill={CORES_GRAFICO_MUSICA.fonteYoutubeMusic}
            radius={[4, 4, 0, 0]}
            maxBarSize={36}
          />
        </BarChart>
      </ResponsiveContainer>
      <HStack
        gap={4}
        justify="center"
        fontSize="2xs"
        color="cirqueira.musica.textoSecundario"
        mt={1}
      >
        <HStack gap={1}>
          <Box boxSize="8px" borderRadius="2px" bg="cirqueira.musica.fonteSpotify" />
          <Text>Spotify</Text>
        </HStack>
        <HStack gap={1}>
          <Box boxSize="8px" borderRadius="2px" bg="cirqueira.musica.fonteYoutubeMusic" />
          <Text>YouTube Music</Text>
        </HStack>
      </HStack>
    </Box>
  )
})
