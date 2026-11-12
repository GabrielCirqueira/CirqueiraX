import { HStack, Link, Text, VStack } from '@chakra-ui/react'
import { type ReactNode, memo } from 'react'
import type { MusicaAnalise } from '../types'
import { formatarNumeroPtBr, gerarRotaMusica } from '../utils'
import { DivisaoFontesMusica } from './DivisaoFontesMusica'
import { GrupoIconesFonte } from './IconeFonteMusica'
import { LinkMusica } from './LinkMusica'

export interface BlocoDetalheProps {
  titulo: string
  children: ReactNode
}

export const BlocoDetalhe = memo(function BlocoDetalhe({ titulo, children }: BlocoDetalheProps) {
  return (
    <VStack
      align="stretch"
      gap={3}
      p={{ base: 3, sm: 5 }}
      borderRadius="8px"
      bg="cirqueira.musica.cartao"
      border="1px solid"
      borderColor="cirqueira.musica.cartaoElevado"
    >
      <Text
        fontSize="xs"
        fontWeight="bold"
        textTransform="uppercase"
        letterSpacing="wide"
        color="cirqueira.musica.verde"
      >
        {titulo}
      </Text>
      {children}
    </VStack>
  )
})

export interface ListaMashupsArtistaProps {
  mashups: MusicaAnalise[]
}

export const ListaMashupsArtista = memo(function ListaMashupsArtista({
  mashups,
}: ListaMashupsArtistaProps) {
  return (
    <VStack align="stretch" gap={1.5}>
      {mashups.map((mashup) => (
        <Link
          key={mashup.musicaUuid ?? mashup.nomeFaixa}
          asChild
          _hover={{ textDecoration: 'none' }}
          display="block"
        >
          <LinkMusica to={gerarRotaMusica(mashup.nomeFaixa, mashup.artista, mashup.musicaUuid)}>
            <HStack gap={2} p={2} borderRadius="6px" bg="cirqueira.musica.cartaoElevado">
              <GrupoIconesFonte fontes={mashup.fontes} />
              <VStack align="start" gap={0} flex={1} minW={0}>
                <Text
                  fontSize="sm"
                  fontWeight="semibold"
                  color="cirqueira.musica.textoPrincipal"
                  truncate
                  maxW="full"
                >
                  {mashup.nomeFaixa}
                </Text>
                <Text fontSize="2xs" color="cirqueira.musica.textoSecundario" truncate maxW="full">
                  {(mashup.artistas ?? [mashup.artista]).join(', ')}
                </Text>
                <DivisaoFontesMusica porFonte={mashup.porFonte} />
              </VStack>
              <Text fontSize="xs" fontWeight="bold" color="cirqueira.musica.verde">
                {formatarNumeroPtBr(mashup.streams)}x
              </Text>
            </HStack>
          </LinkMusica>
        </Link>
      ))}
    </VStack>
  )
})
