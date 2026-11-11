import { Box, Grid, HStack, Text, VStack } from '@chakra-ui/react'
import { memo, useMemo } from 'react'
import type { CelulaMapaHorario } from '../types'
import {
  NOMES_DIAS_SEMANA,
  NOMES_DIAS_SEMANA_EXTENSO,
  ORDEM_DIAS_SEMANA,
  formatarFaixaHoraria,
  formatarMinutos,
} from '../utils'

const HORAS = Array.from({ length: 24 }, (_, hora) => hora)
const HORAS_COM_ROTULO = new Set([0, 6, 12, 18, 23])

export interface MapaHorariosMusicaProps {
  celulas: CelulaMapaHorario[]
}

export const MapaHorariosMusica = memo(function MapaHorariosMusica({
  celulas,
}: MapaHorariosMusicaProps) {
  const { porChave, maximo, pico } = useMemo(() => {
    const mapa = new Map(celulas.map((celula) => [`${celula.diaSemana}-${celula.hora}`, celula]))
    const ordenadas = [...celulas].sort((a, b) => b.minutos - a.minutos)
    return { porChave: mapa, maximo: ordenadas[0]?.minutos ?? 0, pico: ordenadas[0] ?? null }
  }, [celulas])

  return (
    <VStack align="stretch" gap={3} w="full">
      <Box overflowX="auto" pb={1}>
        <Grid
          templateColumns={{
            base: '28px repeat(24, minmax(0, 1fr))',
            md: '36px repeat(24, minmax(14px, 1fr))',
          }}
          gap={{ base: '2px', md: '3px' }}
        >
          {ORDEM_DIAS_SEMANA.map((dia) => (
            <LinhaDia key={dia} dia={dia} porChave={porChave} maximo={maximo} />
          ))}
          <Box />
          {HORAS.map((hora) => (
            <Text
              key={hora}
              fontSize="9px"
              color="cirqueira.musica.textoDesabilitado"
              textAlign="center"
              whiteSpace="nowrap"
              overflow="visible"
            >
              {HORAS_COM_ROTULO.has(hora) ? `${hora}h` : ''}
            </Text>
          ))}
        </Grid>
      </Box>

      <HStack justify="space-between" wrap="wrap" gap={2}>
        <Text fontSize="xs" color="cirqueira.musica.textoSecundario">
          {pico && pico.minutos > 0
            ? `Seu horário mais forte: ${NOMES_DIAS_SEMANA_EXTENSO[pico.diaSemana]}, ${formatarFaixaHoraria(pico.hora)} (${formatarMinutos(pico.minutos)})`
            : 'Sem reproduções no período'}
        </Text>
        <HStack gap={1.5}>
          <Text fontSize="2xs" color="cirqueira.musica.textoDesabilitado">
            menos
          </Text>
          {[0.12, 0.35, 0.6, 0.85, 1].map((opacidade) => (
            <Box
              key={opacidade}
              boxSize="10px"
              borderRadius="2px"
              bg="cirqueira.musica.verde"
              opacity={opacidade}
            />
          ))}
          <Text fontSize="2xs" color="cirqueira.musica.textoDesabilitado">
            mais
          </Text>
        </HStack>
      </HStack>
    </VStack>
  )
})

interface LinhaDiaProps {
  dia: number
  porChave: Map<string, CelulaMapaHorario>
  maximo: number
}

function LinhaDia({ dia, porChave, maximo }: LinhaDiaProps) {
  return (
    <>
      <Text fontSize="2xs" color="cirqueira.musica.textoSecundario" alignSelf="center">
        {NOMES_DIAS_SEMANA[dia]}
      </Text>
      {HORAS.map((hora) => {
        const celula = porChave.get(`${dia}-${hora}`)
        const minutos = celula?.minutos ?? 0
        const intensidade = maximo > 0 ? minutos / maximo : 0
        return (
          <Box
            key={hora}
            position="relative"
            aspectRatio="1"
            borderRadius="3px"
            bg="cirqueira.musica.cartaoElevado"
            title={`${NOMES_DIAS_SEMANA_EXTENSO[dia]}, ${formatarFaixaHoraria(hora)}: ${formatarMinutos(minutos)}`}
          >
            {minutos > 0 && (
              <Box
                position="absolute"
                inset={0}
                borderRadius="3px"
                bg="cirqueira.musica.verde"
                opacity={0.12 + intensidade * 0.88}
              />
            )}
          </Box>
        )
      })}
    </>
  )
}
