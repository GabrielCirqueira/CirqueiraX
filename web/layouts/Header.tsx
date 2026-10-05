import { useTheme } from '@/contexts'
import { useAuthStore } from '@/stores/useAuthStore'
import { Badge, Box, Button, Flex, HStack, Text } from '@chakra-ui/react'
import { Code2, LogIn, LogOut, Moon, Sun, User } from 'lucide-react'
import { memo } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'

const navLinks = [
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/downloads', label: 'Downloads' },
  { href: '/upload-manual', label: 'Upload' },
  { href: '/google-fotos', label: 'Google Fotos' },
]

interface HeaderProps {
  onAbrirModal?: () => void
}

export const Header = memo(function Header({ onAbrirModal: _onAbrirModal }: HeaderProps) {
  const autenticado = useAuthStore((s) => s.autenticado)
  const usuario = useAuthStore((s) => s.usuario)
  const limparAuth = useAuthStore((s) => s.limpar)
  const { theme, toggleTheme } = useTheme()
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const isLoginPage = pathname === '/login'

  function handleLogout() {
    limparAuth()
    navigate('/login')
  }

  return (
    <Box
      as="header"
      position="sticky"
      top={0}
      zIndex={50}
      borderBottom="1px solid"
      borderColor="whiteAlpha.200"
      bg="zinc.950/80"
      backdropFilter="blur(12px)"
    >
      <HStack maxW="6xl" mx="auto" px={6} h={14} justify="space-between">
        <Box as={Link} to={autenticado ? '/dashboard' : '/login'}>
          <HStack gap={2}>
            <Box
              w={7}
              h={7}
              borderRadius="lg"
              bg="brand.500"
              display="flex"
              alignItems="center"
              justifyContent="center"
            >
              <Code2 size={16} color="white" strokeWidth={2.5} />
            </Box>
            <Text as="span" fontWeight="900" fontSize="sm" letterSpacing="tight">
              Cirqueira
              <Text as="span" color="brand.500">
                X
              </Text>{' '}
              <Text
                as="span"
                fontSize="xs"
                fontWeight="semibold"
                px={2}
                py={0.5}
                borderRadius="full"
                bg="brand.500/10"
                color="brand.500"
                border="1px solid"
                borderColor="brand.500/20"
                ml={1}
              >
                Media
              </Text>
            </Text>
          </HStack>
        </Box>

        {autenticado && (
          <Flex
            display={{ base: 'none', md: 'flex' }}
            alignItems="center"
            gap={6}
            fontSize="sm"
            color="zinc.400"
          >
            {navLinks.map((link) => (
              <Box
                as={Link}
                key={link.href}
                to={link.href}
                color={pathname === link.href ? 'brand.400' : 'inherit'}
                fontWeight={pathname === link.href ? 'semibold' : 'normal'}
                transition="color 0.2s"
                _hover={{ color: 'fg' }}
              >
                {link.label}
              </Box>
            ))}
          </Flex>
        )}

        <HStack gap={2}>
          <Button
            size="xs"
            variant="ghost"
            onClick={toggleTheme}
            aria-label="Alternar tema"
            p={1.5}
          >
            {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
          </Button>

          {autenticado ? (
            <HStack gap={2} alignItems="center">
              <Badge
                colorPalette="green"
                variant="subtle"
                px={2}
                py={0.5}
                borderRadius="full"
                fontSize="xs"
                display="flex"
                alignItems="center"
              >
                <User size={12} style={{ marginRight: '4px' }} />
                {usuario?.nomeCompleto || usuario?.username || 'Usuário'}
              </Badge>
              <Button
                size="xs"
                variant="ghost"
                onClick={handleLogout}
                color="zinc.400"
                _hover={{ color: 'rose.400' }}
                p={1.5}
                aria-label="Sair da conta"
              >
                <LogOut size={16} />
              </Button>
            </HStack>
          ) : (
            !isLoginPage && (
              <Box as={Link} to="/login">
                <Button
                  size="sm"
                  bg="brand.500"
                  _hover={{ bg: 'brand.600' }}
                  color="white"
                  borderRadius="lg"
                  px={3}
                  py={1}
                  fontSize="xs"
                  fontWeight="semibold"
                >
                  <LogIn size={14} style={{ marginRight: '4px' }} />
                  <Text as="span">Entrar</Text>
                </Button>
              </Box>
            )
          )}
        </HStack>
      </HStack>
    </Box>
  )
})
