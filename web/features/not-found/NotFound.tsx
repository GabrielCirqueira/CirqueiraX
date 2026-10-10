import { Button, Text, VStack } from '@chakra-ui/react'
import { MoveLeft } from 'lucide-react'
import { Link } from 'react-router-dom'

export function Component() {
  return (
    <VStack
      flex={1}
      alignItems="center"
      justifyContent="center"
      gap={6}
      px={4}
      textAlign="center"
      py={20}
    >
      <VStack gap={2}>
        <Text
          as="span"
          fontSize="8xl"
          fontWeight="900"
          color="cirqueira.brand.200"
          lineHeight="none"
        >
          404
        </Text>
        <Text as="h1" fontSize="2xl" fontWeight="bold" color="white">
          Página não encontrada
        </Text>
        <Text fontSize="sm" color="cirqueira.grey.600" maxW="sm">
          A rota que você tentou acessar não existe ou foi removida.
        </Text>
      </VStack>

      <Link to="/">
        <Button
          bg="cirqueira.brand.500"
          _hover={{ bg: 'cirqueira.brand.600' }}
          color="cirqueira.grey.0"
          borderRadius="xl"
          px={4}
          py={2}
          fontSize="sm"
          fontWeight="semibold"
          display="flex"
          alignItems="center"
          gap={2}
        >
          <MoveLeft size={16} />
          <Text as="span">Voltar para o início</Text>
        </Button>
      </Link>
    </VStack>
  )
}
