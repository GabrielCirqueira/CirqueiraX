import { Button, HStack } from '@chakra-ui/react'
import { memo } from 'react'
import { useAbaMusica } from '../hooks/useAbaMusica'
import { ROTULOS_ABA_MUSICA } from '../utils/abasMusica'

export const AbasMusica = memo(function AbasMusica() {
  const { aba, selecionarAba, disponiveis } = useAbaMusica()

  return (
    <HStack
      role="tablist"
      aria-label="Seções da página de música"
      gap={1}
      bg="cirqueira.musica.cartao"
      p={1}
      borderRadius="full"
      border="1px solid"
      borderColor="cirqueira.musica.cartaoElevado"
      w="full"
      overflowX="auto"
      css={{ scrollbarWidth: 'none', '&::-webkit-scrollbar': { display: 'none' } }}
    >
      {disponiveis.map((chave) => {
        const ativa = chave === aba
        return (
          <Button
            key={chave}
            role="tab"
            aria-selected={ativa}
            size="xs"
            h="30px"
            px={3}
            borderRadius="full"
            fontSize="xs"
            fontWeight="bold"
            flexShrink={0}
            bg={ativa ? 'cirqueira.musica.cartaoElevado' : 'transparent'}
            color={ativa ? 'cirqueira.musica.verde' : 'cirqueira.musica.textoSecundario'}
            transition="background-color 0.3s cubic-bezier(0.22, 1, 0.36, 1), color 0.3s ease, transform 0.15s ease"
            _hover={{ color: 'cirqueira.musica.textoPrincipal' }}
            _active={{ transform: 'scale(0.96)' }}
            onClick={() => selecionarAba(chave)}
          >
            {ROTULOS_ABA_MUSICA[chave]}
          </Button>
        )
      })}
    </HStack>
  )
})
