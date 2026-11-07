import { Center, Skeleton, Text, VStack } from '@chakra-ui/react'
import { Inbox, SearchX } from 'lucide-react'
import { memo } from 'react'
import type { PaginaTranscricoes } from '../types'
import { CardTranscricao } from './CardTranscricao'

export interface ListaTranscricoesProps {
  pagina: PaginaTranscricoes | undefined
  carregando: boolean
  filtrando: boolean
  selecionadaUuid: string | null
  onSelecionar: (uuid: string) => void
}

export const ListaTranscricoes = memo(function ListaTranscricoes({
  pagina,
  carregando,
  filtrando,
  selecionadaUuid,
  onSelecionar,
}: ListaTranscricoesProps) {
  if (carregando && !pagina) {
    return (
      <VStack align="stretch" gap={2}>
        {[0, 1, 2, 3].map((indice) => (
          <Skeleton key={indice} h="84px" borderRadius="8px" />
        ))}
      </VStack>
    )
  }

  if (!pagina || pagina.transcricoes.length === 0) {
    return (
      <Center
        py={10}
        px={4}
        borderWidth="1px"
        borderStyle="dashed"
        borderColor="border.subtle"
        borderRadius="8px"
      >
        <VStack gap={2} color="fg.subtle" textAlign="center">
          {filtrando ? <SearchX size={26} /> : <Inbox size={26} />}
          <Text fontSize="sm" fontWeight="semibold" color="fg.muted">
            {filtrando ? 'Nada encontrado' : 'Nenhuma transcrição ainda'}
          </Text>
          <Text fontSize="xs">
            {filtrando
              ? 'Tente outra busca ou outro filtro.'
              : 'Envie seus primeiros áudios acima.'}
          </Text>
        </VStack>
      </Center>
    )
  }

  return (
    <VStack align="stretch" gap={2}>
      {pagina.transcricoes.map((transcricao) => (
        <CardTranscricao
          key={transcricao.uuid}
          transcricao={transcricao}
          selecionada={transcricao.uuid === selecionadaUuid}
          onSelecionar={onSelecionar}
        />
      ))}
      {pagina.total > pagina.transcricoes.length && (
        <Text fontSize="xs" color="fg.subtle" textAlign="center" py={2}>
          Mostrando as {pagina.transcricoes.length} mais recentes de {pagina.total}. Use a busca
          para achar as antigas.
        </Text>
      )}
    </VStack>
  )
})
