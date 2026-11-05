import { useSEO } from '@/shared/hooks'
import { Box, VStack } from '@chakra-ui/react'
import { useState } from 'react'
import { CabecalhoLivrosAudio } from './components/CabecalhoLivrosAudio'
import { FaixaConexao } from './components/FaixaConexao'
import { GradeLivrosAudio } from './components/GradeLivrosAudio'
import { ModalUploadLivro } from './components/ModalUploadLivro'
import { PainelFilaGeracao } from './components/PainelFilaGeracao'
import {
  useApagarLivroAudio,
  useEstadoDisco,
  useFilaGeracao,
  useLivrosAudio,
} from './hooks/useLivrosAudio'
import { contarLivrosPorStatus } from './utils/livros'

export function Component() {
  useSEO({
    title: 'Livros em Áudio',
    description: 'Biblioteca pessoal de livros em PDF com áudio e leitura sincronizados.',
    keywords: 'livros, pdf, audiolivros, leitura, cirqueirax',
  })

  const [modalUploadAberto, setModalUploadAberto] = useState(false)

  const { data: livros, isLoading, isFetching, refetch } = useLivrosAudio()
  const apagarMutation = useApagarLivroAudio()
  const contagem = contarLivrosPorStatus(livros)
  const { data: fila } = useFilaGeracao(contagem.emProcessamento > 0)
  const { data: disco } = useEstadoDisco()

  function handleApagarLivro(uuid: string) {
    apagarMutation.mutate(uuid)
  }

  return (
    <Box w="full" maxW="1680px" mx="auto" py={{ base: 4, md: 6 }} px={{ base: 3, md: 6 }}>
      <VStack align="stretch" gap={6} w="full">
        <FaixaConexao />

        <CabecalhoLivrosAudio
          contagem={contagem}
          atualizando={isFetching}
          onAtualizar={() => refetch()}
          onNovoLivro={() => setModalUploadAberto(true)}
        />

        <PainelFilaGeracao fila={fila} disco={disco} />

        <GradeLivrosAudio
          livros={livros}
          fila={fila}
          carregando={isLoading}
          apagandoUuid={apagarMutation.isPending ? (apagarMutation.variables ?? null) : null}
          onNovoLivro={() => setModalUploadAberto(true)}
          onApagarLivro={handleApagarLivro}
        />

        <ModalUploadLivro aberto={modalUploadAberto} onFechar={() => setModalUploadAberto(false)} />
      </VStack>
    </Box>
  )
}

export default Component
