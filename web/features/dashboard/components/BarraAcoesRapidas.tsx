import { Box, Button, HStack } from '@chakra-ui/react'
import {
  AudioLines,
  Disc3,
  DownloadCloud,
  FolderPlus,
  Images,
  Music,
  RefreshCw,
  UploadCloud,
} from 'lucide-react'
import { memo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useSincronizarPasta } from '../hooks/useDashboard'
import type { PastaSync } from '../types'
import { ModalCriarCategoria } from './ModalCriarCategoria'

const ACOES_NAVEGACAO = [
  { rota: '/downloads', rotulo: 'Baixar vídeo', icone: DownloadCloud, cor: 'cirqueira.brand.400' },
  { rota: '/downloads-mp3', rotulo: 'Downloads MP3', icone: Music, cor: 'cirqueira.purple.400' },
  { rota: '/transcricoes', rotulo: 'Transcrições', icone: AudioLines, cor: 'cirqueira.teal.400' },
  { rota: '/musica', rotulo: 'Música', icone: Disc3, cor: 'cirqueira.green.400' },
  { rota: '/prints', rotulo: 'Prints', icone: Images, cor: 'cirqueira.cyan.400' },
  {
    rota: '/upload-manual',
    rotulo: 'Upload manual',
    icone: UploadCloud,
    cor: 'cirqueira.amber.400',
  },
]

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
      <HStack gap={2} flexWrap="wrap">
        {ACOES_NAVEGACAO.map((acao) => (
          <Button
            key={acao.rota}
            size="sm"
            variant="outline"
            borderRadius="full"
            bg="bg.panel"
            borderColor="border.subtle"
            fontWeight="semibold"
            color="fg.muted"
            transition="all 0.2s ease"
            _hover={{
              bg: 'bg.muted',
              borderColor: 'border.emphasized',
              color: 'fg',
              transform: 'translateY(-1px)',
            }}
            onClick={() => navigate(acao.rota)}
          >
            <Box as="span" color={acao.cor} display="inline-flex">
              <acao.icone size={14} />
            </Box>
            {acao.rotulo}
          </Button>
        ))}

        <Button
          size="sm"
          variant="outline"
          borderRadius="full"
          bg="bg.panel"
          borderColor="border.subtle"
          fontWeight="semibold"
          color="fg.muted"
          _hover={{ bg: 'bg.muted', color: 'fg' }}
          onClick={() => setModalCategoriaAberto(true)}
        >
          <FolderPlus size={14} />
          Nova categoria
        </Button>

        <Button
          size="sm"
          variant="outline"
          borderRadius="full"
          bg="bg.panel"
          borderColor="border.subtle"
          fontWeight="semibold"
          color="fg.muted"
          _hover={{ bg: 'bg.muted', color: 'fg' }}
          disabled={sincronizandoTudo || atualizando}
          onClick={handleSyncAll}
        >
          <RefreshCw
            size={14}
            style={{
              animation: sincronizandoTudo || atualizando ? 'spin 1s linear infinite' : 'none',
            }}
          />
          {sincronizandoTudo ? 'Sincronizando...' : 'Sincronizar pastas'}
        </Button>
      </HStack>

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
