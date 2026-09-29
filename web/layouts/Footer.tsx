import { Box, Flex, HStack, Text } from '@chakra-ui/react'
import { Code2, Github } from 'lucide-react'
import { memo } from 'react'
import { Link } from 'react-router-dom'

const footerLinks = [
  { href: '/#showcase', label: 'Componentes' },
  { href: '/#stack', label: 'Stack' },
  { href: '/#steps', label: 'Como funciona' },
]

export const Footer = memo(function Footer() {
  return (
    <Box as="footer" borderTop="1px solid" borderColor="whiteAlpha.200" bg="zinc.950">
      <HStack maxW="6xl" mx="auto" px={6} h={16} justify="space-between" flexWrap="wrap">
        <Link to="/">
          <HStack gap={2}>
            <Box w={6} h={6} borderRadius="md" bg="brand.500" display="flex" alignItems="center" justifyContent="center">
              <Code2 size={14} color="white" strokeWidth={2.5} />
            </Box>
            <Text as="span" fontWeight="900" fontSize="xs" letterSpacing="tight">
              cirqueiraX{' '}
              <Text as="span" color="brand.500">
                Skeleton
              </Text>
            </Text>
          </HStack>
        </Link>

        <Flex display={{ base: 'none', sm: 'flex' }} alignItems="center" gap={5} fontSize="xs" color="zinc.400">
          {footerLinks.map((link) => (
            <a key={link.href} href={link.href} style={{ color: 'inherit', transition: 'color 0.2s' }}>
              {link.label}
            </a>
          ))}
        </Flex>

        <HStack gap={3} fontSize="xs" color="zinc.400">
          <Text as="span">MIT License</Text>
          <a
            href="https://github.com"
            target="_blank"
            rel="noreferrer"
            aria-label="GitHub"
            style={{ color: 'inherit' }}
          >
            <Github size={16} />
          </a>
        </HStack>
      </HStack>
    </Box>
  )
})
