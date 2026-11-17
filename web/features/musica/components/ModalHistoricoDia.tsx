import { api } from '@/config/api'
import { useMediaQuery } from '@/shared/hooks/useMediaQuery'
import type { RespostaApi } from '@/shared/types/api'
import { Box, Dialog, Drawer, HStack, Portal, Skeleton, Text, VStack } from '@chakra-ui/react'
import { useQuery } from '@tanstack/react-query'
import { CalendarDays, X } from 'lucide-react'
import { memo } from 'react'
import { useFonteMusica } from '../hooks'
import { formatarDataExtensa, formatarMinutos, gerarRotaMusica } from '../utils'
import { LinkMusica } from './LinkMusica'

interface ItemHistoricoDia {
  nome: string
  artista: string
  musicaUuid: string
  tocadaEm: string
  minutos: number
  fonte: string
}

export interface ModalHistoricoDiaProps {
  data: string | null
  onFechar: () => void
}

export const ModalHistoricoDia = memo(function ModalHistoricoDia({
  data,
  onFechar,
}: ModalHistoricoDiaProps) {
  const aberto = Boolean(data)
  const isDesktop = useMediaQuery('(min-width: 768px)')
  const { fonte } = useFonteMusica()
  const {
    data: resposta,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ['musica', fonte, 'historico-dia', data],
    queryFn: async () => {
      const { data: body } = await api.get<
        RespostaApi<{ data: string; itens: ItemHistoricoDia[] }>
      >('/api/v1/musica/historico-dia', { params: { fonte, data } })
      return body.data
    },
    enabled: aberto && Boolean(data),
    staleTime: 60_000,
  })

  const titulo = data ? formatarDataExtensa(data) : 'Dia'
  const cabecalho = (
    <HStack gap={2} minW={0}>
      <Box color="cirqueira.musica.verde" display="inline-flex">
        <CalendarDays size={16} />
      </Box>
      <Text fontSize="md" fontWeight="bold" truncate>
        {titulo}
      </Text>
    </HStack>
  )
  const conteudo = (
    <VStack align="stretch" gap={2} py={2}>
      {isLoading ? (
        <>
          <Skeleton h="48px" borderRadius="8px" />
          <Skeleton h="48px" borderRadius="8px" />
          <Skeleton h="48px" borderRadius="8px" />
        </>
      ) : isError ? (
        <Text fontSize="sm" color="cirqueira.musica.textoSecundario">
          Não foi possível carregar as músicas deste dia.
        </Text>
      ) : !resposta?.itens.length ? (
        <Text fontSize="sm" color="cirqueira.musica.textoSecundario">
          Nenhuma reprodução neste dia.
        </Text>
      ) : (
        resposta.itens.map((item) => (
          <Box
            key={`${item.musicaUuid}-${item.tocadaEm}`}
            p={3}
            bg="cirqueira.musica.cartaoElevado"
            borderRadius="8px"
          >
            <LinkMusica to={gerarRotaMusica(item.nome, item.artista, item.musicaUuid)}>
              <Text fontSize="sm" fontWeight="semibold" color="cirqueira.musica.textoPrincipal">
                {item.nome}
              </Text>
            </LinkMusica>
            <Text fontSize="xs" color="cirqueira.musica.textoSecundario">
              {item.artista} · {formatarMinutos(item.minutos)} ·{' '}
              {item.tocadaEm.slice(11, 16) || item.tocadaEm}
            </Text>
          </Box>
        ))
      )}
    </VStack>
  )

  if (!isDesktop) {
    return (
      <Drawer.Root open={aberto} onOpenChange={(d) => !d.open && onFechar()} placement="bottom">
        <Portal>
          <Drawer.Backdrop bg="blackAlpha.800" backdropFilter="blur(4px)" />
          <Drawer.Positioner>
            <Drawer.Content
              data-theme="dark"
              bg="cirqueira.musica.cartao"
              borderTop="1px solid"
              borderColor="cirqueira.musica.cartaoElevado"
              borderTopRadius="16px"
              maxH="85vh"
            >
              <Drawer.Header borderBottom="1px solid" borderColor="cirqueira.musica.cartaoElevado">
                <HStack justify="space-between" w="full">
                  {cabecalho}
                  <Drawer.CloseTrigger asChild>
                    <Box as="button" p={1} color="cirqueira.musica.textoSecundario">
                      <X size={18} />
                    </Box>
                  </Drawer.CloseTrigger>
                </HStack>
              </Drawer.Header>
              <Drawer.Body overflowY="auto">{conteudo}</Drawer.Body>
            </Drawer.Content>
          </Drawer.Positioner>
        </Portal>
      </Drawer.Root>
    )
  }

  return (
    <Dialog.Root open={aberto} onOpenChange={(d) => !d.open && onFechar()}>
      <Portal>
        <Dialog.Backdrop bg="blackAlpha.800" backdropFilter="blur(4px)" />
        <Dialog.Positioner>
          <Dialog.Content
            data-theme="dark"
            bg="cirqueira.musica.cartao"
            border="1px solid"
            borderColor="cirqueira.musica.cartaoElevado"
            borderRadius="12px"
            maxW="480px"
            w="full"
            maxH="80vh"
            overflow="hidden"
          >
            <Dialog.Header borderBottom="1px solid" borderColor="cirqueira.musica.cartaoElevado">
              <HStack justify="space-between" w="full">
                {cabecalho}
                <Dialog.CloseTrigger asChild>
                  <Box as="button" p={1} color="cirqueira.musica.textoSecundario">
                    <X size={18} />
                  </Box>
                </Dialog.CloseTrigger>
              </HStack>
            </Dialog.Header>
            <Dialog.Body overflowY="auto">{conteudo}</Dialog.Body>
          </Dialog.Content>
        </Dialog.Positioner>
      </Portal>
    </Dialog.Root>
  )
})
