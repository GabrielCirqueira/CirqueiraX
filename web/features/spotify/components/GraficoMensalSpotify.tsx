import { Box, Text } from '@chakra-ui/react'
import { memo } from 'react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import type { PontoMensal } from '../types'
import {
  CORES_GRAFICO_SPOTIFY,
  formatarMinutosParaHorasEMinutos,
  formatarNomeMes,
  formatarNumeroPtBr,
  formatarRotuloMesCurto,
} from '../utils'

export interface GraficoMensalSpotifyProps {
  pontos: PontoMensal[]
  metrica?: 'minutos' | 'streams'
  altura?: string
  destacarUltimo?: boolean
  mostrarMedia?: boolean
}

export const GraficoMensalSpotify = memo(function GraficoMensalSpotify({
  pontos,
  metrica = 'minutos',
  altura = '240px',
  destacarUltimo = true,
  mostrarMedia = false,
}: GraficoMensalSpotifyProps) {
  const dados = pontos.map((ponto) => ({ ...ponto, rotulo: formatarRotuloMesCurto(ponto) }))
  const comValor = pontos.filter((ponto) => ponto[metrica] > 0)
  const media =
    comValor.length > 0
      ? comValor.reduce((soma, ponto) => soma + ponto[metrica], 0) / comValor.length
      : 0
  const formatarValor = (valor: number) =>
    metrica === 'minutos'
      ? formatarMinutosParaHorasEMinutos(valor)
      : `${formatarNumeroPtBr(valor)} streams`

  return (
    <Box h={altura} w="full" css={{ '& .recharts-text': { fontSize: '11px' } }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={dados} margin={{ top: 10, right: 4, left: 0, bottom: 0 }}>
          <CartesianGrid
            strokeDasharray="3 3"
            stroke={CORES_GRAFICO_SPOTIFY.grade}
            vertical={false}
          />
          <XAxis
            dataKey="rotulo"
            stroke={CORES_GRAFICO_SPOTIFY.eixo}
            fontSize={10}
            tickLine={false}
            interval="preserveStartEnd"
            minTickGap={12}
          />
          <YAxis
            stroke={CORES_GRAFICO_SPOTIFY.eixo}
            fontSize={10}
            tickLine={false}
            width={40}
            tickFormatter={(valor: number) =>
              metrica === 'minutos' ? `${Math.round(valor / 60)}h` : String(valor)
            }
          />
          <Tooltip
            cursor={{ fill: 'rgba(255, 255, 255, 0.04)' }}
            content={({ active, payload }) => {
              const ponto = payload?.[0]?.payload as (PontoMensal & { rotulo: string }) | undefined
              if (!active || !ponto) return null
              return (
                <Box
                  bg="cirqueira.spotify.cartao"
                  border="1px solid"
                  borderColor="cirqueira.spotify.cartaoElevado"
                  p={2}
                  borderRadius="6px"
                  fontSize="xs"
                >
                  <Text fontWeight="bold" color="cirqueira.spotify.textoPrincipal">
                    {formatarNomeMes(ponto.mes)} de {ponto.ano}
                  </Text>
                  <Text color="cirqueira.spotify.verde">
                    {formatarMinutosParaHorasEMinutos(ponto.minutos)}
                  </Text>
                  <Text color="cirqueira.spotify.textoSecundario">
                    {formatarNumeroPtBr(ponto.streams)} streams
                  </Text>
                </Box>
              )
            }}
          />
          {mostrarMedia && media > 0 && (
            <ReferenceLine
              y={media}
              stroke={CORES_GRAFICO_SPOTIFY.amarelo}
              strokeDasharray="4 4"
              label={{
                value: `média ${formatarValor(Math.round(media))}`,
                fill: CORES_GRAFICO_SPOTIFY.amarelo,
                fontSize: 10,
                position: 'insideTopLeft',
              }}
            />
          )}
          <Bar dataKey={metrica} radius={[4, 4, 0, 0]} maxBarSize={36}>
            {dados.map((ponto, indice) => (
              <Cell
                key={`${ponto.ano}-${ponto.mes}`}
                fill={
                  destacarUltimo && indice === dados.length - 1
                    ? CORES_GRAFICO_SPOTIFY.verde
                    : destacarUltimo
                      ? CORES_GRAFICO_SPOTIFY.azul
                      : CORES_GRAFICO_SPOTIFY.verde
                }
                fillOpacity={destacarUltimo && indice !== dados.length - 1 ? 0.55 : 1}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </Box>
  )
})
