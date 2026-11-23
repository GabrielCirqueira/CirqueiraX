import {
  Box,
  Button,
  Flex,
  Grid,
  HStack,
  SimpleGrid,
  Skeleton,
  Text,
  VStack,
} from '@chakra-ui/react'
import { CalendarHeart, Disc3, History } from 'lucide-react'
import { memo } from 'react'
import { useBlocoMusica, useImagensItensMusica, useUltimasOuvidasMusica } from '../hooks'
import type { AlbunsSequenciaMusica, NesteDiaMusica } from '../typesBlocos'
import {
  agruparReproducoesPorDia,
  dataIsoNesteDia,
  formatarDataExtensa,
  formatarMinutos,
  formatarNumeroPtBr,
  gerarRotaMusica,
  horaDaReproducao,
  musicasValidas,
} from '../utils'
import { CapaMusica } from './CapaMusica'
import { IconeFonteMusica } from './IconeFonteMusica'
import { LinkMusica } from './LinkMusica'
import { CartaoBlocoMusica, MosaicoCapasMusica, VazioBlocoMusica } from './PecasBlocoMusica'
import { SecaoLinhaDoTempo } from './SecaoLinhaDoTempo'

export const AbaHistorico = memo(function AbaHistorico({
  habilitado,
  onAbrirDia,
}: {
  habilitado: boolean
  onAbrirDia: (data: string) => void
}) {
  return (
    <VStack align="stretch" gap={6}>
      <Grid
        templateColumns={{ base: 'minmax(0, 1fr)', lg: 'minmax(0, 1.5fr) minmax(0, 1fr)' }}
        gap={4}
        alignItems="start"
      >
        <FeedUltimasOuvidas habilitado={habilitado} />
        <VStack align="stretch" gap={4}>
          <BlocoNesteDia habilitado={habilitado} onAbrirDia={onAbrirDia} />
          <BlocoAlbunsSequencia habilitado={habilitado} onAbrirDia={onAbrirDia} />
        </VStack>
      </Grid>
      <SecaoLinhaDoTempo habilitado={habilitado} />
    </VStack>
  )
})

function FeedUltimasOuvidas({ habilitado }: { habilitado: boolean }) {
  const { data, isLoading, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useUltimasOuvidasMusica(habilitado)
  const itens = (data?.pages ?? []).flatMap((pagina) => pagina.itens)
  const grupos = agruparReproducoesPorDia(itens)
  const imagemDe = useImagensItensMusica(musicasValidas(itens.map((item) => item.musica)))

  return (
    <CartaoBlocoMusica
      titulo="Últimas ouvidas"
      descricao="Feed das reproduções recentes, agrupadas por dia. Use “carregar mais” para ir mais longe no passado."
      icone={<History size={14} />}
      cor="cirqueira.musica.azul"
    >
      {isLoading ? (
        <Skeleton h="480px" borderRadius="8px" />
      ) : grupos.length === 0 ? (
        <VazioBlocoMusica texto="Nenhuma reprodução ainda." />
      ) : (
        <VStack align="stretch" gap={5}>
          {grupos.map((grupo) => (
            <VStack key={grupo.data} align="stretch" gap={2}>
              <Flex
                justify="space-between"
                align="baseline"
                position="sticky"
                top={0}
                bg="cirqueira.musica.cartao"
                py={1}
                zIndex={1}
              >
                <Text
                  fontSize="xs"
                  fontWeight="bold"
                  color="cirqueira.musica.textoPrincipal"
                  textTransform="capitalize"
                >
                  {formatarDataExtensa(grupo.data)}
                </Text>
                <Text fontSize="2xs" color="cirqueira.musica.textoSecundario">
                  {grupo.itens.length} faixas · {formatarMinutos(grupo.minutos)}
                </Text>
              </Flex>
              {grupo.itens.map((item) => (
                <LinkMusica
                  key={item.tocadaEmUtc + item.musicaUuid}
                  to={gerarRotaMusica(
                    item.musica?.nomeFaixa ?? '',
                    item.musica?.artista ?? '',
                    item.musicaUuid
                  )}
                >
                  <HStack
                    gap={3}
                    px={1}
                    py={1}
                    borderRadius="6px"
                    _hover={{ bg: 'cirqueira.musica.cartaoElevado' }}
                  >
                    <Text
                      fontSize="2xs"
                      color="cirqueira.musica.textoDesabilitado"
                      w="34px"
                      flexShrink={0}
                      fontVariantNumeric="tabular-nums"
                    >
                      {horaDaReproducao(item.tocadaEm)}
                    </Text>
                    <CapaMusica
                      url={item.musica ? imagemDe(item.musica) : null}
                      alt={item.musica?.nomeFaixa ?? ''}
                      boxSize="40px"
                    />
                    <VStack align="flex-start" gap={0} flex={1} minW={0}>
                      <Text fontSize="sm" color="cirqueira.musica.textoPrincipal" lineClamp={1}>
                        {item.musica?.nomeFaixa ?? 'Música'}
                      </Text>
                      <Text fontSize="2xs" color="cirqueira.musica.textoSecundario" lineClamp={1}>
                        {item.musica?.artista ?? ''}
                      </Text>
                    </VStack>
                    <IconeFonteMusica fonte={item.fonte} tamanho={12} />
                  </HStack>
                </LinkMusica>
              ))}
            </VStack>
          ))}
          {hasNextPage ? (
            <Button
              size="sm"
              variant="ghost"
              color="cirqueira.musica.textoSecundario"
              _hover={{
                bg: 'cirqueira.musica.cartaoElevado',
                color: 'cirqueira.musica.textoPrincipal',
              }}
              loading={isFetchingNextPage}
              onClick={() => fetchNextPage()}
            >
              Carregar mais
            </Button>
          ) : null}
        </VStack>
      )}
    </CartaoBlocoMusica>
  )
}

function BlocoNesteDia({
  habilitado,
  onAbrirDia,
}: { habilitado: boolean; onAbrirDia: (data: string) => void }) {
  const { data, isLoading } = useBlocoMusica<NesteDiaMusica>('neste-dia', habilitado)
  const anos = data?.anos ?? []
  const imagemDe = useImagensItensMusica(anos.flatMap((ano) => ano.musicas))

  return (
    <CartaoBlocoMusica
      titulo={
        data
          ? `Neste dia · ${String(data.dia).padStart(2, '0')}/${String(data.mes).padStart(2, '0')}`
          : 'Neste dia'
      }
      descricao="O que você ouviu nesta mesma data (dia e mês) em anos anteriores. Clique num ano para abrir o dia completo."
      icone={<CalendarHeart size={14} />}
      cor="cirqueira.musica.verde"
    >
      {isLoading || !data ? (
        <Skeleton h="200px" borderRadius="8px" />
      ) : anos.length === 0 ? (
        <VazioBlocoMusica texto="Sem escuta nesta data em outros anos." />
      ) : (
        <VStack align="stretch" gap={2}>
          {anos.map((ano) => (
            <Box
              key={ano.ano}
              as="button"
              textAlign="left"
              p={2}
              borderRadius="8px"
              _hover={{ bg: 'cirqueira.musica.cartaoElevado' }}
              onClick={() => onAbrirDia(dataIsoNesteDia(ano.ano, data.mes, data.dia))}
            >
              <HStack gap={3}>
                <MosaicoCapasMusica musicas={ano.musicas} imagemDe={imagemDe} tamanho="64px" />
                <VStack align="flex-start" gap={0} minW={0} flex={1}>
                  <HStack gap={2}>
                    <Text
                      fontSize="lg"
                      fontWeight="black"
                      color="cirqueira.musica.textoPrincipal"
                      lineHeight="1.1"
                    >
                      {ano.ano}
                    </Text>
                    <Text fontSize="2xs" color="cirqueira.musica.textoSecundario">
                      {formatarMinutos(ano.minutos)} · {formatarNumeroPtBr(ano.streams)} streams
                    </Text>
                  </HStack>
                  <Text fontSize="xs" color="cirqueira.musica.textoPrincipal" lineClamp={1}>
                    {ano.musicas[0]?.nomeFaixa ?? ''}
                  </Text>
                  <Text fontSize="2xs" color="cirqueira.musica.textoSecundario" lineClamp={1}>
                    {ano.musicas[0]?.artista ?? ''}
                  </Text>
                </VStack>
              </HStack>
            </Box>
          ))}
        </VStack>
      )}
    </CartaoBlocoMusica>
  )
}

function BlocoAlbunsSequencia({
  habilitado,
  onAbrirDia,
}: { habilitado: boolean; onAbrirDia: (data: string) => void }) {
  const { data, isLoading } = useBlocoMusica<AlbunsSequenciaMusica>(
    'albuns-sequencia',
    habilitado,
    {
      periodo: 'dias',
      dias: 365,
    }
  )
  const itens = data?.itens ?? []
  const imagemDe = useImagensItensMusica(musicasValidas(itens.map((item) => item.musica)))

  return (
    <CartaoBlocoMusica
      titulo="Álbum em sequência"
      descricao="Dias em que você ouviu 5 ou mais faixas seguidas do mesmo álbum — sessões de “disco inteiro”."
      icone={<Disc3 size={14} />}
    >
      {isLoading ? (
        <Skeleton h="200px" borderRadius="8px" />
      ) : itens.length === 0 ? (
        <VazioBlocoMusica texto="Nenhuma sequência no último ano." />
      ) : (
        <SimpleGrid columns={{ base: 2, sm: 3, lg: 2 }} gap={3}>
          {itens.slice(0, 6).map((item) => (
            <Box
              key={`${item.data}-${item.album}`}
              as="button"
              textAlign="left"
              onClick={() => onAbrirDia(item.data)}
            >
              <Box position="relative">
                <CapaMusica
                  url={item.musica ? imagemDe(item.musica) : null}
                  alt={item.album}
                  tipo="album"
                  w="full"
                  aspectRatio={1}
                  borderRadius="8px"
                  tamanhoIcone={28}
                />
                <Box
                  position="absolute"
                  top={1.5}
                  right={1.5}
                  px={2}
                  borderRadius="full"
                  bg="cirqueira.musica.fundo"
                  color="cirqueira.musica.amarelo"
                  fontSize="2xs"
                  fontWeight="bold"
                >
                  {item.faixas} faixas
                </Box>
              </Box>
              <Text
                fontSize="xs"
                fontWeight="bold"
                color="cirqueira.musica.textoPrincipal"
                mt={1.5}
                lineClamp={1}
              >
                {item.album}
              </Text>
              <Text fontSize="2xs" color="cirqueira.musica.textoSecundario" lineClamp={1}>
                {item.artista} · {formatarDataExtensa(item.data)}
              </Text>
            </Box>
          ))}
        </SimpleGrid>
      )}
    </CartaoBlocoMusica>
  )
}
