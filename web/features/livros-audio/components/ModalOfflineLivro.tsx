import { Box, Center, Dialog, Portal, Spinner } from '@chakra-ui/react'
import { memo, useCallback, useMemo } from 'react'
import { useBlocosLivroAudio, useVozesLivro } from '../hooks/useLivrosAudio'
import type { LivroAudio } from '../types'
import { encontrarBlocoPorPagina } from '../utils/sincronizacao'
import { lerVozSalva } from '../utils/vozSalva'
import { PainelOffline } from './PainelOffline'

interface ModalOfflineLivroProps {
  livro: LivroAudio
  aberto: boolean
  onFechar: () => void
}

export const ModalOfflineLivro = memo(function ModalOfflineLivro({
  livro,
  aberto,
  onFechar,
}: ModalOfflineLivroProps) {
  return (
    <Dialog.Root
      open={aberto}
      onOpenChange={(detalhes) => !detalhes.open && onFechar()}
      placement="center"
    >
      <Portal>
        <Dialog.Backdrop bg="blackAlpha.700" backdropFilter="blur(6px)" />
        <Dialog.Positioner px={3}>
          <Dialog.Content
            bg="cirqueira.grey.950"
            border="1px solid"
            borderColor="cirqueira.grey.800"
            color="cirqueira.grey.0"
            borderRadius="xl"
            p={4}
            maxW="md"
            w="full"
            maxH="90dvh"
            overflowY="auto"
          >
            <Dialog.Title srOnly>Ouvir {livro.titulo} sem internet</Dialog.Title>
            {aberto && <ConteudoModalOffline livro={livro} onFechar={onFechar} />}
          </Dialog.Content>
        </Dialog.Positioner>
      </Portal>
    </Dialog.Root>
  )
})

function ConteudoModalOffline({ livro, onFechar }: { livro: LivroAudio; onFechar: () => void }) {
  const { data: blocos, isLoading: carregandoBlocos } = useBlocosLivroAudio(livro.uuid)
  const { data: vozes = [], isLoading: carregandoVozes } = useVozesLivro(livro.uuid)
  const vozEscolhida = useMemo(() => lerVozSalva(livro.uuid), [livro.uuid])

  const vozDoBloco = useCallback(
    (numeroBloco: number): string | null => {
      const voz = vozes.find((item) => item.id === vozEscolhida)
      if (!voz || voz.principal || !voz.blocosProntos.includes(numeroBloco)) return null
      return voz.id
    },
    [vozes, vozEscolhida]
  )

  const numeroInicial = useMemo(() => {
    if (!blocos?.length) return 1
    if (livro.blocoAtual && blocos.some((bloco) => bloco.numeroBloco === livro.blocoAtual)) {
      return livro.blocoAtual
    }
    return encontrarBlocoPorPagina(blocos, livro.paginaAtual)?.numeroBloco ?? 1
  }, [blocos, livro.blocoAtual, livro.paginaAtual])

  if (carregandoBlocos || carregandoVozes || !blocos) {
    return (
      <Center py={10}>
        <Spinner color="cirqueira.brand.500" />
      </Center>
    )
  }

  return (
    <Box>
      <PainelOffline
        livro={livro}
        blocos={blocos}
        numeroInicial={numeroInicial}
        vozDoBloco={vozDoBloco}
        onFechar={onFechar}
      />
    </Box>
  )
}
