import { Button, CloseButton, Dialog, HStack, Portal, Text, VStack } from '@chakra-ui/react'
import { PartyPopper } from 'lucide-react'
import { memo } from 'react'
import type { ImportacaoYoutube } from '../types'
import { formatarDataImportacao } from '../utils'
import { RelatorioImportacaoYoutube } from './RelatorioImportacaoYoutube'

export interface DialogRelatorioImportacaoYoutubeProps {
  importacao: ImportacaoYoutube | null
  restantes?: number
  fechando?: boolean
  onFechar: () => void
}

export const DialogRelatorioImportacaoYoutube = memo(function DialogRelatorioImportacaoYoutube({
  importacao,
  restantes = 0,
  fechando = false,
  onFechar,
}: DialogRelatorioImportacaoYoutubeProps) {
  return (
    <Dialog.Root
      open={importacao !== null}
      onOpenChange={(detalhes) => !detalhes.open && onFechar()}
      size="xl"
      placement="center"
      scrollBehavior="inside"
    >
      <Portal>
        <Dialog.Backdrop bg="rgba(0, 0, 0, 0.8)" />
        <Dialog.Positioner>
          <Dialog.Content
            data-theme="dark"
            bg="cirqueira.musica.cartao"
            color="cirqueira.musica.textoPrincipal"
            borderRadius="12px"
            border="1px solid"
            borderColor="cirqueira.musica.cartaoElevado"
            mx={4}
            maxH="min(90vh, 900px)"
          >
            <Dialog.Header borderBottomWidth="1px" borderColor="cirqueira.musica.cartaoElevado">
              <VStack align="start" gap={1}>
                <HStack gap={2}>
                  <PartyPopper size={18} />
                  <Dialog.Title fontSize="md">Importação do YouTube concluída</Dialog.Title>
                </HStack>
                {importacao && (
                  <Text fontSize="xs" color="cirqueira.musica.textoSecundario">
                    {importacao.nomeArquivoOriginal ?? 'Arquivo do Takeout'} · terminou{' '}
                    {formatarDataImportacao(importacao.concluidoEm)}
                  </Text>
                )}
              </VStack>
            </Dialog.Header>
            <Dialog.Body py={5}>
              {importacao && (
                <RelatorioImportacaoYoutube importacao={importacao} onAbrirRevisao={onFechar} />
              )}
            </Dialog.Body>
            <Dialog.Footer borderTopWidth="1px" borderColor="cirqueira.musica.cartaoElevado">
              <HStack justify="space-between" w="full" gap={3}>
                <Text fontSize="xs" color="cirqueira.musica.textoSecundario">
                  {restantes > 0
                    ? `Mais ${restantes} ${restantes === 1 ? 'relatório' : 'relatórios'} depois deste`
                    : 'Tudo foi somado ao que já estava no sistema.'}
                </Text>
                <Button
                  size="sm"
                  borderRadius="full"
                  fontWeight="bold"
                  bg="cirqueira.musica.verde"
                  color="cirqueira.grey.950"
                  _hover={{ bg: 'cirqueira.musica.verdeHover' }}
                  loading={fechando}
                  onClick={onFechar}
                >
                  {restantes > 0 ? 'Próximo' : 'Fechar'}
                </Button>
              </HStack>
            </Dialog.Footer>
            <Dialog.CloseTrigger asChild>
              <CloseButton size="sm" color="cirqueira.musica.textoSecundario" />
            </Dialog.CloseTrigger>
          </Dialog.Content>
        </Dialog.Positioner>
      </Portal>
    </Dialog.Root>
  )
})
