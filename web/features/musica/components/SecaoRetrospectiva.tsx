import {
  Badge,
  Box,
  Button,
  Flex,
  Grid,
  HStack,
  Heading,
  Link,
  SimpleGrid,
  Skeleton,
  Text,
  VStack,
} from '@chakra-ui/react'
import {
  CalendarHeart,
  Clock3,
  Disc3,
  Flame,
  Mic2,
  Music2,
  PartyPopper,
  Repeat,
  Sparkles,
} from 'lucide-react'
import { type ReactNode, memo, useState } from 'react'
import { useImagensItensMusica, useRetrospectivaMusica } from '../hooks'
import type { ItemComImagemMusica, RetrospectivaAnual } from '../types'
import {
  NOMES_DIAS_SEMANA_EXTENSO,
  formatarDataExtensa,
  formatarMinutosEmHorasExtenso,
  formatarNomeMes,
  formatarNumeroPtBr,
  formatarPercentualVariacao,
  gerarRotaArtista,
  gerarRotaMusica,
} from '../utils'
import { CabecalhoSecaoMusica } from './CabecalhoSecaoMusica'
import { CapaMusica } from './CapaMusica'
import { GraficoMensalMusica } from './GraficoMensalMusica'
import { LinkMusica } from './LinkMusica'
import { MinutosMusica, TooltipMusica } from './MinutosMusica'

export interface SecaoRetrospectivaProps {
  habilitado: boolean
}

export const SecaoRetrospectiva = memo(function SecaoRetrospectiva({
  habilitado,
}: SecaoRetrospectivaProps) {
  const [ano, setAno] = useState(() => new Date().getFullYear())
  const { data, isLoading } = useRetrospectivaMusica(ano, habilitado)

  return (
    <VStack align="stretch" gap={4} w="full">
      <CabecalhoSecaoMusica
        titulo="Retrospectiva do Ano"
        cor="cirqueira.musica.verde"
        descricao="Seu ano em música, no estilo Wrapped"
        acoes={
          <HStack gap={1} flexWrap="wrap">
            {(data?.anosDisponiveis ?? [ano]).map((opcao) => (
              <Button
                key={opcao}
                size="xs"
                h="28px"
                borderRadius="full"
                fontWeight="bold"
                bg={opcao === ano ? 'cirqueira.musica.verde' : 'cirqueira.musica.cartao'}
                color={
                  opcao === ano ? 'cirqueira.musica.fundo' : 'cirqueira.musica.textoSecundario'
                }
                onClick={() => setAno(opcao)}
              >
                {opcao}
              </Button>
            ))}
          </HStack>
        }
      />
      {isLoading || !data ? (
        <Skeleton h="520px" borderRadius="16px" />
      ) : (
        <ConteudoRetrospectiva dados={data} />
      )}
    </VStack>
  )
})

function ConteudoRetrospectiva({ dados }: { dados: RetrospectivaAnual }) {
  const itens: ItemComImagemMusica[] = [
    ...dados.topArtistas,
    ...dados.topMusicas,
    ...dados.topAlbuns,
    ...(dados.primeiraMusica ? [dados.primeiraMusica] : []),
  ]
  const imagemDe = useImagensItensMusica(itens)

  if (dados.totalStreams === 0) {
    return (
      <Box p={8} borderRadius="16px" bg="cirqueira.musica.cartao" textAlign="center">
        <Text fontSize="sm" color="cirqueira.musica.textoSecundario">
          Nenhuma reprodução registrada em {dados.ano}.
        </Text>
      </Box>
    )
  }

  const artistaDoAno = dados.topArtistas[0]
  const mesMaisIntenso = [...dados.meses].sort((a, b) => b.minutos - a.minutos)[0]
  const diasNoAno = dados.ano % 4 === 0 ? 366 : 365

  return (
    <VStack align="stretch" gap={4}>
      <Box
        position="relative"
        overflow="hidden"
        borderRadius="16px"
        p={{ base: 5, md: 8 }}
        bgGradient="to-br"
        gradientFrom="cirqueira.musica.verde"
        gradientVia="cirqueira.musica.azul"
        gradientTo="cirqueira.musica.fundo"
        color="cirqueira.musica.fundo"
      >
        <Grid
          templateColumns={{ base: '1fr', md: '1.3fr 1fr' }}
          gap={{ base: 6, md: 8 }}
          alignItems="center"
        >
          <VStack align="flex-start" gap={3}>
            <HStack gap={2}>
              <PartyPopper size={18} />
              <Text
                fontSize="xs"
                fontWeight="bold"
                textTransform="uppercase"
                letterSpacing="widest"
              >
                Seu {dados.ano} em música
              </Text>
              {dados.emAndamento && (
                <Badge
                  size="sm"
                  borderRadius="full"
                  bg="cirqueira.musica.fundo"
                  color="cirqueira.musica.verde"
                >
                  em andamento
                </Badge>
              )}
            </HStack>
            <TooltipMusica conteudo={formatarMinutosEmHorasExtenso(dados.totalMinutos)}>
              <Heading
                as="h3"
                fontSize={{ base: '5xl', md: '7xl' }}
                fontWeight="black"
                lineHeight="1"
                letterSpacing="tight"
                cursor="default"
              >
                {formatarNumeroPtBr(Math.round(dados.totalMinutos))}
              </Heading>
            </TooltipMusica>
            <Text fontSize={{ base: 'md', md: 'lg' }} fontWeight="bold">
              minutos ouvidos
            </Text>
            {dados.variacaoMinutosAnoAnterior !== null && (
              <Text fontSize="sm" fontWeight="semibold" opacity={0.85}>
                {formatarPercentualVariacao(dados.variacaoMinutosAnoAnterior)} em relação a{' '}
                {dados.ano - 1}
              </Text>
            )}
            <Flex gap={{ base: 4, md: 6 }} pt={2} wrap="wrap">
              <NumeroHero valor={formatarNumeroPtBr(dados.totalStreams)} rotulo="streams" />
              <NumeroHero valor={formatarNumeroPtBr(dados.artistasDistintos)} rotulo="artistas" />
              <NumeroHero valor={formatarNumeroPtBr(dados.faixasDistintas)} rotulo="músicas" />
              <NumeroHero valor={`${dados.diasOuvindo}/${diasNoAno}`} rotulo="dias com música" />
            </Flex>
          </VStack>

          {artistaDoAno && (
            <Link asChild _hover={{ textDecoration: 'none' }} display="block">
              <LinkMusica to={gerarRotaArtista(artistaDoAno.nome)}>
                <VStack gap={3} align={{ base: 'flex-start', md: 'center' }}>
                  <CapaMusica
                    url={imagemDe(artistaDoAno)}
                    alt={artistaDoAno.nome}
                    tipo="artista"
                    boxSize={{ base: '140px', md: '200px' }}
                    boxShadow="0 20px 50px rgba(0, 0, 0, 0.45)"
                    tamanhoIcone={48}
                  />
                  <VStack gap={0} align={{ base: 'flex-start', md: 'center' }}>
                    <Text
                      fontSize="2xs"
                      fontWeight="bold"
                      textTransform="uppercase"
                      letterSpacing="widest"
                      color="cirqueira.musica.textoPrincipal"
                    >
                      Artista do ano
                    </Text>
                    <Text
                      fontSize={{ base: 'xl', md: '2xl' }}
                      fontWeight="black"
                      color="cirqueira.musica.textoPrincipal"
                      textAlign="center"
                    >
                      {artistaDoAno.nome}
                    </Text>
                    <Text fontSize="sm" color="cirqueira.musica.textoSecundario">
                      <MinutosMusica minutos={artistaDoAno.minutos} /> ·{' '}
                      {formatarNumeroPtBr(artistaDoAno.streams)} streams
                    </Text>
                  </VStack>
                </VStack>
              </LinkMusica>
            </Link>
          )}
        </Grid>
      </Box>

      <SimpleGrid columns={{ base: 1, lg: 3 }} gap={4}>
        <ListaTopo titulo="Top artistas" icone={<Mic2 size={14} />} cor="cirqueira.musica.azul">
          {dados.topArtistas.map((artista, indice) => (
            <ItemTopo
              key={artista.nome}
              posicao={indice + 1}
              rota={gerarRotaArtista(artista.nome)}
              capa={
                <CapaMusica
                  url={imagemDe(artista)}
                  alt={artista.nome}
                  tipo="artista"
                  boxSize="44px"
                />
              }
              titulo={artista.nome}
              subtitulo={
                <>
                  {formatarNumeroPtBr(artista.streams)} streams ·{' '}
                  <MinutosMusica minutos={artista.minutos} />
                </>
              }
            />
          ))}
        </ListaTopo>
        <ListaTopo titulo="Top músicas" icone={<Music2 size={14} />} cor="cirqueira.musica.verde">
          {dados.topMusicas.map((musica, indice) => (
            <ItemTopo
              key={`${musica.nomeFaixa}-${musica.artista}`}
              posicao={indice + 1}
              rota={gerarRotaMusica(musica.nomeFaixa, musica.artista)}
              capa={<CapaMusica url={imagemDe(musica)} alt={musica.album} boxSize="44px" />}
              titulo={musica.nomeFaixa}
              subtitulo={`${musica.artista} · ${musica.streams}x`}
            />
          ))}
        </ListaTopo>
        <ListaTopo titulo="Top álbuns" icone={<Disc3 size={14} />} cor="cirqueira.musica.amarelo">
          {dados.topAlbuns.map((album, indice) => (
            <ItemTopo
              key={`${album.album}-${album.artista}`}
              posicao={indice + 1}
              rota={gerarRotaArtista(album.artista)}
              capa={
                <CapaMusica url={imagemDe(album)} alt={album.album} tipo="album" boxSize="44px" />
              }
              titulo={album.album}
              subtitulo={`${album.artista} · ${album.streams} streams`}
            />
          ))}
        </ListaTopo>
      </SimpleGrid>

      <SimpleGrid columns={{ base: 2, lg: 4 }} gap={{ base: 2, md: 3 }}>
        <CartaoFato
          icone={<CalendarHeart size={16} />}
          cor="cirqueira.musica.verde"
          rotulo="Mês mais intenso"
          valor={
            mesMaisIntenso && mesMaisIntenso.minutos > 0 ? formatarNomeMes(mesMaisIntenso.mes) : '—'
          }
          detalhe={mesMaisIntenso ? <MinutosMusica minutos={mesMaisIntenso.minutos} /> : undefined}
        />
        <CartaoFato
          icone={<Clock3 size={16} />}
          cor="cirqueira.musica.azul"
          rotulo="Momento favorito"
          valor={
            dados.momentoFavorito
              ? `${NOMES_DIAS_SEMANA_EXTENSO[dados.momentoFavorito.diaSemana]}, ${dados.momentoFavorito.hora}h`
              : '—'
          }
          detalhe={dados.momentoFavorito ? 'O dia e a hora em que você mais ouviu' : undefined}
        />
        <CartaoFato
          icone={<Flame size={16} />}
          cor="cirqueira.musica.amarelo"
          rotulo="Maior sequência"
          valor={`${dados.maiorSequencia} dias seguidos`}
          detalhe={
            dados.inicioMaiorSequencia
              ? `${formatarDataExtensa(dados.inicioMaiorSequencia)} a ${formatarDataExtensa(dados.fimMaiorSequencia)}`
              : undefined
          }
        />
        <CartaoFato
          icone={<Sparkles size={16} />}
          cor="cirqueira.musica.verde"
          rotulo="Descobertas"
          valor={`${formatarNumeroPtBr(dados.artistasNovos)} artistas novos`}
          detalhe={`e ${formatarNumeroPtBr(dados.musicasNovas)} músicas que você nunca tinha ouvido`}
        />
        <CartaoFato
          icone={<Clock3 size={16} />}
          cor="cirqueira.musica.azul"
          rotulo="Dia recorde"
          valor={dados.diaRecorde ? <MinutosMusica minutos={dados.diaRecorde.minutos} /> : '—'}
          detalhe={dados.diaRecorde ? formatarDataExtensa(dados.diaRecorde.data) : undefined}
        />
        <CartaoFato
          icone={<Repeat size={16} />}
          cor="cirqueira.musica.amarelo"
          rotulo="Repetição recorde"
          valor={dados.maiorRepeticaoDiaria ? `${dados.maiorRepeticaoDiaria.vezes}x num dia` : '—'}
          detalhe={
            dados.maiorRepeticaoDiaria
              ? `${dados.maiorRepeticaoDiaria.musica.nomeFaixa} · ${formatarDataExtensa(dados.maiorRepeticaoDiaria.data)}`
              : undefined
          }
        />
        <CartaoFato
          icone={<Mic2 size={16} />}
          cor="cirqueira.musica.verde"
          rotulo="Fidelidade"
          valor={`${dados.percentualTopArtistas.toLocaleString('pt-BR')}%`}
          detalhe="do tempo foi para os 5 artistas do topo"
        />
        <CartaoFato
          icone={<Music2 size={16} />}
          cor="cirqueira.musica.azul"
          rotulo="Primeira música do ano"
          valor={dados.primeiraMusica?.nomeFaixa ?? '—'}
          detalhe={dados.primeiraMusica?.artista}
        />
      </SimpleGrid>

      <Box
        p={{ base: 3, sm: 5 }}
        borderRadius="8px"
        bg="cirqueira.musica.cartao"
        border="1px solid"
        borderColor="cirqueira.musica.cartaoElevado"
      >
        <Text fontSize="xs" fontWeight="bold" mb={2} color="cirqueira.musica.textoPrincipal">
          Minutos por mês em {dados.ano}
        </Text>
        <GraficoMensalMusica pontos={dados.meses} destacarUltimo={false} altura="200px" />
      </Box>
    </VStack>
  )
}

function NumeroHero({ valor, rotulo }: { valor: string; rotulo: string }) {
  return (
    <VStack align="flex-start" gap={0}>
      <Text fontSize={{ base: 'xl', md: '2xl' }} fontWeight="black" lineHeight="1.1">
        {valor}
      </Text>
      <Text fontSize="xs" fontWeight="semibold" opacity={0.8}>
        {rotulo}
      </Text>
    </VStack>
  )
}

interface ListaTopoProps {
  titulo: string
  icone: ReactNode
  cor: string
  children: ReactNode
}

function ListaTopo({ titulo, icone, cor, children }: ListaTopoProps) {
  return (
    <VStack
      align="stretch"
      gap={2}
      p={4}
      borderRadius="8px"
      bg="cirqueira.musica.cartao"
      border="1px solid"
      borderColor="cirqueira.musica.cartaoElevado"
    >
      <HStack gap={2} color={cor} mb={1}>
        {icone}
        <Text fontSize="xs" fontWeight="bold" textTransform="uppercase" letterSpacing="wide">
          {titulo}
        </Text>
      </HStack>
      {children}
    </VStack>
  )
}

interface ItemTopoProps {
  posicao: number
  rota: string
  capa: ReactNode
  titulo: string
  subtitulo: ReactNode
}

function ItemTopo({ posicao, rota, capa, titulo, subtitulo }: ItemTopoProps) {
  return (
    <Link asChild _hover={{ textDecoration: 'none' }} display="block">
      <LinkMusica to={rota}>
        <HStack
          gap={3}
          p={1.5}
          borderRadius="6px"
          _hover={{ bg: 'cirqueira.musica.cartaoElevado' }}
        >
          <Text
            w="16px"
            fontSize="sm"
            fontWeight="black"
            color={posicao === 1 ? 'cirqueira.musica.verde' : 'cirqueira.musica.textoDesabilitado'}
          >
            {posicao}
          </Text>
          {capa}
          <VStack align="flex-start" gap={0} minW={0} flex={1}>
            <Text
              fontSize="sm"
              fontWeight="semibold"
              color="cirqueira.musica.textoPrincipal"
              truncate
              maxW="full"
            >
              {titulo}
            </Text>
            <Text fontSize="2xs" color="cirqueira.musica.textoSecundario" truncate maxW="full">
              {subtitulo}
            </Text>
          </VStack>
        </HStack>
      </LinkMusica>
    </Link>
  )
}

interface CartaoFatoProps {
  icone: ReactNode
  cor: string
  rotulo: string
  valor: ReactNode
  detalhe?: ReactNode
}

function CartaoFato({ icone, cor, rotulo, valor, detalhe }: CartaoFatoProps) {
  return (
    <VStack
      align="flex-start"
      gap={1}
      p={4}
      borderRadius="8px"
      bg="cirqueira.musica.cartao"
      border="1px solid"
      borderColor="cirqueira.musica.cartaoElevado"
      position="relative"
      overflow="hidden"
    >
      <Box position="absolute" top={0} left={0} right={0} h="3px" bg={cor} />
      <HStack gap={1.5} color={cor}>
        {icone}
        <Text fontSize="2xs" fontWeight="bold" textTransform="uppercase" letterSpacing="wide">
          {rotulo}
        </Text>
      </HStack>
      <Text fontSize="md" fontWeight="bold" color="cirqueira.musica.textoPrincipal" lineClamp={1}>
        {valor}
      </Text>
      {detalhe && (
        <Text fontSize="xs" color="cirqueira.musica.textoSecundario" lineClamp={2}>
          {detalhe}
        </Text>
      )}
    </VStack>
  )
}
