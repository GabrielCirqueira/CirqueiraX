import { Box, Flex, HStack, Link, SimpleGrid, Skeleton, Text, VStack } from '@chakra-ui/react'
import { CalendarCheck, Clock3, Crown, Flame, Headphones, Mic2, Repeat, Trophy } from 'lucide-react'
import { type ReactNode, memo } from 'react'
import { useImagensItensMusica, useRecordesMusica } from '../hooks'
import type { ArtistaAnalise, MusicaAnalise } from '../types'
import {
  formatarDataExtensa,
  formatarNomeMes,
  formatarNumeroPtBr,
  gerarRotaArtista,
  gerarRotaMusica,
} from '../utils'
import { CabecalhoSecaoMusica } from './CabecalhoSecaoMusica'
import { CapaMusica } from './CapaMusica'
import { CartaoMetricaMusica } from './CartaoMetricaMusica'
import { LinkMusica } from './LinkMusica'
import { MinutosMusica } from './MinutosMusica'

export interface SecaoRecordesProps {
  habilitado: boolean
}

export const SecaoRecordes = memo(function SecaoRecordes({ habilitado }: SecaoRecordesProps) {
  const { data, isLoading } = useRecordesMusica(habilitado)
  const itensComImagem = [
    ...(data?.musicaMaisOuvida ? [data.musicaMaisOuvida] : []),
    ...(data?.artistaMaisHoras ? [data.artistaMaisHoras] : []),
    ...(data?.maiorRepeticaoDiaria ? [data.maiorRepeticaoDiaria.musica] : []),
  ]
  const imagemDe = useImagensItensMusica(itensComImagem)

  if (isLoading || !data) {
    return (
      <VStack align="stretch" gap={4}>
        <CabecalhoSecaoMusica titulo="Recordes e Sequências" />
        <SimpleGrid columns={{ base: 2, lg: 4 }} gap={{ base: 2, md: 3 }}>
          {[1, 2, 3, 4].map((indice) => (
            <Skeleton key={indice} h="88px" borderRadius="8px" />
          ))}
        </SimpleGrid>
      </VStack>
    )
  }

  if (data.totais.streams === 0) {
    return null
  }

  const { sequencias, totais } = data

  return (
    <VStack align="stretch" gap={4} w="full">
      <CabecalhoSecaoMusica
        titulo="Recordes e Sequências"
        descricao={`Sua vida na música desde ${formatarDataExtensa(totais.desde)}`}
      />

      <SimpleGrid columns={{ base: 2, lg: 4 }} gap={{ base: 2, md: 3 }}>
        <CartaoMetricaMusica
          icone={Flame}
          cor="cirqueira.musica.verde"
          rotulo="Sequência atual"
          valor={`${sequencias.atual} ${sequencias.atual === 1 ? 'dia' : 'dias'}`}
          detalhe={
            sequencias.atual === 0
              ? 'Ouça algo hoje para começar uma sequência'
              : sequencias.ouviuHoje
                ? 'Seguidos ouvindo, contando hoje'
                : 'Ouça algo hoje para não perder'
          }
        />
        <CartaoMetricaMusica
          icone={Trophy}
          cor="cirqueira.musica.amarelo"
          rotulo="Maior sequência"
          valor={`${sequencias.maior} ${sequencias.maior === 1 ? 'dia' : 'dias'}`}
          detalhe={
            sequencias.inicioMaior
              ? `${formatarDataExtensa(sequencias.inicioMaior)} a ${formatarDataExtensa(sequencias.fimMaior)}`
              : undefined
          }
        />
        <CartaoMetricaMusica
          icone={Clock3}
          cor="cirqueira.musica.azul"
          rotulo="Dia recorde"
          valor={data.diaRecorde ? <MinutosMusica minutos={data.diaRecorde.minutos} /> : '—'}
          detalhe={data.diaRecorde ? `Em ${formatarDataExtensa(data.diaRecorde.data)}` : undefined}
        />
        <CartaoMetricaMusica
          icone={CalendarCheck}
          cor="cirqueira.musica.verde"
          rotulo="Mês recorde"
          valor={data.mesRecorde ? <MinutosMusica minutos={data.mesRecorde.minutos} /> : '—'}
          detalhe={
            data.mesRecorde
              ? `${formatarNomeMes(data.mesRecorde.mes)} de ${data.mesRecorde.ano}`
              : undefined
          }
        />
      </SimpleGrid>

      <SimpleGrid columns={{ base: 1, md: 3 }} gap={3}>
        {data.musicaMaisOuvida && (
          <DestaqueMusica
            icone={Crown}
            rotulo="Música mais ouvida da vida"
            musica={data.musicaMaisOuvida}
            imagemUrl={imagemDe(data.musicaMaisOuvida)}
            valor={`${formatarNumeroPtBr(data.musicaMaisOuvida.streams)} streams`}
          />
        )}
        {data.artistaMaisHoras && (
          <DestaqueArtista
            artista={data.artistaMaisHoras}
            imagemUrl={imagemDe(data.artistaMaisHoras)}
          />
        )}
        {data.maiorRepeticaoDiaria && (
          <DestaqueMusica
            icone={Repeat}
            rotulo="Mais repetida em um dia"
            musica={data.maiorRepeticaoDiaria.musica}
            imagemUrl={imagemDe(data.maiorRepeticaoDiaria.musica)}
            valor={`${data.maiorRepeticaoDiaria.vezes}x em ${formatarDataExtensa(data.maiorRepeticaoDiaria.data)}`}
          />
        )}
      </SimpleGrid>

      <Flex
        gap={{ base: 3, md: 6 }}
        wrap="wrap"
        px={4}
        py={3}
        borderRadius="8px"
        bg="cirqueira.musica.cartao"
        border="1px solid"
        borderColor="cirqueira.musica.cartaoElevado"
      >
        <ResumoVida
          icone={Headphones}
          valor={<MinutosMusica minutos={totais.minutos} />}
          rotulo="ouvidos no total"
        />
        <ResumoVida icone={Repeat} valor={formatarNumeroPtBr(totais.streams)} rotulo="streams" />
        <ResumoVida icone={Mic2} valor={formatarNumeroPtBr(totais.artistas)} rotulo="artistas" />
        <ResumoVida
          icone={CalendarCheck}
          valor={formatarNumeroPtBr(totais.dias)}
          rotulo="dias com música"
        />
      </Flex>
    </VStack>
  )
})

interface DestaqueMusicaProps {
  icone: typeof Crown
  rotulo: string
  musica: MusicaAnalise
  imagemUrl: string | null
  valor: string
}

function DestaqueMusica({ icone: Icone, rotulo, musica, imagemUrl, valor }: DestaqueMusicaProps) {
  return (
    <Link
      asChild
      display="block"
      p={3}
      borderRadius="8px"
      bg="cirqueira.musica.cartao"
      border="1px solid"
      borderColor="cirqueira.musica.cartaoElevado"
      transition="background-color 0.15s ease"
      _focusVisible={{ outline: '2px solid', outlineColor: 'cirqueira.musica.verde' }}
      _hover={{ bg: 'cirqueira.musica.cartaoElevado', textDecoration: 'none' }}
    >
      <LinkMusica to={gerarRotaMusica(musica.nomeFaixa, musica.artista, musica.musicaUuid)}>
        <HStack gap={3}>
          <CapaMusica url={imagemUrl} alt={musica.album} boxSize="64px" />
          <VStack align="flex-start" gap={0.5} minW={0} flex={1}>
            <HStack gap={1.5} color="cirqueira.musica.amarelo">
              <Icone size={12} />
              <Text fontSize="2xs" textTransform="uppercase" fontWeight="bold" letterSpacing="wide">
                {rotulo}
              </Text>
            </HStack>
            <Text
              fontSize="sm"
              fontWeight="bold"
              color="cirqueira.musica.textoPrincipal"
              truncate
              maxW="full"
            >
              {musica.nomeFaixa}
            </Text>
            <Text fontSize="xs" color="cirqueira.musica.textoSecundario" truncate maxW="full">
              {musica.artista}
            </Text>
            <Text fontSize="xs" fontWeight="semibold" color="cirqueira.musica.verde">
              {valor}
            </Text>
          </VStack>
        </HStack>
      </LinkMusica>
    </Link>
  )
}

function DestaqueArtista({
  artista,
  imagemUrl,
}: { artista: ArtistaAnalise; imagemUrl: string | null }) {
  return (
    <Link
      asChild
      display="block"
      p={3}
      borderRadius="8px"
      bg="cirqueira.musica.cartao"
      border="1px solid"
      borderColor="cirqueira.musica.cartaoElevado"
      _hover={{ bg: 'cirqueira.musica.cartaoElevado', textDecoration: 'none' }}
    >
      <LinkMusica to={gerarRotaArtista(artista.nome, artista.artistaUuid)}>
        <HStack gap={3}>
          <CapaMusica url={imagemUrl} alt={artista.nome} tipo="artista" boxSize="64px" />
          <VStack align="flex-start" gap={0.5} minW={0} flex={1}>
            <HStack gap={1.5} color="cirqueira.musica.azul">
              <Mic2 size={12} />
              <Text fontSize="2xs" textTransform="uppercase" fontWeight="bold" letterSpacing="wide">
                Artista mais ouvido
              </Text>
            </HStack>
            <Text
              fontSize="sm"
              fontWeight="bold"
              color="cirqueira.musica.textoPrincipal"
              truncate
              maxW="full"
            >
              {artista.nome}
            </Text>
            <Text fontSize="xs" fontWeight="semibold" color="cirqueira.musica.verde">
              <MinutosMusica minutos={artista.minutos} /> · {formatarNumeroPtBr(artista.streams)}{' '}
              streams
            </Text>
          </VStack>
        </HStack>
      </LinkMusica>
    </Link>
  )
}

function ResumoVida({
  icone: Icone,
  valor,
  rotulo,
}: { icone: typeof Crown; valor: ReactNode; rotulo: string }) {
  return (
    <HStack gap={2} color="cirqueira.musica.textoSecundario">
      <Icone size={14} />
      <Text fontSize="xs">
        <Box as="strong" color="cirqueira.musica.textoPrincipal">
          {valor}
        </Box>{' '}
        {rotulo}
      </Text>
    </HStack>
  )
}
