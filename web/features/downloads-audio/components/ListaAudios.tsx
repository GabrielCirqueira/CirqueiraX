import { Box, HStack, Icon, IconButton, Spinner, Stack, Text, VStack } from '@chakra-ui/react'
import { ChevronLeft, ChevronRight, Music } from 'lucide-react'
import { memo } from 'react'
import type { PaginaAudios } from '../types'
import { totalDePaginas } from '../utils/audios'
import { ItemAudio } from './ItemAudio'

export interface ListaAudiosProps {
  pagina: PaginaAudios | undefined
  carregando: boolean
  agora: number
  reproduzindoUuid: string | null
  rebaixandoUuid: string | null
  apagandoUuid: string | null
  onMudarPagina: (pagina: number) => void
  onAlternarReproducao: (uuid: string) => void
  onRebaixar: (uuid: string) => void
  onApagar: (uuid: string) => void
}

export const ListaAudios = memo(function ListaAudios({
  pagina,
  carregando,
  agora,
  reproduzindoUuid,
  rebaixandoUuid,
  apagandoUuid,
  onMudarPagina,
  onAlternarReproducao,
  onRebaixar,
  onApagar,
}: ListaAudiosProps) {
  if (carregando && !pagina) {
    return (
      <HStack justify="center" py={16}>
        <Spinner size="sm" color="fg.subtle" />
      </HStack>
    )
  }

  if (!pagina || pagina.audios.length === 0) {
    return (
      <VStack
        py={16}
        gap={2}
        borderWidth="1px"
        borderStyle="dashed"
        borderColor="border.subtle"
        borderRadius="xl"
      >
        <Icon as={Music} boxSize={7} color="fg.subtle" />
        <Text fontSize="sm" fontWeight="medium" color="fg">
          Nenhum áudio ainda
        </Text>
        <Text fontSize="xs" color="fg.subtle">
          Cole um link acima para converter em MP3.
        </Text>
      </VStack>
    )
  }

  const paginas = totalDePaginas(pagina)

  return (
    <VStack align="stretch" gap={3}>
      <Box
        bg="bg.panel"
        borderWidth="1px"
        borderColor="border.subtle"
        borderRadius="xl"
        overflow="hidden"
      >
        <Stack gap={0} separator={<Box borderTopWidth="1px" borderColor="border.subtle" />}>
          {pagina.audios.map((audio) => (
            <ItemAudio
              key={audio.uuid}
              audio={audio}
              agora={agora}
              reproduzindo={reproduzindoUuid === audio.uuid}
              rebaixando={rebaixandoUuid === audio.uuid}
              apagando={apagandoUuid === audio.uuid}
              onAlternarReproducao={onAlternarReproducao}
              onRebaixar={onRebaixar}
              onApagar={onApagar}
            />
          ))}
        </Stack>
      </Box>

      {paginas > 1 && (
        <HStack justify="space-between">
          <Text fontSize="xs" color="fg.subtle">
            {pagina.total} áudios · página {pagina.pagina} de {paginas}
          </Text>
          <HStack gap={1}>
            <IconButton
              size="xs"
              variant="ghost"
              borderRadius="lg"
              aria-label="Página anterior"
              disabled={pagina.pagina <= 1}
              onClick={() => onMudarPagina(pagina.pagina - 1)}
            >
              <ChevronLeft size={14} />
            </IconButton>
            <IconButton
              size="xs"
              variant="ghost"
              borderRadius="lg"
              aria-label="Próxima página"
              disabled={pagina.pagina >= paginas}
              onClick={() => onMudarPagina(pagina.pagina + 1)}
            >
              <ChevronRight size={14} />
            </IconButton>
          </HStack>
        </HStack>
      )}
    </VStack>
  )
})
