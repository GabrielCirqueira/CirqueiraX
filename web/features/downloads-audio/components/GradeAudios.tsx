import { Box, HStack, Icon, IconButton, SimpleGrid, Skeleton, Text, VStack } from '@chakra-ui/react'
import { ChevronLeft, ChevronRight, Headphones } from 'lucide-react'
import { memo } from 'react'
import type { Audio, PaginaAudios } from '../types'
import { totalDePaginas } from '../utils/audios'
import { CardAudio } from './CardAudio'

const COLUNAS_GRADE = { base: 1, sm: 2, md: 3, lg: 4, xl: 5, '2xl': 6 }
const CARDS_ESQUELETO = 12

export interface GradeAudiosProps {
  pagina: PaginaAudios | undefined
  carregando: boolean
  agora: number
  tocandoUuid: string | null
  rebaixandoUuid: string | null
  apagandoUuid: string | null
  onMudarPagina: (pagina: number) => void
  onAlternarReproducao: (audio: Audio) => void
  onRebaixar: (uuid: string) => void
  onApagar: (uuid: string) => void
}

export const GradeAudios = memo(function GradeAudios({
  pagina,
  carregando,
  agora,
  tocandoUuid,
  rebaixandoUuid,
  apagandoUuid,
  onMudarPagina,
  onAlternarReproducao,
  onRebaixar,
  onApagar,
}: GradeAudiosProps) {
  if (carregando && !pagina) {
    return (
      <SimpleGrid columns={COLUNAS_GRADE} gap={{ base: 3, md: 4 }}>
        {Array.from({ length: CARDS_ESQUELETO }, (_, indice) => (
          <VStack
            key={indice}
            align="stretch"
            gap={0}
            borderWidth="1px"
            borderColor="border.subtle"
            borderRadius="2xl"
            overflow="hidden"
          >
            <Skeleton aspectRatio="16/10" w="full" borderRadius="0" />
            <VStack align="stretch" gap={2} p={3}>
              <Skeleton h={4} w="85%" />
              <Skeleton h={3} w="50%" />
              <Skeleton h={8} w="full" borderRadius="lg" />
            </VStack>
          </VStack>
        ))}
      </SimpleGrid>
    )
  }

  if (!pagina || pagina.audios.length === 0) {
    return (
      <VStack
        py={{ base: 14, md: 20 }}
        px={6}
        gap={3}
        bg="bg.panel"
        borderWidth="1px"
        borderStyle="dashed"
        borderColor="border.emphasized"
        borderRadius="2xl"
        textAlign="center"
      >
        <Box p={4} borderRadius="full" bg="cirqueira.brand.500/10" color="cirqueira.brand.400">
          <Icon as={Headphones} boxSize={8} strokeWidth={1.75} />
        </Box>
        <Text fontSize="md" fontWeight="bold" color="fg">
          Sua biblioteca de áudio está vazia
        </Text>
        <Text fontSize="sm" color="fg.subtle" maxW="md">
          Cole um link do YouTube, TikTok, Instagram ou X acima. O áudio é convertido para MP3 com
          título, artista e capa.
        </Text>
      </VStack>
    )
  }

  const paginas = totalDePaginas(pagina)

  return (
    <VStack align="stretch" gap={4}>
      <SimpleGrid columns={COLUNAS_GRADE} gap={{ base: 3, md: 4 }}>
        {pagina.audios.map((audio) => (
          <CardAudio
            key={audio.uuid}
            audio={audio}
            agora={agora}
            tocando={tocandoUuid === audio.uuid}
            rebaixando={rebaixandoUuid === audio.uuid}
            apagando={apagandoUuid === audio.uuid}
            onAlternarReproducao={onAlternarReproducao}
            onRebaixar={onRebaixar}
            onApagar={onApagar}
          />
        ))}
      </SimpleGrid>

      {paginas > 1 && (
        <HStack
          justify="space-between"
          bg="bg.panel"
          borderWidth="1px"
          borderColor="border.subtle"
          borderRadius="xl"
          px={4}
          py={2}
        >
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
