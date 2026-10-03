import { Box, HStack, Text, VStack } from '@chakra-ui/react'
import { Code2 } from 'lucide-react'
import { Link, Outlet } from 'react-router-dom'

export function AuthLayout() {
  return (
    <VStack minH="100vh" align="center" justify="center" px={4} py={12} gap={0}>
      <Link to="/" style={{ marginBottom: '2rem' }}>
        <HStack gap={2}>
          <Box
            w={8}
            h={8}
            borderRadius="xl"
            bg="brand.500"
            display="flex"
            alignItems="center"
            justifyContent="center"
            shadow="md"
          >
            <Code2 size={16} color="white" strokeWidth={2.5} />
          </Box>
          <Text as="span" fontFamily="sans-serif" fontWeight="bold" fontSize="xl">
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
