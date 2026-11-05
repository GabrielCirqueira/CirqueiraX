import { useMediaQuery } from '@/shared/hooks/useMediaQuery'
import {
  Accordion,
  Alert,
  Box,
  Button,
  Center,
  Dialog,
  Drawer,
  HStack,
  Heading,
  Portal,
  Progress,
  Separator,
  Spinner,
  Text,
  VStack,
} from '@chakra-ui/react'
import {
  AlertCircle,
  Archive,
  ArrowRight,
  CheckCircle2,
  FileCheck2,
  HelpCircle,
  Info,
  ShieldCheck,
  UploadCloud,
  X,
} from 'lucide-react'
import { type ChangeEvent, type DragEvent, type FormEvent, memo, useRef, useState } from 'react'
import { useConsultarImportacaoSpotify, useIniciarImportacaoSpotify } from '../hooks'

export interface ModalUploadHistoricoSpotifyProps {
  aberto: boolean
  onFechar: () => void
}

export const ModalUploadHistoricoSpotify = memo(function ModalUploadHistoricoSpotify({
  aberto,
  onFechar,
}: ModalUploadHistoricoSpotifyProps) {
  const isDesktop = useMediaQuery('(min-width: 768px)')
  const [arquivo, setArquivo] = useState<File | null>(null)
  const [arrastando, setArrastando] = useState(false)
  const [uuidImportacao, setUuidImportacao] = useState<string | null>(null)
  const inputArquivoRef = useRef<HTMLInputElement | null>(null)

  const iniciarImportacao = useIniciarImportacaoSpotify()
  const { data: importacao } = useConsultarImportacaoSpotify(uuidImportacao)

  function limparFormulario() {
    setArquivo(null)
    setArrastando(false)
    setUuidImportacao(null)
    if (inputArquivoRef.current) {
      inputArquivoRef.current.value = ''
    }
  }

  function handleFechar() {
    limparFormulario()
    onFechar()
  }

  function selecionarArquivo(file: File | undefined | null) {
    if (!file) return
    const nomeMinusculo = file.name.toLowerCase()
    const isValido =
      nomeMinusculo.endsWith('.zip') ||
      nomeMinusculo.endsWith('.json') ||
      file.type === 'application/zip' ||
      file.type === 'application/x-zip-compressed' ||
      file.type === 'application/json'

    if (!isValido) {
      return
    }
    setArquivo(file)
  }

  function handleFileChange(e: ChangeEvent<HTMLInputElement>) {
    selecionarArquivo(e.target.files?.[0])
  }

  function handleDragOver(e: DragEvent<HTMLDivElement>) {
    e.preventDefault()
    setArrastando(true)
  }

  function handleDragLeave(e: DragEvent<HTMLDivElement>) {
    e.preventDefault()
    setArrastando(false)
  }

  function handleDrop(e: DragEvent<HTMLDivElement>) {
    e.preventDefault()
    setArrastando(false)
    selecionarArquivo(e.dataTransfer.files?.[0])
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!arquivo) return

    iniciarImportacao.mutate(arquivo, {
      onSuccess: (resultado) => {
        setUuidImportacao(resultado.uuid)
      },
    })
  }

  const isProcessando =
    iniciarImportacao.isPending ||
    importacao?.status === 'enviada' ||
    importacao?.status === 'processando'
  const isConcluida = importacao?.status === 'concluida'
  const isErro = importacao?.status === 'erro'

  const renderConteudo = () => (
    <VStack gap={5} align="stretch">
      {!isConcluida && !isErro && (
        <form
          onSubmit={handleSubmit}
          style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}
        >
          <Box
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => {
              if (!isProcessando) inputArquivoRef.current?.click()
            }}
            cursor={isProcessando ? 'not-allowed' : 'pointer'}
            p={6}
            border="2px dashed"
            borderColor={arrastando ? 'cirqueira.spotify.verde' : 'cirqueira.spotify.cartaoElevado'}
            bg={arrastando ? 'rgba(30, 215, 96, 0.08)' : 'cirqueira.spotify.cartaoElevado'}
            borderRadius="8px"
            textAlign="center"
            transition="all 0.2s ease"
            _hover={
              isProcessando
                ? undefined
                : {
                    borderColor: 'cirqueira.spotify.verde',
                    bg: 'rgba(30, 215, 96, 0.05)',
                  }
            }
          >
            <input
              ref={inputArquivoRef}
              type="file"
              accept=".zip,.json,application/zip,application/json"
              style={{ display: 'none' }}
              onChange={handleFileChange}
              disabled={isProcessando}
            />

            <VStack gap={2}>
              <Center
                boxSize={12}
                borderRadius="full"
                bg="cirqueira.spotify.cartao"
                color={arquivo ? 'cirqueira.spotify.verde' : 'cirqueira.spotify.textoSecundario'}
              >
                <UploadCloud size={24} />
              </Center>

              {arquivo ? (
                <VStack gap={0.5}>
                  <Text fontSize="sm" fontWeight="bold" color="cirqueira.spotify.textoPrincipal">
                    {arquivo.name}
                  </Text>
                  <Text fontSize="xs" color="cirqueira.spotify.textoSecundario">
                    {(arquivo.size / (1024 * 1024)).toFixed(2)} MB • Clique para trocar
                  </Text>
                </VStack>
              ) : (
                <VStack gap={0.5}>
                  <Text fontSize="sm" fontWeight="bold" color="cirqueira.spotify.textoPrincipal">
                    Arraste seu arquivo ZIP ou JSON aqui
                  </Text>
                  <Text fontSize="xs" color="cirqueira.spotify.textoSecundario">
                    Arquivos do Spotify: StreamingHistory*.json ou ZIP completo
                  </Text>
                </VStack>
              )}
            </VStack>
          </Box>

          {isProcessando && (
            <VStack
              gap={2}
              align="stretch"
              p={4}
              bg="cirqueira.spotify.cartaoElevado"
              borderRadius="8px"
            >
              <HStack justify="space-between">
                <HStack gap={2}>
                  <Spinner size="xs" color="cirqueira.spotify.verde" />
                  <Text
                    fontSize="xs"
                    fontWeight="semibold"
                    color="cirqueira.spotify.textoPrincipal"
                  >
                    {iniciarImportacao.isPending
                      ? 'Enviando arquivo...'
                      : 'Processando histórico em segundo plano...'}
                  </Text>
                </HStack>
                <Text fontSize="2xs" color="cirqueira.spotify.textoSecundario">
                  Não feche a aba
                </Text>
              </HStack>
              <Progress.Root value={null} size="xs" colorPalette="green">
                <Progress.Track bg="cirqueira.spotify.cartao">
                  <Progress.Range bg="cirqueira.spotify.verde" />
                </Progress.Track>
              </Progress.Root>
            </VStack>
          )}

          {!isProcessando && (
            <Button
              type="submit"
              bg="cirqueira.spotify.verde"
              color="#000000"
              borderRadius="full"
              fontWeight="bold"
              fontSize="sm"
              _hover={{ bg: '#22e368', transform: 'scale(1.02)' }}
              _active={{ transform: 'scale(0.98)' }}
              transition="all 0.15s ease"
              disabled={!arquivo}
              loading={iniciarImportacao.isPending}
              h="42px"
            >
              Iniciar importação
            </Button>
          )}
        </form>
      )}

      {isConcluida && importacao && (
        <VStack
          gap={4}
          p={5}
          borderRadius="8px"
          bg="rgba(30, 215, 96, 0.1)"
          border="1px solid"
          borderColor="rgba(30, 215, 96, 0.3)"
          align="stretch"
        >
          <HStack gap={3}>
            <Center boxSize={10} borderRadius="full" bg="cirqueira.spotify.verde" color="#000000">
              <CheckCircle2 size={20} />
            </Center>
            <VStack align="flex-start" gap={0}>
              <Heading
                as="h3"
                fontSize="md"
                fontWeight="bold"
                color="cirqueira.spotify.textoPrincipal"
              >
                Importação concluída com sucesso!
              </Heading>
              <Text fontSize="xs" color="cirqueira.spotify.textoSecundario">
                Seus dados e cápsulas mensais já foram atualizados.
              </Text>
            </VStack>
          </HStack>

          <Box display="grid" gridTemplateColumns="repeat(2, 1fr)" gap={3} pt={2}>
            <Box
              p={3}
              bg="cirqueira.spotify.cartao"
              borderRadius="6px"
              border="1px solid"
              borderColor="cirqueira.spotify.cartaoElevado"
            >
              <Text
                fontSize="2xs"
                color="cirqueira.spotify.textoSecundario"
                textTransform="uppercase"
              >
                Total de reproduções
              </Text>
              <Text fontSize="lg" fontWeight="bold" color="cirqueira.spotify.textoPrincipal">
                {importacao.totalLidos.toLocaleString('pt-BR')}
              </Text>
            </Box>

            <Box
              p={3}
              bg="cirqueira.spotify.cartao"
              borderRadius="6px"
              border="1px solid"
              borderColor="cirqueira.spotify.cartaoElevado"
            >
              <Text
                fontSize="2xs"
                color="cirqueira.spotify.textoSecundario"
                textTransform="uppercase"
              >
                Novas adicionadas
              </Text>
              <Text fontSize="lg" fontWeight="bold" color="cirqueira.spotify.verde">
                +{importacao.totalNovos.toLocaleString('pt-BR')}
              </Text>
            </Box>

            <Box
              p={3}
              bg="cirqueira.spotify.cartao"
              borderRadius="6px"
              border="1px solid"
              borderColor="cirqueira.spotify.cartaoElevado"
            >
              <Text
                fontSize="2xs"
                color="cirqueira.spotify.textoSecundario"
                textTransform="uppercase"
              >
                Substituídas / Refinadas
              </Text>
              <Text fontSize="lg" fontWeight="bold" color="cirqueira.spotify.azul">
                {importacao.totalSubstituidos.toLocaleString('pt-BR')}
              </Text>
            </Box>

            <Box
              p={3}
              bg="cirqueira.spotify.cartao"
              borderRadius="6px"
              border="1px solid"
              borderColor="cirqueira.spotify.cartaoElevado"
            >
              <Text
                fontSize="2xs"
                color="cirqueira.spotify.textoSecundario"
                textTransform="uppercase"
              >
                Ignoradas / Repetidas
              </Text>
              <Text fontSize="lg" fontWeight="bold" color="cirqueira.spotify.textoDesabilitado">
                {importacao.totalIgnorados.toLocaleString('pt-BR')}
              </Text>
            </Box>
          </Box>

          <Button
            w="full"
            borderRadius="full"
            bg="cirqueira.spotify.verde"
            color="#000000"
            fontWeight="bold"
            fontSize="sm"
            mt={2}
            onClick={handleFechar}
          >
            Fechar
          </Button>
        </VStack>
      )}

      {isErro && importacao && (
        <VStack
          gap={4}
          p={5}
          borderRadius="8px"
          bg="rgba(239, 68, 68, 0.1)"
          border="1px solid"
          borderColor="rgba(239, 68, 68, 0.3)"
          align="stretch"
        >
          <HStack gap={3}>
            <Center boxSize={10} borderRadius="full" bg="red.500" color="#FFFFFF">
              <AlertCircle size={20} />
            </Center>
            <VStack align="flex-start" gap={0}>
              <Heading
                as="h3"
                fontSize="md"
                fontWeight="bold"
                color="cirqueira.spotify.textoPrincipal"
              >
                Falha no processamento
              </Heading>
              <Text fontSize="xs" color="red.300">
                {importacao.erroMotivo ?? 'Ocorreu um erro ao processar o arquivo enviado.'}
              </Text>
            </VStack>
          </HStack>

          <Button
            w="full"
            borderRadius="full"
            variant="outline"
            borderColor="cirqueira.spotify.cartaoElevado"
            color="cirqueira.spotify.textoPrincipal"
            _hover={{ bg: 'cirqueira.spotify.cartaoElevado' }}
            fontSize="sm"
            onClick={limparFormulario}
          >
            Tentar com outro arquivo
          </Button>
        </VStack>
      )}

      <VStack
        gap={3}
        align="stretch"
        pt={2}
        borderTop="1px solid"
        borderColor="cirqueira.spotify.cartaoElevado"
      >
        <HStack gap={2} color="cirqueira.spotify.verde">
          <ShieldCheck size={16} />
          <Text fontSize="xs" fontWeight="bold" color="cirqueira.spotify.textoPrincipal">
            Aviso de privacidade e dados
          </Text>
        </HStack>
        <Text fontSize="xs" color="cirqueira.spotify.textoSecundario" lineHeight="tall">
          O arquivo ZIP exportado pelo Spotify pode conter dados cadastrais e outros registros. O
          CirqueiraX processa exclusivamente as reproduções de áudio (`StreamingHistory*.json` e
          `Audio_*.json`), descartando imediatamente qualquer outro dado.
        </Text>

        <Box
          p={3}
          borderRadius="6px"
          bg="cirqueira.spotify.cartaoElevado"
          borderLeft="3px solid"
          borderColor="cirqueira.spotify.amarelo"
        >
          <Text fontSize="xs" color="cirqueira.spotify.textoPrincipal" lineHeight="tall">
            <strong>Deduplicação garantida:</strong> Você pode enviar o mesmo arquivo ou arquivos de
            períodos sobrepostos quantas vezes quiser. Reproduções já registradas não serão
            duplicadas.
          </Text>
        </Box>

        <Accordion.Root collapsible defaultValue={[]}>
          <Accordion.Item
            value="instrucoes"
            border="none"
            bg="cirqueira.spotify.cartaoElevado"
            borderRadius="8px"
            px={3}
          >
            <Accordion.ItemTrigger py={2.5}>
              <HStack gap={2} flex={1} color="cirqueira.spotify.textoSecundario" fontSize="xs">
                <HelpCircle size={14} color="var(--chakra-colors-cirqueira-spotify-verde)" />
                <Text as="span" fontWeight="semibold" color="cirqueira.spotify.textoPrincipal">
                  Como solicitar seus arquivos no Spotify?
                </Text>
              </HStack>
            </Accordion.ItemTrigger>
            <Accordion.ItemContent pb={3} pt={1}>
              <VStack
                align="flex-start"
                gap={2}
                fontSize="xs"
                color="cirqueira.spotify.textoSecundario"
                lineHeight="tall"
              >
                <Text>
                  1. Acesse sua conta no Spotify e vá em <strong>Privacidade da conta</strong>.
                </Text>
                <Text>
                  2. Escolha <strong>Dados da conta</strong> (histórico do último ano, entregue em
                  cerca de 5 dias) ou <strong>Histórico ampliado de streams</strong> (todo o
                  histórico desde a criação da conta, em até 30 dias).
                </Text>
                <Text>
                  3. As <em>Informações técnicas de registro</em> não são necessárias.
                </Text>
                <Text color="cirqueira.spotify.textoDesabilitado">
                  Nota: O intervalo de dias entre a solicitação do arquivo e a conexão da API só é
                  preenchido em uma importação posterior.
                </Text>
              </VStack>
            </Accordion.ItemContent>
          </Accordion.Item>
        </Accordion.Root>
      </VStack>
    </VStack>
  )

  if (!isDesktop) {
    return (
      <Drawer.Root
        open={aberto}
        onOpenChange={(detalhes) => !detalhes.open && handleFechar()}
        placement="bottom"
      >
        <Portal>
          <Drawer.Backdrop bg="rgba(0, 0, 0, 0.8)" backdropFilter="blur(4px)" />
          <Drawer.Positioner>
            <Drawer.Content
              bg="cirqueira.spotify.cartao"
              borderTop="1px solid"
              borderColor="cirqueira.spotify.cartaoElevado"
              borderTopRadius="16px"
              p={5}
              maxH="85vh"
              overflowY="auto"
              color="cirqueira.spotify.textoPrincipal"
            >
              <Drawer.Header
                p={0}
                mb={4}
                display="flex"
                alignItems="center"
                justifyContent="space-between"
              >
                <HStack gap={3}>
                  <Box
                    p={2}
                    borderRadius="full"
                    bg="rgba(30, 215, 96, 0.15)"
                    color="cirqueira.spotify.verde"
                    display="inline-flex"
                  >
                    <Archive size={20} />
                  </Box>
                  <Drawer.Title fontSize="md" fontWeight="bold">
                    Importar histórico do Spotify
                  </Drawer.Title>
                </HStack>

                <Drawer.CloseTrigger asChild>
                  <Button
                    size="xs"
                    variant="ghost"
                    borderRadius="full"
                    color="cirqueira.spotify.textoSecundario"
                    _hover={{
                      color: 'cirqueira.spotify.textoPrincipal',
                      bg: 'cirqueira.spotify.cartaoElevado',
                    }}
                    onClick={handleFechar}
                  >
                    <X size={16} />
                  </Button>
                </Drawer.CloseTrigger>
              </Drawer.Header>

              <Drawer.Body p={0}>{renderConteudo()}</Drawer.Body>
            </Drawer.Content>
          </Drawer.Positioner>
        </Portal>
      </Drawer.Root>
    )
  }

  return (
    <Dialog.Root open={aberto} onOpenChange={(detalhes) => !detalhes.open && handleFechar()}>
      <Portal>
        <Dialog.Backdrop bg="rgba(0, 0, 0, 0.8)" backdropFilter="blur(4px)" />
        <Dialog.Positioner>
          <Dialog.Content
            bg="cirqueira.spotify.cartao"
            border="1px solid"
            borderColor="cirqueira.spotify.cartaoElevado"
            borderRadius="8px"
            p={6}
            maxW="xl"
            w="full"
            color="cirqueira.spotify.textoPrincipal"
            boxShadow="0 20px 40px rgba(0, 0, 0, 0.6)"
          >
            <Dialog.Header
              p={0}
              mb={4}
              display="flex"
              alignItems="center"
              justifyContent="space-between"
            >
              <HStack gap={3}>
                <Box
                  p={2}
                  borderRadius="full"
                  bg="rgba(30, 215, 96, 0.15)"
                  color="cirqueira.spotify.verde"
                  display="inline-flex"
                >
                  <Archive size={20} />
                </Box>
                <Dialog.Title fontSize="lg" fontWeight="bold">
                  Importar histórico do Spotify
                </Dialog.Title>
              </HStack>

              <Dialog.CloseTrigger asChild>
                <Button
                  size="xs"
                  variant="ghost"
                  borderRadius="full"
                  color="cirqueira.spotify.textoSecundario"
                  _hover={{
                    color: 'cirqueira.spotify.textoPrincipal',
                    bg: 'cirqueira.spotify.cartaoElevado',
                  }}
                  onClick={handleFechar}
                >
                  <X size={16} />
                </Button>
              </Dialog.CloseTrigger>
            </Dialog.Header>

            <Dialog.Body p={0}>{renderConteudo()}</Dialog.Body>
          </Dialog.Content>
        </Dialog.Positioner>
      </Portal>
    </Dialog.Root>
  )
})
