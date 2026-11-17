import { Box, SimpleGrid, Text, VStack } from '@chakra-ui/react'
import { memo } from 'react'
import { Link as RouterLink } from 'react-router-dom'
import type { AtalhoOperador } from '../utils/atalhosOperador'

export interface AtalhosOperadorProps {
  atalhos: AtalhoOperador[]
}

export const AtalhosOperador = memo(function AtalhosOperador({ atalhos }: AtalhosOperadorProps) {
  if (atalhos.length === 0) {
    return (
      <Box
        p={5}
        borderRadius="xl"
        borderWidth="1px"
        borderColor="border.subtle"
        bg="bg.panel"
      >
        <Text fontSize="sm" color="fg.muted">
          Nenhuma funcionalidade liberada ainda. Peça ao administrador para ajustar suas permissões.
        </Text>
      </Box>
    )
  }

  return (
    <SimpleGrid columns={{ base: 1, sm: 2, lg: 3 }} gap={3}>
      {atalhos.map((atalho) => {
        const Icone = atalho.icone
        return (
          <Box
            key={atalho.rota}
            as={RouterLink}
            to={atalho.rota}
            p={4}
            borderRadius="xl"
            borderWidth="1px"
            borderColor="border.subtle"
            bg="bg.panel"
            transition="all 0.15s ease"
            _hover={{
              borderColor: 'border.emphasized',
              bg: 'bg.muted',
              transform: 'translateY(-1px)',
            }}
          >
            <VStack align="start" gap={3}>
              <Box
                boxSize={9}
                borderRadius="lg"
                display="inline-flex"
                alignItems="center"
                justifyContent="center"
                bg="bg.muted"
                color={atalho.cor}
              >
                <Icone size={18} />
              </Box>
              <VStack align="start" gap={0}>
                <Text fontWeight="semibold" color="fg">
                  {atalho.rotulo}
                </Text>
                <Text fontSize="xs" color="fg.muted">
                  {atalho.descricao}
                </Text>
              </VStack>
            </VStack>
          </Box>
        )
      })}
    </SimpleGrid>
  )
})
