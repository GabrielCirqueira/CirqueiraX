import { Box, Center, HStack, Image, SimpleGrid, Text, VStack } from '@chakra-ui/react'
import type { LucideIcon } from 'lucide-react'
import { Music2 } from 'lucide-react'
import type { ReactNode } from 'react'
import { formatarNumeroResumo } from '../utils/formatarResumoUsuario'

export function SecaoResumo({
  titulo,
  icone: Icone,
  acao,
  children,
}: {
  titulo: string
  icone: LucideIcon
  acao?: ReactNode
  children: ReactNode
}) {
  return (
    <VStack align="stretch" gap={3}>
      <HStack justify="space-between" gap={2} flexWrap="wrap">
        <HStack gap={2} color="fg.subtle">
          <Icone size={14} />
          <Text fontSize="xs" fontWeight="bold" textTransform="uppercase" letterSpacing="wide">
            {titulo}
          </Text>
        </HStack>
        {acao}
      </HStack>
      {children}
    </VStack>
  )
}

export function GradeResumo({ children }: { children: ReactNode }) {
  return (
    <SimpleGrid columns={{ base: 2, md: 3 }} gap={2.5}>
      {children}
    </SimpleGrid>
  )
}

export function CartaoIndicador({
  rotulo,
  valor,
  detalhe,
  icone: Icone,
  destaque,
}: {
  rotulo: string
  valor: string
  detalhe?: string
  icone?: LucideIcon
  destaque?: boolean
}) {
  return (
    <VStack
      align="start"
      gap={1}
      p={3}
      minW={0}
      borderRadius="lg"
      borderWidth="1px"
      borderColor={destaque ? 'cirqueira.brand.500/40' : 'border.subtle'}
      bg={destaque ? 'cirqueira.brand.500/10' : 'bg.muted'}
    >
      <HStack gap={1.5} color="fg.muted" minW={0} w="full">
        {Icone && <Icone size={13} style={{ flexShrink: 0 }} />}
        <Text fontSize="xs" truncate>
          {rotulo}
        </Text>
      </HStack>
      <Text
        fontSize={{ base: 'lg', md: 'xl' }}
        fontWeight="black"
        color="fg"
        lineHeight="1.1"
        truncate
        w="full"
      >
        {valor}
      </Text>
      {detalhe && (
        <Text fontSize="11px" color="fg.subtle" lineClamp={2}>
          {detalhe}
        </Text>
      )}
    </VStack>
  )
}

export interface ItemTopoResumo {
  chave: string
  titulo: string
  subtitulo?: string
  imagemUrl: string | null
  streams: number
}

export function ListaTopoResumo({
  titulo,
  itens,
  redondo,
}: {
  titulo: string
  itens: ItemTopoResumo[]
  redondo?: boolean
}) {
  return (
    <VStack
      align="stretch"
      gap={1}
      p={3}
      minW={0}
      borderRadius="lg"
      borderWidth="1px"
      borderColor="border.subtle"
      bg="bg.muted"
    >
      <Text fontSize="xs" fontWeight="semibold" color="fg.muted" mb={1}>
        {titulo}
      </Text>
      {itens.length === 0 ? (
        <Text fontSize="sm" color="fg.subtle" py={2}>
          Nada ouvido ainda.
        </Text>
      ) : (
        itens.map((item, indice) => (
          <HStack key={item.chave} gap={2.5} py={1} minW={0}>
            <Text w="14px" fontSize="xs" fontWeight="bold" color="fg.subtle" flexShrink={0}>
              {indice + 1}
            </Text>
            {item.imagemUrl ? (
              <Image
                src={item.imagemUrl}
                alt=""
                boxSize="34px"
                borderRadius={redondo ? 'full' : 'md'}
                objectFit="cover"
                flexShrink={0}
                loading="lazy"
              />
            ) : (
              <Center
                boxSize="34px"
                borderRadius={redondo ? 'full' : 'md'}
                bg="bg.panel"
                color="fg.subtle"
                flexShrink={0}
              >
                <Music2 size={14} />
              </Center>
            )}
            <Box minW={0} flex={1}>
              <Text fontSize="sm" fontWeight="semibold" color="fg" truncate>
                {item.titulo}
              </Text>
              {item.subtitulo && (
                <Text fontSize="xs" color="fg.muted" truncate>
                  {item.subtitulo}
                </Text>
              )}
            </Box>
            <Text fontSize="xs" color="fg.muted" flexShrink={0}>
              {formatarNumeroResumo(item.streams)}
            </Text>
          </HStack>
        ))
      )}
    </VStack>
  )
}

export function BarraFontesMusica({
  spotify,
  youtubeMusic,
}: {
  spotify: number
  youtubeMusic: number
}) {
  const total = spotify + youtubeMusic
  if (total === 0) return null
  const percentualSpotify = Math.round((spotify / total) * 100)

  return (
    <VStack align="stretch" gap={1.5}>
      <HStack h="8px" borderRadius="full" overflow="hidden" gap={0} bg="bg.muted">
        <Box h="full" w={`${percentualSpotify}%`} bg="cirqueira.musica.fonteSpotify" />
        <Box h="full" flex={1} bg="cirqueira.musica.fonteYoutubeMusic" />
      </HStack>
      <HStack justify="space-between" fontSize="xs" color="fg.muted" gap={2} flexWrap="wrap">
        <HStack gap={1.5}>
          <Box boxSize="8px" borderRadius="full" bg="cirqueira.musica.fonteSpotify" />
          <Text>Spotify {percentualSpotify}%</Text>
        </HStack>
        <HStack gap={1.5}>
          <Box boxSize="8px" borderRadius="full" bg="cirqueira.musica.fonteYoutubeMusic" />
          <Text>YouTube Music {100 - percentualSpotify}%</Text>
        </HStack>
      </HStack>
    </VStack>
  )
}
