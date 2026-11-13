import { Button, HStack, Text, VStack } from '@chakra-ui/react'
import { memo } from 'react'
import { useDefinirFonteCapturaYoutube } from '../hooks'
import type { FonteCapturaYoutube } from '../types'
import { OPCOES_FONTE_CAPTURA_YOUTUBE, explicarFonteCapturaYoutube } from '../utils'

export interface SeletorFonteCapturaYoutubeProps {
  fonte: FonteCapturaYoutube
}

export const SeletorFonteCapturaYoutube = memo(function SeletorFonteCapturaYoutube({
  fonte,
}: SeletorFonteCapturaYoutubeProps) {
  const definir = useDefinirFonteCapturaYoutube()

  return (
    <VStack
      align="stretch"
      gap={2}
      p={3}
      borderRadius="8px"
      bg="cirqueira.musica.fundo"
      border="1px solid"
      borderColor="cirqueira.musica.cartaoElevado"
    >
      <HStack justify="space-between" gap={3} wrap="wrap">
        <Text fontSize="xs" fontWeight="bold" color="cirqueira.musica.textoPrincipal">
          Fonte ativa
        </Text>
        <HStack
          gap={1}
          p={1}
          borderRadius="full"
          bg="cirqueira.musica.cartao"
          role="radiogroup"
          aria-label="Fonte ativa do YouTube Music"
        >
          {OPCOES_FONTE_CAPTURA_YOUTUBE.map((opcao) => {
            const ativa = opcao.valor === fonte
            return (
              <Button
                key={opcao.valor}
                size="xs"
                h="26px"
                px={3}
                borderRadius="full"
                fontWeight="bold"
                role="radio"
                aria-checked={ativa}
                disabled={definir.isPending}
                bg={ativa ? 'cirqueira.musica.cartaoElevado' : 'transparent'}
                color={ativa ? 'cirqueira.musica.verde' : 'cirqueira.musica.textoSecundario'}
                _hover={{ color: 'cirqueira.musica.textoPrincipal' }}
                onClick={() => !ativa && definir.mutate(opcao.valor)}
              >
                {opcao.rotulo}
              </Button>
            )
          })}
        </HStack>
      </HStack>
      <Text fontSize="2xs" color="cirqueira.musica.textoSecundario">
        {explicarFonteCapturaYoutube(fonte)}
      </Text>
    </VStack>
  )
})
