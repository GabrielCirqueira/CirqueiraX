import { Box, Button, Card, HStack, Text } from '@chakra-ui/react'
import {
  DownloadCloud,
  FolderPlus,
  Images,
  RefreshCw,
  Sparkles,
  UploadCloud,
} from 'lucide-react'
import { memo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useSincronizarPasta } from '../hooks/useDashboard'
import type { PastaSync } from '../types'
import { ModalCriarCategoria } from './ModalCriarCategoria'

export interface BarraAcoesRapidasProps {
  pastasSync?: PastaSync[]
  onAtualizarTudo?: () => void
  atualizando?: boolean
}

export const BarraAcoesRapidas = memo(function BarraAcoesRapidas({
  pastasSync = [],
  onAtualizarTudo,
  atualizando = false,
}: BarraAcoesRapidasProps) {
  const navigate = useNavigate()
  const [modalCategoriaAberto, setModalCategoriaAberto] = useState(false)
  const [sincronizandoTudo, setSincronizandoTudo] = useState(false)
  const { mutate: dispararSync } = useSincronizarPasta()

  function handleSyncAll() {
    if (pastasSync.length === 0) {
      onAtualizarTudo?.()
      return
    }

    setSincronizandoTudo(true)
    const promises = pastasSync.map(
      (pasta) =>
        new Promise((resolve) => {
          dispararSync(pasta.id, {
            onSettled: () => resolve(true),
          })
        })
    )

    Promise.all(promises).finally(() => {
      onAtualizarTudo?.()
      setTimeout(() => setSincronizandoTudo(false), 1200)
    })
  }

  return (
    <>
      <Card.Root
        className="smooth-card"
        borderWidth="1px"
        borderColor="border.subtle"
        bg="bg.panel"
        borderRadius="2xl"
        p={4}
        shadow="md"
      >
        <HStack
          justify="space-between"
          align="center"
          flexWrap="wrap"
          gap={3}
        >
          <HStack gap={2.5}>
            <Box
              p={2}
              borderRadius="xl"
              bg="cirqueira.brand.500/12"
              color="cirqueira.brand.400"
              borderWidth="1px"
              borderColor="cirqueira.brand.500/25"
            >
              <Sparkles size={16} />
            </Box>
            <Box>
              <Text fontSize="xs" fontWeight="bold" color="fg" textTransform="uppercase" letterSpacing="wider">
                Ações Rápidas
              </Text>
              <Text fontSize="11px" color="fg.subtle">
                Acesso direto aos fluxos de ingestão e sincronização
              </Text>
            </Box>
          </HStack>

          <HStack gap={2} flexWrap="wrap">
            <Button
              className="btn-tactile"
              size="sm"
              variant="outline"
              borderRadius="xl"
              fontWeight="semibold"
              fontSize="xs"
              borderColor="cirqueira.amber.500/30"
              color="cirqueira.amber.400"
              _hover={{ bg: 'cirqueira.amber.500/10', borderColor: 'cirqueira.amber.500/60' }}
              onClick={() => navigate('/downloads')}
            >
              <DownloadCloud size={14} style={{ marginRight: '6px' }} />
              Baixar Vídeo
            </Button>

            <Button
              className="btn-tactile"
              size="sm"
              variant="outline"
              borderRadius="xl"
              fontWeight="semibold"
              fontSize="xs"
              borderColor="cirqueira.blue.500/30"
              color="cirqueira.blue.400"
              _hover={{ bg: 'cirqueira.blue.500/10', borderColor: 'cirqueira.blue.500/60' }}
              onClick={() => navigate('/prints')}
            >
              <Images size={14} style={{ marginRight: '6px' }} />
              Galeria de Prints
            </Button>

            <Button
              className="btn-tactile"
              size="sm"
              variant="outline"
              borderRadius="xl"
              fontWeight="semibold"
              fontSize="xs"
              borderColor="cirqueira.purple.500/30"
              color="cirqueira.purple.400"
              _hover={{ bg: 'cirqueira.purple.500/10', borderColor: 'cirqueira.purple.500/60' }}
              onClick={() => navigate('/upload-manual')}
            >
              <UploadCloud size={14} style={{ marginRight: '6px' }} />
              Upload Manual
            </Button>

            <Button
              className="btn-tactile"
              size="sm"
              variant="outline"
              borderRadius="xl"
              fontWeight="semibold"
              fontSize="xs"
              borderColor="border.subtle"
              _hover={{ borderColor: 'cirqueira.brand.500/40', bg: 'cirqueira.brand.500/10' }}
              onClick={() => setModalCategoriaAberto(true)}
            >
              <FolderPlus size={14} style={{ marginRight: '6px' }} />
              Nova Categoria
            </Button>

            <Button
              className="btn-tactile"
              size="sm"
              variant="subtle"
              colorPalette="teal"
              borderRadius="xl"
              fontWeight="semibold"
              fontSize="xs"
              disabled={sincronizandoTudo || atualizando}
              onClick={handleSyncAll}
            >
              <RefreshCw
                size={14}
                style={{
                  marginRight: '6px',
                  animation: sincronizandoTudo || atualizando ? 'spin 1s linear infinite' : 'none',
                }}
              />
              {sincronizandoTudo ? 'Sincronizando...' : 'Sincronizar Pastas'}
            </Button>
          </HStack>
        </HStack>
      </Card.Root>

      <ModalCriarCategoria
        aberto={modalCategoriaAberto}
        onFechar={() => setModalCategoriaAberto(false)}
        onSucesso={() => {
          setModalCategoriaAberto(false)
          onAtualizarTudo?.()
        }}
      />
    </>
  )
})
