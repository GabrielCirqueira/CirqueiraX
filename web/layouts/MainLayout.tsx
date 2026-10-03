import { ModalAuth } from '@/features/auth/ModalAuth'
import { Box, Flex } from '@chakra-ui/react'
import { useCallback, useMemo, useState } from 'react'
import { Outlet } from 'react-router-dom'
import { Footer } from './Footer'
import { Header } from './Header'

export interface MainLayoutProps {
  children?: React.ReactNode
}

export interface MainLayoutContext {
  abrirModal: () => void
}

export function MainLayout() {
  const [modalAberto, setModalAberto] = useState(false)
  const abrirModal = useCallback(() => setModalAberto(true), [])
  const ctx = useMemo<MainLayoutContext>(() => ({ abrirModal }), [abrirModal])

  return (
    <Flex direction="column" minH="100vh" gap={0} bg="zinc.950" color="white">
      <Header onAbrirModal={abrirModal} />
      <Box as="main" flex={1} display="flex" flexDirection="column">
        <Outlet context={ctx} />
      </Box>
      <Footer />
      {modalAberto && <ModalAuth isOpen={true} onClose={() => setModalAberto(false)} />}
    </Flex>
  )
}
