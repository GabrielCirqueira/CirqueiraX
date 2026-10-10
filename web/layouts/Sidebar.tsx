import { useTheme } from '@/contexts'
import { useAuthStore } from '@/stores/useAuthStore'
import { Badge, Box, Center, Flex, HStack, IconButton, Text, VStack } from '@chakra-ui/react'
import {
  Code2,
  DownloadCloud,
  Images,
  LayoutDashboard,
  LogOut,
  Moon,
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
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/downloads', label: 'Downloads', icon: DownloadCloud },
  { href: '/upload-manual', label: 'Upload Manual', icon: UploadCloud },
  { href: '/google-fotos', label: 'Google Fotos', icon: Images },
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
      bg="cirqueira.grey.950"
      borderRight="1px solid"
      borderColor="cirqueira.grey.900"
      p={4}
    >
      <VStack gap={6} align="stretch" w="full">
        <HStack justify="space-between" align="center" px={2} pt={1}>
          <RouterLink to="/dashboard" onClick={handleItemClick}>
            <HStack gap={3}>
              <Center
                boxSize={8}
                rounded="lg"
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
                    color="cirqueira.grey.0"
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
                    px={1.5}
                    py={0}
                    fontSize="9px"
                    fontWeight="bold"
                    borderRadius="md"
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
              color="cirqueira.grey.400"
              _hover={{ color: 'cirqueira.grey.0', bg: 'cirqueira.grey.900' }}
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
            color="cirqueira.grey.500"
          >
            Navegação
          </Text>

          {navItems.map((item) => {
            const Icone = item.icon
            const ativo =
              pathname === item.href ||
              (item.href !== '/dashboard' && pathname.startsWith(item.href))

            return (
              <Box key={item.href} w="full">
                <RouterLink to={item.href} onClick={handleItemClick} style={{ width: '100%' }}>
                  <HStack
                    w="full"
                    px={3}
                    py={2.5}
                    borderRadius="xl"
                    gap={3}
                    transition="all 0.15s ease"
                    bg={ativo ? 'cirqueira.brand.500/15' : 'transparent'}
                    color={ativo ? 'cirqueira.brand.300' : 'cirqueira.grey.400'}
                    border="1px solid"
                    borderColor={ativo ? 'cirqueira.brand.500/30' : 'transparent'}
                    _hover={{
                      bg: ativo ? 'cirqueira.brand.500/20' : 'cirqueira.grey.900/60',
                      color: ativo ? 'cirqueira.brand.200' : 'cirqueira.grey.0',
                    }}
                  >
                    <Icone size={18} strokeWidth={ativo ? 2.2 : 1.8} />
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
                        bg="cirqueira.brand.400"
                        shadow="0 0 6px var(--chakra-colors-cirqueira-brand-400)"
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
        pt={4}
        borderTop="1px solid"
        borderColor="cirqueira.grey.900"
      >
        <HStack
          p={2.5}
          borderRadius="xl"
          bg="cirqueira.grey.900/40"
          border="1px solid"
          borderColor="cirqueira.grey.800/60"
          justify="space-between"
          align="center"
        >
          <HStack gap={2.5} minW={0}>
            <Center
              boxSize={8}
              rounded="lg"
              bg="cirqueira.brand.500/20"
              color="cirqueira.brand.300"
              flexShrink={0}
            >
              <User size={16} />
            </Center>
            <VStack gap={0} align="flex-start" minW={0}>
              <Text
                fontSize="xs"
                fontWeight="semibold"
                color="cirqueira.grey.0"
                truncate
                maxW="110px"
              >
                {usuario?.nomeCompleto || usuario?.username || 'Usuário'}
              </Text>
              <Text fontSize="10px" color="cirqueira.grey.500" truncate maxW="110px">
                Operador
              </Text>
            </VStack>
          </HStack>

          <HStack gap={1}>
            <IconButton
              size="xs"
              variant="ghost"
              onClick={toggleTheme}
              aria-label="Alternar tema"
              color="cirqueira.grey.400"
              _hover={{ color: 'cirqueira.grey.0', bg: 'cirqueira.grey.800' }}
            >
              {theme === 'dark' ? <Sun size={15} /> : <Moon size={15} />}
            </IconButton>

            <IconButton
              size="xs"
              variant="ghost"
              onClick={handleLogout}
              aria-label="Sair da conta"
              color="cirqueira.grey.400"
              _hover={{ color: 'cirqueira.red.500', bg: 'cirqueira.red.500/10' }}
            >
              <LogOut size={15} />
            </IconButton>
          </HStack>
        </HStack>
      </VStack>
    </Flex>
  )
})
