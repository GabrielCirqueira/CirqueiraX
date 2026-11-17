import { Box, Grid, HStack, SimpleGrid, Skeleton, Text, VStack } from '@chakra-ui/react'
import { TrendingUp } from 'lucide-react'
import { memo } from 'react'
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { useImagensItensMusica, useServicosMusica } from '../hooks'
import type { FonteReproducao, MusicaAnalise } from '../types'
import {
  CORES_GRAFICO_MUSICA,
  ROTULOS_FONTE_REPRODUCAO,
  formatarNumeroPtBr,
  gerarRotaMusica,
  percentualServicoPorMes,
} from '../utils'
import { CabecalhoSecaoMusica } from './CabecalhoSecaoMusica'
import { CapaMusica } from './CapaMusica'
import { IconeFonteMusica } from './IconeFonteMusica'
import { LinkMusica } from './LinkMusica'
import { MinutosMusica } from './MinutosMusica'
import { CartaoBlocoMusica, VazioBlocoMusica } from './PecasBlocoMusica'

export const AbaServicos = memo(function AbaServicos({ habilitado }: { habilitado: boolean }) {
  const { data, isLoading } = useServicosMusica(habilitado)
  const imagemDe = useImagensItensMusica([
    ...(data?.soSpotify ?? []),
    ...(data?.soYoutubeMusic ?? []),
  ])
  const pontos = percentualServicoPorMes(data?.meses ?? [])

  return (
    <VStack align="stretch" gap={4}>
      <CabecalhoSecaoMusica
        titulo="Spotify × YouTube Music"
        descricao="Como o seu tempo se dividiu entre os serviços ao longo dos meses"
      />
      {isLoading || !data ? (
        <Skeleton h="420px" borderRadius="12px" />
      ) : (
        <>
          <CartaoBlocoMusica
            titulo="Participação por mês"
            icone={<TrendingUp size={14} />}
            cor="cirqueira.musica.textoPrincipal"
          >
            <SimpleGrid columns={3} gap={3} mb={4}>
              <ContagemServico
                rotulo="Só no Spotify"
                valor={data.contagem.spotify}
                fonte="spotify"
              />
              <ContagemServico rotulo="Nos dois" valor={data.contagem.ambas} />
              <ContagemServico
                rotulo="Só no YouTube Music"
                valor={data.contagem.youtube_music}
                fonte="youtube_music"
              />
            </SimpleGrid>
            <Box h="240px" css={{ '& .recharts-text': { fontSize: '11px' } }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={pontos} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke={CORES_GRAFICO_MUSICA.grade}
                    vertical={false}
                  />
                  <XAxis
                    dataKey="rotulo"
                    stroke={CORES_GRAFICO_MUSICA.eixo}
                    tickLine={false}
                    minTickGap={16}
                  />
                  <YAxis
                    stroke={CORES_GRAFICO_MUSICA.eixo}
                    tickLine={false}
                    width={40}
                    domain={[0, 100]}
                    tickFormatter={(valor: number) => `${valor}%`}
                  />
                  <Tooltip
                    contentStyle={{
                      background: CORES_GRAFICO_MUSICA.cartao,
                      border: 'none',
                      borderRadius: 6,
                      fontSize: 12,
                    }}
                    formatter={(valor: number, nome: string) => [
                      `${valor}%`,
                      ROTULOS_FONTE_REPRODUCAO[nome as FonteReproducao] ?? nome,
                    ]}
                  />
                  <Legend
                    formatter={(nome: string) =>
                      ROTULOS_FONTE_REPRODUCAO[nome as FonteReproducao] ?? nome
                    }
                  />
                  <Line
                    type="monotone"
                    dataKey="spotify"
                    stroke={CORES_GRAFICO_MUSICA.fonteSpotify}
                    strokeWidth={2.5}
                    dot={false}
                  />
                  <Line
                    type="monotone"
                    dataKey="youtube_music"
                    stroke={CORES_GRAFICO_MUSICA.fonteYoutubeMusic}
                    strokeWidth={2.5}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </Box>
          </CartaoBlocoMusica>
          <Grid templateColumns={{ base: '1fr', md: '1fr 1fr' }} gap={4}>
            <ListaExclusivas fonte="spotify" musicas={data.soSpotify} imagemDe={imagemDe} />
            <ListaExclusivas
              fonte="youtube_music"
              musicas={data.soYoutubeMusic}
              imagemDe={imagemDe}
            />
          </Grid>
        </>
      )}
    </VStack>
  )
})

function ContagemServico({
  rotulo,
  valor,
  fonte,
}: { rotulo: string; valor: number; fonte?: FonteReproducao }) {
  return (
    <VStack gap={1} p={3} borderRadius="8px" bg="cirqueira.musica.cartaoElevado" align="flex-start">
      <HStack gap={1.5}>
        {fonte ? <IconeFonteMusica fonte={fonte} tamanho={12} /> : null}
        <Text fontSize="2xs" color="cirqueira.musica.textoSecundario" lineClamp={1}>
          {rotulo}
        </Text>
      </HStack>
      <Text fontSize="xl" fontWeight="black" color="cirqueira.musica.textoPrincipal" lineHeight="1">
        {formatarNumeroPtBr(valor)}
      </Text>
      <Text fontSize="2xs" color="cirqueira.musica.textoDesabilitado">
        músicas
      </Text>
    </VStack>
  )
}

function ListaExclusivas({
  fonte,
  musicas,
  imagemDe,
}: {
  fonte: FonteReproducao
  musicas: MusicaAnalise[]
  imagemDe: (item: MusicaAnalise) => string | null
}) {
  return (
    <CartaoBlocoMusica
      titulo={`Só no ${ROTULOS_FONTE_REPRODUCAO[fonte]}`}
      icone={<IconeFonteMusica fonte={fonte} tamanho={14} />}
      cor="cirqueira.musica.textoPrincipal"
    >
      {musicas.length === 0 ? (
        <VazioBlocoMusica texto="Nenhuma música exclusiva." />
      ) : (
        <VStack align="stretch" gap={2}>
          {musicas.map((musica, indice) => (
            <LinkMusica
              key={musica.musicaUuid ?? musica.nomeFaixa}
              to={gerarRotaMusica(musica.nomeFaixa, musica.artista, musica.musicaUuid)}
            >
              <HStack
                gap={3}
                p={1}
                borderRadius="6px"
                _hover={{ bg: 'cirqueira.musica.cartaoElevado' }}
              >
                <Text
                  fontSize="xs"
                  fontWeight="bold"
                  color="cirqueira.musica.textoDesabilitado"
                  w="18px"
                  textAlign="right"
                >
                  {indice + 1}
                </Text>
                <CapaMusica url={imagemDe(musica)} alt={musica.nomeFaixa} boxSize="40px" />
                <VStack align="flex-start" gap={0} flex={1} minW={0}>
                  <Text fontSize="sm" color="cirqueira.musica.textoPrincipal" lineClamp={1}>
                    {musica.nomeFaixa}
                  </Text>
                  <Text fontSize="2xs" color="cirqueira.musica.textoSecundario" lineClamp={1}>
                    {musica.artista}
                  </Text>
                </VStack>
                <VStack align="flex-end" gap={0} flexShrink={0}>
                  <Text fontSize="xs" fontWeight="bold" color="cirqueira.musica.textoPrincipal">
                    {formatarNumeroPtBr(musica.streams)}
                  </Text>
                  <Text fontSize="2xs" color="cirqueira.musica.textoSecundario">
                    <MinutosMusica minutos={musica.minutos} />
                  </Text>
                </VStack>
              </HStack>
            </LinkMusica>
          ))}
        </VStack>
      )}
    </CartaoBlocoMusica>
  )
}
