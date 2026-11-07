import { Button, HStack } from '@chakra-ui/react'
import { memo } from 'react'
import type { OpcaoPeriodoAnalise } from '../utils'

export interface SeletorPeriodoAnaliseProps {
  opcoes: OpcaoPeriodoAnalise[]
  selecionada: string
  onSelecionar: (chave: string) => void
}

export const SeletorPeriodoAnalise = memo(function SeletorPeriodoAnalise({
  opcoes,
  selecionada,
  onSelecionar,
}: SeletorPeriodoAnaliseProps) {
  return (
    <HStack
      gap={1}
      bg="cirqueira.spotify.cartao"
      p={1}
      borderRadius="full"
      border="1px solid"
      borderColor="cirqueira.spotify.cartaoElevado"
      w="max-content"
      maxW="full"
      overflowX="auto"
      css={{ scrollbarWidth: 'none', '&::-webkit-scrollbar': { display: 'none' } }}
    >
      {opcoes.map((opcao) => {
        const ativa = opcao.chave === selecionada
        return (
          <Button
            key={opcao.chave}
            size="xs"
            h="28px"
            px={3}
            borderRadius="full"
            fontSize="xs"
            fontWeight="bold"
            flexShrink={0}
            bg={ativa ? 'cirqueira.spotify.cartaoElevado' : 'transparent'}
            color={ativa ? 'cirqueira.spotify.verde' : 'cirqueira.spotify.textoSecundario'}
            _hover={{ color: 'cirqueira.spotify.textoPrincipal' }}
            onClick={() => onSelecionar(opcao.chave)}
          >
            {opcao.rotulo}
          </Button>
        )
      })}
    </HStack>
  )
})
