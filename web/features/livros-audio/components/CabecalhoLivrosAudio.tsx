import { useSemConexao } from '@/stores/useConexaoStore'
import { instalarApp, useInstalacaoAppStore } from '@/stores/useInstalacaoAppStore'
import {
  Badge,
  Box,
  Button,
  Center,
  HStack,
  IconButton,
  Stack,
  Text,
  VStack,
} from '@chakra-ui/react'
import { BookOpen, MonitorDown, Plus, RefreshCw } from 'lucide-react'
import { memo } from 'react'
import type { ContagemStatusLivros } from '../utils/livros'

interface CabecalhoLivrosAudioProps {
  contagem: ContagemStatusLivros
  atualizando: boolean
  onAtualizar: () => void
  onNovoLivro: () => void
}

export const CabecalhoLivrosAudio = memo(function CabecalhoLivrosAudio({
  contagem,
  atualizando,
  onAtualizar,
  onNovoLivro,
}: CabecalhoLivrosAudioProps) {
  const semConexao = useSemConexao()
  const podeInstalar = useInstalacaoAppStore(
    (estado) => Boolean(estado.evento) && !estado.instalado
  )

  return (
    <Box
      w="full"
      p={{ base: 4, md: 6 }}
      bg="cirqueira.grey.950"
      border="1px solid"
      borderColor="cirqueira.grey.900"
      borderRadius="2xl"
    >
      <Stack
        justify="space-between"
        align={{ base: 'flex-start', sm: 'center' }}
        direction={{ base: 'column', sm: 'row' }}
        gap={4}
        w="full"
      >
        <HStack gap={3.5} align="center">
          <Center
            boxSize={12}
            borderRadius="xl"
            bg="cirqueira.brand.500/15"
            color="cirqueira.brand.400"
            border="1px solid"
            borderColor="cirqueira.brand.500/30"
            flexShrink={0}
          >
            <BookOpen size={24} />
          </Center>

          <VStack align="flex-start" gap={1}>
            <HStack gap={2} align="center">
              <Text fontSize="lg" fontWeight="bold" color="cirqueira.grey.0" letterSpacing="tight">
                Livros em Áudio
              </Text>
              <Badge size="sm" variant="subtle" colorPalette="brand" borderRadius="md">
                {contagem.total} {contagem.total === 1 ? 'livro' : 'livros'}
              </Badge>
            </HStack>

            <Text fontSize="xs" color="cirqueira.grey.400">
              Biblioteca pessoal de leitura sincronizada e síntese de voz
            </Text>
          </VStack>
        </HStack>

        <HStack gap={2} align="center" w={{ base: 'full', sm: 'auto' }} justify="flex-end">
          <IconButton
            size="sm"
            variant="outline"
            borderRadius="lg"
            borderColor="cirqueira.grey.800"
            color="cirqueira.grey.300"
            _hover={{ color: 'cirqueira.grey.0', bg: 'cirqueira.grey.900' }}
            aria-label="Atualizar biblioteca"
            title="Atualizar biblioteca"
            disabled={atualizando || semConexao}
            onClick={onAtualizar}
          >
            <RefreshCw size={15} className={atualizando ? 'animate-spin' : ''} />
          </IconButton>

          {podeInstalar && (
            <Button
              size="sm"
              variant="outline"
              borderRadius="lg"
              borderColor="cirqueira.brand.500/40"
              color="cirqueira.brand.300"
              _hover={{ bg: 'cirqueira.brand.500/10' }}
              onClick={() => instalarApp()}
              title="Instalar na tela inicial para abrir sem internet"
            >
              <MonitorDown size={15} />
              Instalar app
            </Button>
          )}

          <Button
            size="sm"
            borderRadius="lg"
            bg="cirqueira.brand.500"
            _hover={{ bg: 'cirqueira.brand.600' }}
            color="cirqueira.grey.0"
            px={4}
            disabled={semConexao}
            title={semConexao ? 'Enviar livro precisa de internet' : undefined}
            onClick={onNovoLivro}
          >
            <Plus size={16} style={{ marginRight: '4px' }} />
            Novo Livro
          </Button>
        </HStack>
      </Stack>

      <HStack
        gap={2}
        mt={4}
        pt={4}
        borderTop="1px solid"
        borderColor="cirqueira.grey.900"
        wrap="wrap"
      >
        <Badge size="sm" variant="outline" colorPalette="grey" borderRadius="md" px={2.5} py={0.5}>
          Total: {contagem.total}
        </Badge>
        {contagem.prontos > 0 && (
          <Badge
            size="sm"
            variant="subtle"
            colorPalette="green"
            borderRadius="md"
            px={2.5}
            py={0.5}
          >
            Prontos: {contagem.prontos}
          </Badge>
        )}
        {contagem.emProcessamento > 0 && (
          <Badge
            size="sm"
            variant="subtle"
            colorPalette="brand"
            borderRadius="md"
            px={2.5}
            py={0.5}
          >
            Processando: {contagem.emProcessamento}
          </Badge>
        )}
        {contagem.comErro > 0 && (
          <Badge size="sm" variant="subtle" colorPalette="red" borderRadius="md" px={2.5} py={0.5}>
            Erros: {contagem.comErro}
          </Badge>
        )}
      </HStack>
    </Box>
  )
})
