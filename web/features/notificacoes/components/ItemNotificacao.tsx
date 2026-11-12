import { formatarDataHora, tempoRelativo } from '@/shared/utils/formatarData'
import { Badge, Box, HStack, Text, VStack } from '@chakra-ui/react'
import { memo } from 'react'
import type { Notificacao } from '../types'
import { estiloTipoNotificacao } from '../utils'

interface ItemNotificacaoProps {
  notificacao: Notificacao
  destacarNaoLida?: boolean
}

export const ItemNotificacao = memo(function ItemNotificacao({
  notificacao,
  destacarNaoLida = false,
}: ItemNotificacaoProps) {
  const estilo = estiloTipoNotificacao(notificacao.tipo)
  const naoLida = destacarNaoLida && !notificacao.lida

  return (
    <Box
      p={3}
      borderRadius="8px"
      border="1px solid"
      borderColor={naoLida ? 'brand.emphasized' : 'border.subtle'}
      bg={naoLida ? 'bg.subtle' : 'bg.panel'}
      w="full"
    >
      <VStack align="stretch" gap={1.5}>
        <HStack justify="space-between" gap={2} align="flex-start">
          <HStack gap={2} minW={0} align="center">
            {naoLida && <Box w={2} h={2} borderRadius="full" bg="brand.solid" flexShrink={0} />}
            <Text fontSize="sm" fontWeight="semibold" color="fg" lineClamp={2}>
              {notificacao.titulo}
            </Text>
          </HStack>
          <Badge bg={estilo.fundo} color={estilo.texto} fontSize="10px" flexShrink={0}>
            {notificacao.tipoDescricao}
          </Badge>
        </HStack>
        <Text fontSize="sm" color="fg.muted" whiteSpace="pre-line">
          {notificacao.mensagem}
        </Text>
        <Text fontSize="xs" color="fg.subtle" title={formatarDataHora(notificacao.criadoEm)}>
          {tempoRelativo(notificacao.criadoEm)}
        </Text>
      </VStack>
    </Box>
  )
})
