import { ModalAuth } from '@/features/auth/ModalAuth'
import { Box, Flex } from '@chakra-ui/react'
import { useCallback, useMemo, useState } from 'react'
import { Outlet } from 'react-router-dom'
import { Header } from './Header'
import { Sidebar } from './Sidebar'

export interface MainLayoutProps {
  children?: React.ReactNode
}

export interface MainLayoutContext {
  abrirModal: () => void
}

export function MainLayout() {
  const [modalAberto, setModalAberto] = useState(false)
  const [mobileMenuAberto, setMobileMenuAberto] = useState(false)

  const abrirModal = useCallback(() => setModalAberto(true), [])
  const ctx = useMemo<MainLayoutContext>(() => ({ abrirModal }), [abrirModal])

  return (
    <Flex minH="100vh" bg="cirqueira.grey.950" color="cirqueira.grey.0" position="relative">
      <Box
        as="aside"
        display={{ base: 'none', md: 'block' }}
        w="64"
        flexShrink={0}
        position="sticky"
        top={0}
        h="100vh"
        zIndex={40}
      >
        <Sidebar />
      </Box>

      {mobileMenuAberto && (
        <Box display={{ base: 'block', md: 'none' }} position="fixed" inset={0} zIndex={50}>
          <Box
            position="absolute"
            inset={0}
            bg="cirqueira.grey.950/80"
            backdropFilter="blur(4px)"
            onClick={() => setMobileMenuAberto(false)}
          />
          <Box
            position="absolute"
            top={0}
            left={0}
            bottom={0}
            w="72"
            maxW="85vw"
            bg="cirqueira.grey.950"
            shadow="2xl"
          >
            <Sidebar isMobile onClose={() => setMobileMenuAberto(false)} />
          </Box>
        </Box>
      )}

      <Flex direction="column" flex={1} minW={0} minH="100vh">
        <Header onToggleMobileSidebar={() => setMobileMenuAberto(true)} onAbrirModal={abrirModal} />
        <Box as="main" flex={1} display="flex" flexDirection="column" overflowY="auto">
          <Outlet context={ctx} />
        </Box>
      </Flex>

      {modalAberto && <ModalAuth isOpen={true} onClose={() => setModalAberto(false)} />}
    </Flex>
  )
}
