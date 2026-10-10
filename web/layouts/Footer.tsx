import { Box, Center, Flex, HStack, Link, Text } from '@chakra-ui/react'
import { Code2, Github } from 'lucide-react'
import { memo } from 'react'
import { Link as RouterLink } from 'react-router-dom'

const footerLinks = [
  { href: '/#showcase', label: 'Componentes' },
  { href: '/#stack', label: 'Stack' },
  { href: '/#steps', label: 'Como funciona' },
]

export const Footer = memo(function Footer() {
  return (
    <Box as="footer" borderTop="1px solid" borderColor="whiteAlpha.200" bg="zinc.950">
      <HStack maxW="6xl" mx="auto" px={6} h={16} justify="space-between" flexWrap="wrap">
        <RouterLink to="/">
          <HStack gap={2}>
            <Center boxSize={6} rounded="md" bg="cirqueira.brand.500" color="cirqueira.grey.0">
              <Code2 size={14} color="currentColor" strokeWidth={2.5} />
            </Center>
            <Text
              as="span"
              fontWeight="900"
              fontSize="xs"
              letterSpacing="tight"
              fontFamily="heading"
            >
              cirqueiraX{' '}
              <Text as="span" color="cirqueira.brand.700">
                Skeleton
              </Text>
            </Text>
          </HStack>
        </RouterLink>

        <Flex
          display={{ base: 'none', sm: 'flex' }}
          alignItems="center"
          gap={5}
          fontSize="xs"
          color="cirqueira.grey.600"
        >
          {footerLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              color="inherit"
              transition="color 0.2s"
              _hover={{ color: 'cirqueira.grey.900' }}
            >
              {link.label}
            </Link>
          ))}
        </Flex>

        <HStack gap={3} fontSize="xs" color="cirqueira.grey.600">
          <Text as="span">MIT License</Text>
          <Link
            href="https://github.com"
            target="_blank"
            rel="noreferrer"
            aria-label="GitHub"
            color="inherit"
            _hover={{ color: 'cirqueira.grey.900' }}
          >
            <Github size={16} />
          </Link>
        </HStack>
      </HStack>
    </Box>
  )
})
