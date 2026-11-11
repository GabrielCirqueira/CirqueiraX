import { HStack, SimpleGrid, Text, VStack } from '@chakra-ui/react'
import { memo } from 'react'
import type { FonteReproducao, PorFonteDetalhe } from '../types'
import { formatarDataExtensa, formatarNumeroPtBr, listarFontesDetalhe } from '../utils'
import { IconeFonteMusica } from './IconeFonteMusica'
import { MinutosMusica } from './MinutosMusica'

export interface ResumoPorFonteDetalheProps {
  porFonte: PorFonteDetalhe | undefined
}

export const ResumoPorFonteDetalhe = memo(function ResumoPorFonteDetalhe({
  porFonte,
}: ResumoPorFonteDetalheProps) {
  const fontes = listarFontesDetalhe(porFonte)
  if (fontes.length === 0) return null

  return (
    <SimpleGrid columns={{ base: 1, md: fontes.length }} gap={{ base: 2, md: 3 }}>
      {fontes.map(({ fonte, dados }) => (
        <CartaoFonte key={fonte} fonte={fonte} dados={dados} />
      ))}
    </SimpleGrid>
  )
})

interface CartaoFonteProps {
  fonte: FonteReproducao
  dados: NonNullable<PorFonteDetalhe['spotify']>
}

function CartaoFonte({ fonte, dados }: CartaoFonteProps) {
  return (
    <VStack
      align="stretch"
      gap={1}
      p={3}
      borderRadius="8px"
      bg="cirqueira.musica.cartao"
      border="1px solid"
      borderColor="cirqueira.musica.cartaoElevado"
      fontSize="xs"
    >
      <HStack gap={2}>
        <IconeFonteMusica fonte={fonte} tamanho={16} />
        <Text fontWeight="bold" color="cirqueira.musica.textoPrincipal">
          {formatarNumeroPtBr(dados.streams)} streams ·{' '}
          <MinutosMusica minutos={dados.minutos} estimado={fonte === 'youtube_music'} />
        </Text>
      </HStack>
      <Text color="cirqueira.musica.textoSecundario">
        Primeira vez: {formatarDataExtensa(dados.primeira ?? null)}
      </Text>
      <Text color="cirqueira.musica.textoSecundario">
        Última vez: {formatarDataExtensa(dados.ultima ?? null)}
      </Text>
    </VStack>
  )
}
