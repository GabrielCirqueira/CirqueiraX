import { useMediaQuery } from '@/shared/hooks/useMediaQuery'
import {
  Accordion,
  Box,
  Button,
  CloseButton,
  Dialog,
  Drawer,
  HStack,
  Portal,
  Progress,
  Spinner,
  Text,
  VStack,
} from '@chakra-ui/react'
import { AlertCircle, ShieldCheck, UploadCloud } from 'lucide-react'
import { type ChangeEvent, type DragEvent, type ReactNode, memo, useRef, useState } from 'react'
import { useImportacaoYoutube, useIniciarImportacaoYoutube } from '../hooks'
import {
  AVISO_PRIVACIDADE_TAKEOUT,
  INSTRUCOES_TAKEOUT,
  isArquivoTakeoutValido,
  passoDaImportacao,
  percentualClassificacao,
} from '../utils'
import { ConfirmacaoCustoImportacaoYoutube } from './ConfirmacaoCustoImportacaoYoutube'
import { EtapasImportacaoYoutube } from './EtapasImportacaoYoutube'
import { RelatorioImportacaoYoutube } from './RelatorioImportacaoYoutube'

const TITULO_MODAL = 'Importar histórico do YouTube Music'

export interface ModalImportarTakeoutYoutubeProps {
  aberto: boolean
  onFechar: () => void
}

export const ModalImportarTakeoutYoutube = memo(function ModalImportarTakeoutYoutube({
  aberto,
  onFechar,
}: ModalImportarTakeoutYoutubeProps) {
  const isDesktop = useMediaQuery('(min-width: 768px)')
  const [arquivo, setArquivo] = useState<File | null>(null)
  const [arrastando, setArrastando] = useState(false)
  const [uuidImportacao, setUuidImportacao] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement | null>(null)

  const iniciar = useIniciarImportacaoYoutube()
  const { data: importacao } = useImportacaoYoutube(uuidImportacao)
  const passo = passoDaImportacao(importacao)

  function handleFechar() {
    setArquivo(null)
    setArrastando(false)
    setUuidImportacao(null)
    onFechar()
  }

  function selecionarArquivo(selecionado: File | undefined | null) {
    if (selecionado && isArquivoTakeoutValido(selecionado)) setArquivo(selecionado)
  }

  function handleDrop(evento: DragEvent<HTMLDivElement>) {
    evento.preventDefault()
    setArrastando(false)
    selecionarArquivo(evento.dataTransfer.files?.[0])
  }

  function handleEnviar() {
    if (!arquivo) return
    iniciar.mutate(arquivo, { onSuccess: (resultado) => setUuidImportacao(resultado.uuid) })
  }

  const formulario = (
    <VStack align="stretch" gap={4}>
      <Accordion.Root collapsible multiple>
        {INSTRUCOES_TAKEOUT.map((instrucao) => (
          <Accordion.Item
            key={instrucao.titulo}
            value={instrucao.titulo}
            borderColor="cirqueira.musica.cartaoElevado"
          >
            <Accordion.ItemTrigger fontSize="sm" color="cirqueira.musica.textoPrincipal" py={2}>
              {instrucao.titulo}
              <Accordion.ItemIndicator />
            </Accordion.ItemTrigger>
            <Accordion.ItemContent>
              <Accordion.ItemBody fontSize="xs" color="cirqueira.musica.textoSecundario" pt={0}>
                {instrucao.texto}
              </Accordion.ItemBody>
            </Accordion.ItemContent>
          </Accordion.Item>
        ))}
      </Accordion.Root>

      <Box
        onDragOver={(evento: DragEvent<HTMLDivElement>) => {
          evento.preventDefault()
          setArrastando(true)
        }}
        onDragLeave={() => setArrastando(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        onKeyDown={(evento) => {
          if (evento.key === 'Enter' || evento.key === ' ') inputRef.current?.click()
        }}
        role="button"
        tabIndex={0}
        aria-label="Escolher arquivo do Google Takeout"
        cursor="pointer"
        p={6}
        border="2px dashed"
        borderColor={arrastando ? 'cirqueira.musica.verde' : 'cirqueira.musica.cartaoElevado'}
        bg="cirqueira.musica.cartaoElevado"
        borderRadius="8px"
        textAlign="center"
      >
        <VStack gap={2}>
          <UploadCloud size={28} />
          <Text fontSize="sm" fontWeight="bold">
            {arquivo ? arquivo.name : 'Solte o .zip ou o .json aqui'}
          </Text>
          <Text fontSize="xs" color="cirqueira.musica.textoSecundario">
            ou clique para escolher
          </Text>
        </VStack>
        <input
          ref={inputRef}
          type="file"
          accept=".zip,.json,application/zip,application/json"
          hidden
          onChange={(evento: ChangeEvent<HTMLInputElement>) =>
            selecionarArquivo(evento.target.files?.[0])
          }
        />
      </Box>

      <HStack gap={2} align="start" fontSize="xs" color="cirqueira.musica.textoSecundario">
        <ShieldCheck size={14} />
        <Text>{AVISO_PRIVACIDADE_TAKEOUT}</Text>
      </HStack>

      <Button
        alignSelf="flex-end"
        borderRadius="full"
        fontWeight="bold"
        bg="cirqueira.musica.verde"
        color="cirqueira.grey.950"
        _hover={{ bg: 'cirqueira.musica.verdeHover' }}
        disabled={!arquivo}
        loading={iniciar.isPending}
        onClick={handleEnviar}
      >
        Enviar
      </Button>
    </VStack>
  )

  const acompanhamento: ReactNode = importacao && (
    <VStack align="stretch" gap={5}>
      <EtapasImportacaoYoutube passo={passo} />
      {passo === 'lendo' && (
        <HStack gap={3}>
          <Spinner size="sm" color="cirqueira.musica.verde" />
          <Text fontSize="sm" color="cirqueira.musica.textoSecundario">
            {importacao.etapaDescricao} · {importacao.leitura.totalLidos.toLocaleString('pt-BR')}{' '}
            lidas
          </Text>
        </HStack>
      )}
      {passo === 'confirmacao' && <ConfirmacaoCustoImportacaoYoutube importacao={importacao} />}
      {passo === 'classificando' && (
        <VStack align="stretch" gap={2}>
          <Text fontSize="sm" color="cirqueira.musica.textoSecundario">
            {importacao.etapaDescricao}
          </Text>
          <Progress.Root value={percentualClassificacao(importacao)} colorPalette="green" size="sm">
            <Progress.Track bg="cirqueira.musica.cartaoElevado">
              <Progress.Range />
            </Progress.Track>
          </Progress.Root>
        </VStack>
      )}
      {passo === 'concluida' && <RelatorioImportacaoYoutube importacao={importacao} />}
      {passo === 'erro' && (
        <HStack gap={2} align="start" color="cirqueira.red.300" fontSize="sm" role="alert">
          <AlertCircle size={16} />
          <Text>{importacao.erroMotivo ?? 'A importação falhou.'}</Text>
        </HStack>
      )}
      {(passo === 'concluida' || passo === 'erro') && (
        <Button alignSelf="flex-end" borderRadius="full" variant="outline" onClick={handleFechar}>
          Fechar
        </Button>
      )}
    </VStack>
  )

  const conteudo = uuidImportacao ? acompanhamento : formulario

  if (!isDesktop) {
    return (
      <Drawer.Root open={aberto} onOpenChange={(d) => !d.open && handleFechar()} placement="bottom">
        <Portal>
          <Drawer.Backdrop />
          <Drawer.Positioner>
            <Drawer.Content
              bg="cirqueira.musica.cartao"
              color="cirqueira.musica.textoPrincipal"
              borderTopRadius="16px"
              maxH="90vh"
            >
              <Drawer.Header>
                <Drawer.Title>{TITULO_MODAL}</Drawer.Title>
              </Drawer.Header>
              <Drawer.Body pb={8} overflowY="auto">
                {conteudo}
              </Drawer.Body>
              <Drawer.CloseTrigger asChild>
                <CloseButton size="sm" color="cirqueira.musica.textoSecundario" />
              </Drawer.CloseTrigger>
            </Drawer.Content>
          </Drawer.Positioner>
        </Portal>
      </Drawer.Root>
    )
  }

  return (
    <Dialog.Root open={aberto} onOpenChange={(d) => !d.open && handleFechar()} size="lg">
      <Portal>
        <Dialog.Backdrop bg="rgba(0, 0, 0, 0.8)" />
        <Dialog.Positioner>
          <Dialog.Content
            bg="cirqueira.musica.cartao"
            color="cirqueira.musica.textoPrincipal"
            borderRadius="8px"
            border="1px solid"
            borderColor="cirqueira.musica.cartaoElevado"
          >
            <Dialog.Header>
              <Dialog.Title>{TITULO_MODAL}</Dialog.Title>
            </Dialog.Header>
            <Dialog.Body pb={6}>{conteudo}</Dialog.Body>
            <Dialog.CloseTrigger asChild>
              <CloseButton size="sm" color="cirqueira.musica.textoSecundario" />
            </Dialog.CloseTrigger>
          </Dialog.Content>
        </Dialog.Positioner>
      </Portal>
    </Dialog.Root>
  )
})
