import { useTheme } from '@/contexts'
import { useSair } from '@/features/auth/hooks'
import { BotaoNotificacoes } from '@/features/notificacoes'
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
  if (pathname.startsWith('/musica') || pathname.startsWith('/spotify'))
    return 'Música & Cápsula Sonora'
  if (pathname.startsWith('/central-midias') || pathname.startsWith('/todas-midias'))
    return 'Central de Mídias'
  if (pathname.startsWith('/downloads-mp3')) return 'Downloads MP3'
  if (pathname.startsWith('/livros-audio')) return 'Livros em Áudio'
  if (pathname.startsWith('/transcricoes')) return 'Transcrições'
  if (pathname.startsWith('/downloads')) return 'Downloads de Vídeo'
  if (pathname.startsWith('/prints')) return 'Prints & Capturas'
  if (pathname.startsWith('/editor-imagem')) return 'Editor de Imagem'
  if (pathname.startsWith('/extrair-texto')) return 'Extrair Texto'
  if (pathname.startsWith('/upload-manual')) return 'Upload Manual'
  if (pathname.startsWith('/google-fotos')) return 'Google Fotos'
  return 'Dashboard'
}

export const Header = memo(function Header({ onToggleMobileSidebar }: HeaderProps) {
  const autenticado = useAuthStore((s) => s.autenticado)
  const usuario = useAuthStore((s) => s.usuario)
  const sair = useSair()
  const { theme, toggleTheme } = useTheme()
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const isLoginPage = pathname === '/login'
  const titulo = getTituloRota(pathname)

  function handleLogout() {
    sair()
    navigate('/login')
  }

  return (
    <Box
      as="header"
      position="sticky"
      top={0}
      zIndex={30}
      borderBottom="1px solid"
      borderColor="border.subtle"
      bg="bg.canvas"
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
              borderRadius="full"
              color="fg.muted"
              _hover={{ color: 'fg', bg: 'bg.muted' }}
              onClick={onToggleMobileSidebar}
            >
              <Menu size={20} />
            </IconButton>
          )}

          <HStack display={{ base: 'flex', md: 'none' }} gap={2} align="center">
            <RouterLink to={autenticado ? '/dashboard' : '/login'}>
              <HStack gap={1.5}>
                <Center
                  boxSize={7}
                  borderRadius="full"
                  bg="cirqueira.brand.500"
                  color="cirqueira.grey.0"
                >
                  <Code2 size={16} strokeWidth={2.5} />
                </Center>
                <Text
                  as="span"
                  fontWeight="900"
                  fontSize="sm"
                  letterSpacing="tight"
                  fontFamily="heading"
                  color="fg"
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
            <Text fontSize="sm" fontWeight="bold" color="fg" letterSpacing="tight">
              {titulo}
            </Text>
            <HStack
              bg="bg.panel"
              borderWidth="1px"
              borderColor="border.subtle"
              px={2.5}
              py={1}
              borderRadius="full"
              fontSize="xs"
              color="fg.muted"
              alignItems="center"
              gap={1.5}
            >
              <Box w={1.5} h={1.5} borderRadius="full" bg="cirqueira.brand.500" />
              <Text as="span" fontSize="11px" fontWeight="medium">
                Pipeline Ativo
              </Text>
            </HStack>
          </HStack>
        </HStack>

        <HStack gap={2} align="center">
          <IconButton
            size="xs"
            variant="ghost"
            borderRadius="full"
            onClick={toggleTheme}
            aria-label="Alternar tema"
            color="fg.muted"
            _hover={{ color: 'fg', bg: 'bg.muted' }}
          >
            {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
          </IconButton>

          {autenticado && <BotaoNotificacoes />}

          {autenticado ? (
            <HStack gap={2} align="center">
              <HStack
                display={{ base: 'none', sm: 'inline-flex' }}
                bg="bg.panel"
                px={3}
                py={1}
                borderRadius="full"
                fontSize="xs"
                alignItems="center"
                gap={1.5}
                border="1px solid"
                borderColor="border.subtle"
                color="fg"
                fontWeight="medium"
              >
                <Box as="span" color="cirqueira.brand.400" display="inline-flex">
                  <User size={12} />
                </Box>
                <Text as="span">{usuario?.nomeCompleto || usuario?.username || 'Usuário'}</Text>
              </HStack>
              <IconButton
                size="xs"
                variant="ghost"
                borderRadius="full"
                onClick={handleLogout}
                color="fg.muted"
                _hover={{ color: 'cirqueira.red.400', bg: 'red.subtle' }}
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
                  borderRadius="full"
                  px={4}
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
