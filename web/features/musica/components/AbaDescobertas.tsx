import { Badge, Box, Grid, HStack, SimpleGrid, Skeleton, Text, VStack } from '@chakra-ui/react'
import { Layers, Wind } from 'lucide-react'
import { memo } from 'react'
import { useBlocoMusica, useImagensItensMusica } from '../hooks'
import type { ProfundidadeMusica, SaudadeMusica } from '../typesBlocos'
import {
  encontrarPico,
  formatarDiasSemOuvir,
  formatarMinutos,
  formatarNumeroPtBr,
  gerarRotaArtista,
  gerarRotaMusica,
  musicasValidas,
  proporcao,
} from '../utils'
import { CapaMusica } from './CapaMusica'
import { LinkMusica } from './LinkMusica'
import { BarraProporcaoMusica, CartaoBlocoMusica, VazioBlocoMusica } from './PecasBlocoMusica'
import { SecaoDescobertas } from './SecaoDescobertas'

export const AbaDescobertas = memo(function AbaDescobertas({
  habilitado,
}: { habilitado: boolean }) {
  return (
    <VStack align="stretch" gap={6}>
      <SecaoDescobertas habilitado={habilitado} />
      <Grid templateColumns={{ base: '1fr', lg: '1.4fr 1fr' }} gap={4}>
        <BlocoSaudade habilitado={habilitado} />
        <BlocoProfundidade habilitado={habilitado} />
      </Grid>
    </VStack>
  )
})

function BlocoSaudade({ habilitado }: { habilitado: boolean }) {
  const { data, isLoading } = useBlocoMusica<SaudadeMusica>('saudade', habilitado, { dias: 90 })
  const itens = data?.itens ?? []
  const imagemDe = useImagensItensMusica(musicasValidas(itens.map((item) => item.musica)))

  return (
    <CartaoBlocoMusica titulo="Saudade" icone={<Wind size={14} />} cor="cirqueira.musica.azul">
      <Text fontSize="xs" color="cirqueira.musica.textoSecundario" mb={4}>
        Músicas que você ouvia bastante e não toca há mais de 90 dias
      </Text>
      {isLoading ? (
        <Skeleton h="320px" borderRadius="8px" />
      ) : itens.length === 0 ? (
        <VazioBlocoMusica texto="Nada parado há tanto tempo." />
      ) : (
        <SimpleGrid columns={{ base: 2, sm: 3, md: 4 }} gap={3}>
          {itens.slice(0, 12).map((item) => (
            <LinkMusica
              key={item.musicaUuid}
              to={gerarRotaMusica(item.nome, item.artista, item.musicaUuid)}
            >
              <VStack align="stretch" gap={1.5}>
                <Box position="relative">
                  <CapaMusica
                    url={item.musica ? imagemDe(item.musica) : null}
                    alt={item.nome}
                    w="full"
                    aspectRatio={1}
                    borderRadius="8px"
                    tamanhoIcone={28}
                    filter="saturate(0.6)"
                  />
                  <Badge
                    position="absolute"
                    bottom={1.5}
                    left={1.5}
                    right={1.5}
                    size="xs"
                    justifyContent="center"
                    borderRadius="full"
                    bg="cirqueira.musica.fundo"
                    color="cirqueira.musica.azul"
                  >
                    {formatarDiasSemOuvir(item.diasSemOuvir)}
                  </Badge>
                </Box>
                <Text
                  fontSize="xs"
                  fontWeight="bold"
                  color="cirqueira.musica.textoPrincipal"
                  lineClamp={1}
                >
                  {item.nome}
                </Text>
                <Text fontSize="2xs" color="cirqueira.musica.textoSecundario" lineClamp={1}>
                  {item.artista} · {formatarNumeroPtBr(item.streams)} streams
                </Text>
              </VStack>
            </LinkMusica>
          ))}
        </SimpleGrid>
      )}
    </CartaoBlocoMusica>
  )
}

function BlocoProfundidade({ habilitado }: { habilitado: boolean }) {
  const { data, isLoading } = useBlocoMusica<ProfundidadeMusica>('profundidade', habilitado, {
    periodo: 'todos',
  })
  const itens = data?.itens ?? []
  const imagemDe = useImagensItensMusica(
    itens.flatMap((item) => (item.artista ? [item.artista] : []))
  )
  const maximoMusicas =
    encontrarPico(itens.map((item) => ({ minutos: item.musicasDistintas })))?.minutos ?? 0
  const mesesTotais = Math.max(1, data?.mesesNoPeriodo ?? 1)

  return (
    <CartaoBlocoMusica
      titulo="Profundidade do artista"
      icone={<Layers size={14} />}
      cor="cirqueira.musica.verde"
    >
      <Text fontSize="xs" color="cirqueira.musica.textoSecundario" mb={4}>
        Quantas músicas diferentes de cada artista e em quantos meses ele apareceu
      </Text>
      {isLoading ? (
        <Skeleton h="320px" borderRadius="8px" />
      ) : itens.length === 0 ? (
        <VazioBlocoMusica texto="Ainda não há dados suficientes." />
      ) : (
        <VStack align="stretch" gap={3}>
          {itens.map((item) => (
            <HStack key={item.artistaUuid} gap={3}>
              <LinkMusica to={gerarRotaArtista(item.nome, item.artistaUuid)}>
                <CapaMusica
                  url={item.artista ? imagemDe(item.artista) : null}
                  alt={item.nome}
                  tipo="artista"
                  boxSize="44px"
                />
              </LinkMusica>
              <VStack align="stretch" gap={1} flex={1} minW={0}>
                <HStack justify="space-between" gap={2}>
                  <Text
                    fontSize="sm"
                    fontWeight="bold"
                    color="cirqueira.musica.textoPrincipal"
                    lineClamp={1}
                  >
                    {item.nome}
                  </Text>
                  <Text
                    fontSize="xs"
                    fontWeight="bold"
                    color="cirqueira.musica.verde"
                    flexShrink={0}
                  >
                    {formatarNumeroPtBr(item.musicasDistintas)} músicas
                  </Text>
                </HStack>
                <BarraProporcaoMusica
                  percentual={proporcao(item.musicasDistintas, maximoMusicas)}
                />
                <HStack gap={2}>
                  <Box flex={1}>
                    <BarraProporcaoMusica
                      percentual={proporcao(item.mesesAtivos, mesesTotais)}
                      cor="cirqueira.musica.amarelo"
                      altura="3px"
                    />
                  </Box>
                  <Text fontSize="2xs" color="cirqueira.musica.textoSecundario" flexShrink={0}>
                    {item.mesesAtivos} de {mesesTotais} meses · {formatarMinutos(item.minutos)}
                  </Text>
                </HStack>
              </VStack>
            </HStack>
          ))}
        </VStack>
      )}
    </CartaoBlocoMusica>
  )
}
