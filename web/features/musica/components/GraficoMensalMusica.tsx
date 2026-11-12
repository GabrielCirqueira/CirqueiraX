import { Box, HStack, Text } from '@chakra-ui/react'
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
  CORES_GRAFICO_MUSICA,
  ROTULOS_FONTE_REPRODUCAO,
  formatarMinutos,
  formatarMinutosEmHorasExtenso,
  formatarNomeMes,
  formatarNumeroPtBr,
  formatarRotuloMesCurto,
  listarParcelasPorFonte,
} from '../utils'
import { IconeFonteMusica } from './IconeFonteMusica'

export interface GraficoMensalMusicaProps {
  pontos: PontoMensal[]
  metrica?: 'minutos' | 'streams'
  altura?: string
  destacarUltimo?: boolean
  mostrarMedia?: boolean
}

export const GraficoMensalMusica = memo(function GraficoMensalMusica({
  pontos,
  metrica = 'minutos',
  altura = '240px',
  destacarUltimo = true,
  mostrarMedia = false,
}: GraficoMensalMusicaProps) {
  const dados = pontos.map((ponto) => ({ ...ponto, rotulo: formatarRotuloMesCurto(ponto) }))
  const comValor = pontos.filter((ponto) => ponto[metrica] > 0)
  const media =
    comValor.length > 0
      ? comValor.reduce((soma, ponto) => soma + ponto[metrica], 0) / comValor.length
      : 0
  const formatarValor = (valor: number) =>
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
              const ponto = payload?.[0]?.payload as (PontoMensal & { rotulo: string }) | undefined
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
                  <Text color="cirqueira.musica.verde">{formatarMinutos(ponto.minutos)}</Text>
                  {ponto.minutos >= 60 && (
                    <Text color="cirqueira.musica.textoSecundario">
                      {formatarMinutosEmHorasExtenso(ponto.minutos)}
                    </Text>
                  )}
                  <Text color="cirqueira.musica.textoSecundario">
                    {formatarNumeroPtBr(ponto.streams)} streams
                  </Text>
                  {listarParcelasPorFonte(ponto.porFonte).length > 1 &&
                    listarParcelasPorFonte(ponto.porFonte).map((parcela) => (
                      <HStack key={parcela.fonte} gap={1.5} pt={0.5}>
                        <IconeFonteMusica fonte={parcela.fonte} tamanho={11} />
                        <Text color="cirqueira.musica.textoSecundario">
                          {ROTULOS_FONTE_REPRODUCAO[parcela.fonte]} ·{' '}
                          {formatarMinutos(parcela.minutos)}
                        </Text>
                      </HStack>
                    ))}
                </Box>
              )
            }}
          />
          {mostrarMedia && media > 0 && (
            <ReferenceLine
              y={media}
              stroke={CORES_GRAFICO_MUSICA.amarelo}
              strokeDasharray="4 4"
              label={{
                value: `média ${formatarValor(Math.round(media))}`,
                fill: CORES_GRAFICO_MUSICA.amarelo,
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
                    ? CORES_GRAFICO_MUSICA.verde
                    : destacarUltimo
                      ? CORES_GRAFICO_MUSICA.azul
                      : CORES_GRAFICO_MUSICA.verde
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
