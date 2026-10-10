import { Box, Center, HStack, Text, VStack } from '@chakra-ui/react'
import { Code2 } from 'lucide-react'
import { Link, Outlet } from 'react-router-dom'

export function AuthLayout() {
  return (
    <VStack minH="100vh" align="center" justify="center" px={4} py={12} gap={0}>
      <Link to="/" style={{ marginBottom: '2rem' }}>
        <HStack gap={2}>
          <Center
            boxSize={8}
            rounded="xl"
            bg="cirqueira.brand.500"
            color="cirqueira.grey.0"
            shadow="md"
          >
            <Code2 size={16} color="currentColor" strokeWidth={2.5} />
          </Center>
          <Text as="span" fontFamily="heading" fontWeight="bold" fontSize="xl">
            cirqueiraX
          </Text>
        </HStack>
      </Link>

      <Box w="full" maxW="sm">
        <Outlet />
      </Box>
    </VStack>
  )
}
