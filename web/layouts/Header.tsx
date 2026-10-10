import { useTheme } from '@/contexts'
import { useAuthStore } from '@/stores/useAuthStore'
import { Badge, Box, Button, Center, HStack, IconButton, Text } from '@chakra-ui/react'
import { CheckCircle2, Code2, LogIn, LogOut, Menu, Moon, Sun, User } from 'lucide-react'
import { memo } from 'react'
import { Link as RouterLink, useLocation, useNavigate } from 'react-router-dom'

interface HeaderProps {
  onToggleMobileSidebar?: () => void
  onAbrirModal?: () => void
}

function getTituloRota(pathname: string): string {
  if (pathname.startsWith('/downloads')) return 'Downloads de Vídeo'
  if (pathname.startsWith('/upload-manual')) return 'Upload Manual'
  if (pathname.startsWith('/google-fotos')) return 'Google Fotos'
  return 'Dashboard'
}

export const Header = memo(function Header({ onToggleMobileSidebar }: HeaderProps) {
  const autenticado = useAuthStore((s) => s.autenticado)
  const usuario = useAuthStore((s) => s.usuario)
  const limparAuth = useAuthStore((s) => s.limpar)
  const { theme, toggleTheme } = useTheme()
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const isLoginPage = pathname === '/login'
  const titulo = getTituloRota(pathname)

  function handleLogout() {
    limparAuth()
    navigate('/login')
  }

  return (
    <Box
      as="header"
      position="sticky"
      top={0}
      zIndex={30}
      borderBottom="1px solid"
      borderColor="cirqueira.grey.900"
      bg="cirqueira.grey.950/80"
      backdropFilter="blur(12px)"
      w="full"
    >
      <HStack px={{ base: 4, md: 6 }} h={14} justify="space-between" w="full">
        <HStack gap={3} align="center">
          {autenticado && (
            <IconButton
              display={{ base: 'inline-flex', md: 'none' }}
              aria-label="Abrir menu de navegação"
              variant="ghost"
              size="sm"
              color="cirqueira.grey.300"
              _hover={{ color: 'cirqueira.grey.0', bg: 'cirqueira.grey.900' }}
              onClick={onToggleMobileSidebar}
            >
              <Menu size={20} />
            </IconButton>
          )}

          <HStack display={{ base: 'flex', md: 'none' }} gap={2} align="center">
            <RouterLink to={autenticado ? '/dashboard' : '/login'}>
              <HStack gap={1.5}>
                <Center boxSize={7} rounded="lg" bg="cirqueira.brand.500" color="cirqueira.grey.0">
                  <Code2 size={16} strokeWidth={2.5} />
                </Center>
                <Text
                  as="span"
                  fontWeight="900"
                  fontSize="sm"
                  letterSpacing="tight"
                  fontFamily="heading"
                  color="cirqueira.grey.0"
                >
                  Cirqueira
                  <Text as="span" color="cirqueira.brand.400">
                    X
                  </Text>
                </Text>
              </HStack>
            </RouterLink>
          </HStack>

          <HStack display={{ base: 'none', md: 'flex' }} gap={3} align="center">
            <Text fontSize="sm" fontWeight="bold" color="cirqueira.grey.0" letterSpacing="tight">
              {titulo}
            </Text>
            <Badge
              size="sm"
              variant="subtle"
              colorPalette="green"
              display="inline-flex"
              alignItems="center"
              gap={1}
              borderRadius="full"
              px={2}
              py={0.5}
            >
              <CheckCircle2 size={12} />
              <Text as="span" fontSize="10px">
                Pipeline Ativo
              </Text>
            </Badge>
          </HStack>
        </HStack>

        <HStack gap={2} align="center">
          <IconButton
            size="xs"
            variant="ghost"
            onClick={toggleTheme}
            aria-label="Alternar tema"
            color="cirqueira.grey.400"
            _hover={{ color: 'cirqueira.grey.0', bg: 'cirqueira.grey.900' }}
          >
            {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
          </IconButton>

          {autenticado ? (
            <HStack gap={2} align="center">
              <Badge
                display={{ base: 'none', sm: 'inline-flex' }}
                colorPalette="brand"
                variant="subtle"
                px={2.5}
                py={0.5}
                borderRadius="full"
                fontSize="xs"
                alignItems="center"
                gap={1.5}
              >
                <User size={12} />
                {usuario?.nomeCompleto || usuario?.username || 'Usuário'}
              </Badge>
              <IconButton
                size="xs"
                variant="ghost"
                onClick={handleLogout}
                color="cirqueira.grey.400"
                _hover={{ color: 'cirqueira.red.500', bg: 'cirqueira.red.500/10' }}
                aria-label="Sair da conta"
              >
                <LogOut size={16} />
              </IconButton>
            </HStack>
          ) : (
            !isLoginPage && (
              <RouterLink to="/login">
                <Button
                  size="sm"
                  bg="cirqueira.brand.500"
                  _hover={{ bg: 'cirqueira.brand.600' }}
                  color="cirqueira.grey.0"
                  borderRadius="lg"
                  px={3}
                  py={1}
                  fontSize="xs"
                  fontWeight="semibold"
                >
                  <LogIn size={14} style={{ marginRight: '4px' }} />
                  <Text as="span">Entrar</Text>
                </Button>
              </RouterLink>
            )
          )}
        </HStack>
      </HStack>
    </Box>
  )
})
