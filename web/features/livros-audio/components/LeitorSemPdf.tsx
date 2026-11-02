import { Button, Center, Flex, Text, VStack } from '@chakra-ui/react'
import { ArrowLeft, Headphones } from 'lucide-react'
import { memo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useBlocosLivroAudio, useSalvarPosicaoLivroAudio } from '../hooks/useLivrosAudio'
import type { LivroAudio } from '../types'
import { AvisoProgressoAudio } from './AvisoProgressoAudio'
import { PlayerAudioLivro } from './PlayerAudioLivro'

interface LeitorSemPdfProps {
  livro: LivroAudio
}

export const LeitorSemPdf = memo(function LeitorSemPdf({ livro }: LeitorSemPdfProps) {
  const navigate = useNavigate()
  const salvarPosicaoMutation = useSalvarPosicaoLivroAudio()
  const { data: blocos = [] } = useBlocosLivroAudio(livro.uuid)
  const [pagina, setPagina] = useState(livro.paginaAtual)

  function salvarPosicao(paginaAtual: number, bloco: number, segundos: number) {
    salvarPosicaoMutation.mutate({
      uuid: livro.uuid,
      posicao: { paginaAtual, blocoAtual: bloco, segundosNoBloco: segundos },
    })
  }

  return (
    <Flex
      direction="column"
      w="full"
      h="100dvh"
      bg="cirqueira.grey.950"
      position="fixed"
      inset={0}
      zIndex={50}
    >
      <Center flex={1} p={6}>
        <VStack gap={3} maxW="md" textAlign="center">
          <Center
            boxSize={14}
            borderRadius="2xl"
            bg="cirqueira.brand.500/15"
            color="cirqueira.brand.400"
          >
            <Headphones size={28} />
          </Center>
          <Text fontSize="lg" fontWeight="bold" color="cirqueira.grey.0">
            {livro.titulo}
          </Text>
          <Text fontSize="xs" color="cirqueira.grey.400">
            As páginas não puderam ser exibidas neste navegador. O áudio continua disponível aqui
            embaixo.
          </Text>
          <Button
            size="sm"
            borderRadius="lg"
            bg="cirqueira.grey.800"
            _hover={{ bg: 'cirqueira.grey.700' }}
            color="cirqueira.grey.0"
            onClick={() => navigate('/livros-audio')}
          >
            <ArrowLeft size={16} style={{ marginRight: '6px' }} />
            Voltar para a biblioteca
          </Button>
        </VStack>
      </Center>

      <AvisoProgressoAudio livro={livro} />

      {blocos.length > 0 && (
        <PlayerAudioLivro
          livro={livro}
          blocos={blocos}
          paginaAtualLeitor={pagina}
          acompanharAudio={false}
          onAlternarAcompanharAudio={() => {}}
          onMudarPaginaLeitor={setPagina}
          onSalvarPosicao={salvarPosicao}
        />
      )}
    </Flex>
  )
})
