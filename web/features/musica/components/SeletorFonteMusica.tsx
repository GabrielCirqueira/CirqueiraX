import { Button, HStack } from '@chakra-ui/react'
import { memo } from 'react'
import { useFonteMusica } from '../hooks/useFonteMusica'
import { OPCOES_FONTE_MUSICA } from '../utils'

export const SeletorFonteMusica = memo(function SeletorFonteMusica() {
  const { fonte, selecionarFonte } = useFonteMusica()

  return (
    <HStack
      role="radiogroup"
      aria-label="Fonte das músicas"
      gap={1}
      bg="cirqueira.musica.cartao"
      p={1}
      borderRadius="full"
      border="1px solid"
      borderColor="cirqueira.musica.cartaoElevado"
      w="max-content"
      maxW="full"
      overflowX="auto"
      css={{ scrollbarWidth: 'none', '&::-webkit-scrollbar': { display: 'none' } }}
    >
      {OPCOES_FONTE_MUSICA.map((opcao) => {
        const ativa = opcao.chave === fonte
        return (
          <Button
            key={opcao.chave}
            role="radio"
            aria-checked={ativa}
            size="xs"
            h="28px"
            px={3}
            borderRadius="full"
            fontSize="xs"
            fontWeight="bold"
            flexShrink={0}
            bg={ativa ? 'cirqueira.musica.cartaoElevado' : 'transparent'}
            color={ativa ? 'cirqueira.musica.verde' : 'cirqueira.musica.textoSecundario'}
            _hover={{ color: 'cirqueira.musica.textoPrincipal' }}
            onClick={() => selecionarFonte(opcao.chave)}
          >
            {opcao.rotulo}
          </Button>
        )
      })}
    </HStack>
  )
})
