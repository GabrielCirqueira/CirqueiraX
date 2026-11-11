import { Box, Skeleton, VStack } from '@chakra-ui/react'
import { memo } from 'react'

export const EsqueletoPaginaMusica = memo(function EsqueletoPaginaMusica() {
  return (
    <VStack gap={8} align="stretch" w="full">
      <Skeleton h="80px" borderRadius="8px" />
      <Box display="grid" gridTemplateColumns={{ base: '1fr', lg: '1fr 1fr' }} gap={6}>
        <Skeleton h="260px" borderRadius="8px" />
        <Skeleton h="260px" borderRadius="8px" />
      </Box>
      <Skeleton h="180px" borderRadius="8px" />
      <Skeleton h="40px" w="100%" borderRadius="8px" />
    </VStack>
  )
})
