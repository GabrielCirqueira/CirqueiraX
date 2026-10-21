import { Button, HStack } from '@chakra-ui/react'
import { DownloadCloud, FolderPlus, Images, RefreshCw, UploadCloud } from 'lucide-react'
import { memo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useSincronizarPasta } from '../hooks/useDashboard'
import type { PastaSync } from '../types'
import { ModalCriarCategoria } from './ModalCriarCategoria'

const ACOES_NAVEGACAO = [
  { rota: '/downloads', rotulo: 'Baixar vídeo', icone: DownloadCloud },
  { rota: '/prints', rotulo: 'Prints', icone: Images },
  { rota: '/upload-manual', rotulo: 'Upload manual', icone: UploadCloud },
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
            borderRadius="lg"
            fontWeight="medium"
            color="fg.muted"
            onClick={() => navigate(acao.rota)}
          >
            <acao.icone size={14} />
            {acao.rotulo}
          </Button>
        ))}

        <Button
          size="sm"
          variant="outline"
          borderRadius="lg"
          fontWeight="medium"
          color="fg.muted"
          onClick={() => setModalCategoriaAberto(true)}
        >
          <FolderPlus size={14} />
          Nova categoria
        </Button>

        <Button
          size="sm"
          variant="outline"
          borderRadius="lg"
          fontWeight="medium"
          color="fg.muted"
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
