import { useTheme } from '@/contexts'
import { Box, HStack, Text } from '@/shared/ui/layout'
import { useAuthStore } from '@/stores/useAuthStore'
import { Button, Chip } from '@heroui/react'
import { Code2, LogIn, LogOut, Moon, Sun, User } from 'lucide-react'
import { memo } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'

const navLinks = [
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/downloads', label: 'Downloads' },
  { href: '/upload-manual', label: 'Upload' },
]

interface HeaderProps {
  onAbrirModal: () => void
}

export const Header = memo(function Header({ onAbrirModal }: HeaderProps) {
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
    <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-md">
      <HStack className="max-w-6xl mx-auto px-6 h-14 justify-between">
        <Link to={autenticado ? '/dashboard' : '/login'}>
          <HStack>
            <Box className="size-7 rounded-lg bg-brand-500 flex items-center justify-center">
              <Code2 className="size-4 text-white" strokeWidth={2.5} />
            </Box>
            <Text as="span" className="font-black font-sans text-sm tracking-tight">
              Cirqueira
              <Text as="span" className="text-brand-500">
                X
              </Text>{' '}
              <Text
                as="span"
                className="text-xs font-semibold px-2 py-0.5 rounded-full bg-brand-500/10 text-brand-500 border border-brand-500/20 ml-1"
              >
                Media
              </Text>
            </Text>
          </HStack>
        </Link>

        {autenticado && (
          <nav className="hidden md:flex items-center gap-6 text-sm text-muted">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                to={link.href}
                className={`transition-colors hover:text-foreground ${
                  pathname === link.href ? 'text-brand-400 font-semibold' : ''
                }`}
              >
                {link.label}
              </Link>
            ))}
          </nav>
        )}

        <HStack className="gap-2">
          <Button
            size="sm"
            variant="ghost"
            isIconOnly
            onPress={toggleTheme}
            aria-label="Alternar tema"
          >
            {theme === 'dark' ? <Sun className="size-4" /> : <Moon className="size-4" />}
          </Button>

          {autenticado ? (
            <HStack className="gap-2 items-center">
              <Chip color="success" variant="soft" size="sm">
                <User className="size-3 mr-1" />
                {usuario?.nomeCompleto || usuario?.username || 'Usuário'}
              </Chip>
              <Button
                size="sm"
                variant="ghost"
                isIconOnly
                onPress={handleLogout}
                className="text-zinc-400 hover:text-rose-400"
                aria-label="Sair da conta"
              >
                <LogOut className="size-4" />
              </Button>
            </HStack>
          ) : (
            !isLoginPage && (
              <Link to="/login">
                <Button size="sm" variant="primary">
                  <LogIn className="size-3.5 mr-1" />
                  Entrar
                </Button>
              </Link>
            )
          )}
        </HStack>
      </HStack>
    </header>
  )
})
