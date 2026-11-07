import { useTheme } from '@/contexts'
import { useAuthStore } from '@/stores/useAuthStore'
import { Badge, Box, Center, Flex, HStack, IconButton, Text, VStack } from '@chakra-ui/react'
import {
  AudioLines,
  BookOpen,
  Camera,
  Code2,
  DownloadCloud,
  Images,
  Layers,
  LayoutDashboard,
  LogOut,
  Moon,
  Music,
  PenLine,
  Radio,
  ScanText,
  Sun,
  UploadCloud,
  User,
  X,
} from 'lucide-react'
import { memo } from 'react'
import { Link as RouterLink, useLocation, useNavigate } from 'react-router-dom'

interface SidebarProps {
  isMobile?: boolean
  onClose?: () => void
}

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, cor: 'cirqueira.brand.400' },
  { href: '/spotify', label: 'Spotify', icon: Radio, cor: 'cirqueira.spotify.verde' },
  { href: '/central-midias', label: 'Central de Mídias', icon: Layers, cor: 'cirqueira.cyan.300' },
  { href: '/downloads', label: 'Downloads', icon: DownloadCloud, cor: 'cirqueira.blue.400' },
  { href: '/downloads-mp3', label: 'Downloads MP3', icon: Music, cor: 'cirqueira.purple.300' },
  { href: '/livros-audio', label: 'Livros em Áudio', icon: BookOpen, cor: 'cirqueira.emerald.400' },
  { href: '/transcricoes', label: 'Transcrições', icon: AudioLines, cor: 'cirqueira.teal.300' },
  { href: '/prints', label: 'Prints & Capturas', icon: Camera, cor: 'cirqueira.yellow.300' },
  { href: '/editor-imagem', label: 'Editor de Imagem', icon: PenLine, cor: 'cirqueira.rose.400' },
  { href: '/extrair-texto', label: 'Extrair Texto', icon: ScanText, cor: 'cirqueira.purple.400' },
  {
    href: '/upload-manual',
    label: 'Upload Manual',
    icon: UploadCloud,
    cor: 'cirqueira.orange.300',
  },
  { href: '/google-fotos', label: 'Google Fotos', icon: Images, cor: 'cirqueira.blue.300' },
]

export const Sidebar = memo(function Sidebar({ isMobile = false, onClose }: SidebarProps) {
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const usuario = useAuthStore((s) => s.usuario)
  const limparAuth = useAuthStore((s) => s.limpar)
  const { theme, toggleTheme } = useTheme()

  function handleLogout() {
    limparAuth()
    navigate('/login')
  }

  function handleItemClick() {
    if (isMobile && onClose) {
      onClose()
    }
  }

  return (
    <Flex
      direction="column"
      h="100%"
      w="full"
      justify="space-between"
      bg="bg.canvas"
      borderRight="1px solid"
      borderColor="border.subtle"
      p={3.5}
    >
      <VStack gap={5} align="stretch" w="full">
        <HStack justify="space-between" align="center" px={2} pt={1}>
          <RouterLink to="/dashboard" onClick={handleItemClick}>
            <HStack gap={3}>
              <Center
                boxSize={8}
                borderRadius="full"
                bg="cirqueira.brand.500"
                color="cirqueira.grey.0"
                shadow="sm"
              >
                <Code2 size={18} strokeWidth={2.5} />
              </Center>
              <Box>
                <HStack gap={1.5} align="center">
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
                  <Badge
                    size="xs"
                    variant="subtle"
                    colorPalette="brand"
                    px={2}
                    py={0.2}
                    fontSize="9px"
                    fontWeight="bold"
                    borderRadius="full"
                    border="1px solid"
                    borderColor="border.subtle"
                  >
                    Media
                  </Badge>
                </HStack>
              </Box>
            </HStack>
          </RouterLink>

          {isMobile && onClose && (
            <IconButton
              aria-label="Fechar menu"
              variant="ghost"
              size="xs"
              borderRadius="full"
              color="fg.muted"
              _hover={{ color: 'fg', bg: 'bg.muted' }}
              onClick={onClose}
            >
              <X size={18} />
            </IconButton>
          )}
        </HStack>

        <VStack gap={1} align="stretch" w="full">
          <Text
            px={3}
            mb={1}
            fontSize="10px"
            fontWeight="bold"
            textTransform="uppercase"
            letterSpacing="wider"
            color="fg.subtle"
          >
            Navegação
          </Text>

          {navItems.map((item) => {
            const Icone = item.icon
            const ativo =
              pathname === item.href ||
              (item.href !== '/dashboard' && pathname.startsWith(`${item.href}/`))

            return (
              <Box key={item.href} w="full">
                <RouterLink to={item.href} onClick={handleItemClick} style={{ width: '100%' }}>
                  <HStack
                    w="full"
                    px={3}
                    py={2.5}
                    borderRadius="8px"
                    gap={3}
                    transition="all 0.15s ease"
                    bg={ativo ? 'bg.panel' : 'transparent'}
                    color={ativo ? 'fg' : 'fg.muted'}
                    border="1px solid"
                    borderColor={ativo ? 'border.subtle' : 'transparent'}
                    _hover={{
                      bg: ativo ? 'bg.panel' : 'bg.muted',
                      color: 'fg',
                    }}
                  >
                    <Box
                      color={ativo ? item.cor : 'fg.subtle'}
                      display="inline-flex"
                      alignItems="center"
                      transition="color 0.15s ease"
                    >
                      <Icone size={18} strokeWidth={ativo ? 2.2 : 1.8} />
                    </Box>
                    <Text
                      as="span"
                      fontSize="sm"
                      fontWeight={ativo ? 'semibold' : 'medium'}
                      flex={1}
                    >
                      {item.label}
                    </Text>
                    {ativo && (
                      <Box
                        boxSize={1.5}
                        borderRadius="full"
                        bg={item.cor}
                        shadow={`0 0 6px ${item.cor}`}
                      />
                    )}
                  </HStack>
                </RouterLink>
              </Box>
            )
          })}
        </VStack>
      </VStack>

      <VStack
        gap={3}
        align="stretch"
        w="full"
        pt={3}
        borderTop="1px solid"
        borderColor="border.subtle"
      >
        <HStack
          p={2.5}
          borderRadius="8px"
          bg="bg.panel"
          border="1px solid"
          borderColor="border.subtle"
          justify="space-between"
          align="center"
        >
          <HStack gap={2.5} minW={0}>
            <Center
              boxSize={8}
              borderRadius="full"
              bg="brand.subtle"
              color="cirqueira.brand.300"
              flexShrink={0}
            >
              <User size={16} />
            </Center>
            <VStack gap={0} align="flex-start" minW={0}>
              <Text fontSize="xs" fontWeight="semibold" color="fg" truncate maxW="110px">
                {usuario?.nomeCompleto || usuario?.username || 'Usuário'}
              </Text>
              <Text fontSize="10px" color="fg.subtle" truncate maxW="110px">
                Operador
              </Text>
            </VStack>
          </HStack>

          <HStack gap={1}>
            <IconButton
              size="xs"
              variant="ghost"
              borderRadius="full"
              onClick={toggleTheme}
              aria-label="Alternar tema"
              color="fg.muted"
              _hover={{ color: 'fg', bg: 'bg.muted' }}
            >
              {theme === 'dark' ? <Sun size={15} /> : <Moon size={15} />}
            </IconButton>

            <IconButton
              size="xs"
              variant="ghost"
              borderRadius="full"
              onClick={handleLogout}
              aria-label="Sair da conta"
              color="fg.muted"
              _hover={{ color: 'cirqueira.red.400', bg: 'red.subtle' }}
            >
              <LogOut size={15} />
            </IconButton>
          </HStack>
        </HStack>
      </VStack>
    </Flex>
  )
})
