import { Badge, Box, Button, Card, HStack, Skeleton, Text, VStack } from '@chakra-ui/react'
import {
  ArrowRight,
  Bot,
  Building2,
  CheckCircle2,
  Clock,
  DownloadCloud,
  FileQuestion,
  FileVideo,
  Folder,
  Image as ImageIcon,
  Smartphone,
  Sparkles,
  UploadCloud,
} from 'lucide-react'
import { memo } from 'react'
import { Link } from 'react-router-dom'
import type { MidiaRecenteDashboard, OrigemMedia, StatusMediaItem } from '../types'

export interface AtividadesRecentesProps {
  midias?: MidiaRecenteDashboard[]
  carregando?: boolean
}

const ORIGEM_BADGE_INFO: Record<
  OrigemMedia,
  { label: string; colorPalette: string; icon: typeof Smartphone }
> = {
  print_empresa: { label: 'Prints Empresa', colorPalette: 'blue', icon: Building2 },
  print_pessoal: { label: 'Prints Celular', colorPalette: 'teal', icon: Smartphone },
  download: { label: 'Download', colorPalette: 'amber', icon: DownloadCloud },
  bot_telegram: { label: 'Telegram', colorPalette: 'cyan', icon: Bot },
  manual: { label: 'Upload Manual', colorPalette: 'purple', icon: UploadCloud },
}

const STATUS_BADGE_INFO: Record<
  StatusMediaItem,
  { label: string; colorPalette: string }
> = {
  concluido: { label: 'Concluído', colorPalette: 'green' },
  distribuido_local: { label: 'Distribuído', colorPalette: 'green' },
  sem_categoria: { label: 'Sem Categoria', colorPalette: 'orange' },
  classificado: { label: 'Classificado', colorPalette: 'blue' },
  distribuindo: { label: 'Distribuindo', colorPalette: 'cyan' },
  baixando: { label: 'Baixando', colorPalette: 'amber' },
  recebido: { label: 'Recebido', colorPalette: 'gray' },
  em_fila: { label: 'Em Fila', colorPalette: 'purple' },
  enviando_google_fotos: { label: 'Enviando Backup', colorPalette: 'blue' },
  erro: { label: 'Falha', colorPalette: 'red' },
}

function formatarTempoRelativo(isoDateString?: string): string {
  if (!isoDateString) return ''
  try {
    const data = new Date(isoDateString)
    const agora = new Date()
    const diffSegundos = Math.floor((agora.getTime() - data.getTime()) / 1000)

    if (diffSegundos < 60) return 'Agora mesmo'
    const diffMinutos = Math.floor(diffSegundos / 60)
    if (diffMinutos < 60) return `Há ${diffMinutos} min`
    const diffHoras = Math.floor(diffMinutos / 60)
    if (diffHoras < 24) return `Há ${diffHoras} ${diffHoras === 1 ? 'hora' : 'horas'}`
    const diffDias = Math.floor(diffHoras / 24)
    return `Há ${diffDias} ${diffDias === 1 ? 'dia' : 'dias'}`
  } catch {
    return ''
  }
}

export const AtividadesRecentes = memo(function AtividadesRecentes({
  midias = [],
  carregando = false,
}: AtividadesRecentesProps) {
  if (carregando) {
    return (
      <Card.Root borderWidth="1px" borderColor="border.subtle" bg="bg.panel" borderRadius="2xl" p={5}>
        <HStack justify="space-between" mb={4}>
          <Skeleton h={5} w={40} borderRadius="md" />
          <Skeleton h={5} w={20} borderRadius="md" />
        </HStack>
        <VStack gap={3} align="stretch">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} h={14} w="full" borderRadius="xl" />
          ))}
        </VStack>
      </Card.Root>
    )
  }

  return (
    <Card.Root
      borderWidth="1px"
      borderColor="border.subtle"
      bg="bg.panel"
      borderRadius="2xl"
      shadow="md"
      p={5}
    >
      <HStack justify="space-between" align="center" mb={4}>
        <HStack gap={2.5}>
          <Box
            p={2}
            borderRadius="xl"
            bg="cirqueira.brand.500/12"
            color="cirqueira.brand.400"
            borderWidth="1px"
            borderColor="cirqueira.brand.500/25"
          >
            <Sparkles size={16} />
          </Box>
          <Box>
            <Text fontSize="sm" fontWeight="bold" color="fg">
              Últimas Mídias Processadas
            </Text>
            <Text fontSize="xs" color="fg.subtle">
              Fluxo recente de ingestão no ecossistema
            </Text>
          </Box>
        </HStack>

        <Button asChild size="xs" variant="ghost" colorPalette="teal">
          <Link to="/prints">
            <Text as="span">Ver Galeria</Text>
            <ArrowRight size={13} style={{ marginLeft: '4px' }} />
          </Link>
        </Button>
      </HStack>

      {midias.length === 0 ? (
        <Box
          py={8}
          textAlign="center"
          borderWidth="1px"
          borderStyle="dashed"
          borderColor="border.subtle"
          borderRadius="xl"
        >
          <FileQuestion size={28} style={{ margin: '0 auto 8px', opacity: 0.4 }} />
          <Text fontSize="xs" color="fg.subtle">
            Nenhuma atividade registrada recentemente.
          </Text>
        </Box>
      ) : (
        <VStack gap={2.5} align="stretch">
          {midias.map((item) => {
            const infoOrigem = ORIGEM_BADGE_INFO[item.origem] ?? {
              label: item.origem,
              colorPalette: 'gray',
              icon: Smartphone,
            }
            const infoStatus = STATUS_BADGE_INFO[item.status] ?? {
              label: item.status,
              colorPalette: 'gray',
            }
            const IconeOrigem = infoOrigem.icon
            const isVideo = item.origem === 'download'
            const nomeExibicao =
              (item.metadata?.original_filename as string) ||
              (item.metadata?.title as string) ||
              item.caminhoLocal?.split('/').pop() ||
              `Mídia #${item.hash.substring(0, 10)}`

            const categoriaNome = item.categoria?.nome || 'Sem Categoria'

            return (
              <HStack
                key={item.uuid || item.hash}
                justify="space-between"
                p={3}
                borderRadius="xl"
                borderWidth="1px"
                borderColor="border.subtle"
                bg="rgba(255, 255, 255, 0.015)"
                transition="all 0.2s"
                _hover={{
                  bg: 'rgba(255, 255, 255, 0.035)',
                  borderColor: 'cirqueira.brand.500/30',
                }}
              >
                <HStack gap={3} minW={0} flex={1}>
                  <Box
                    p={2.5}
                    borderRadius="xl"
                    bg={isVideo ? 'cirqueira.amber.500/12' : 'cirqueira.brand.500/12'}
                    color={isVideo ? 'cirqueira.amber.400' : 'cirqueira.brand.400'}
                    borderWidth="1px"
                    borderColor={isVideo ? 'cirqueira.amber.500/25' : 'cirqueira.brand.500/25'}
                    flexShrink={0}
                  >
                    {isVideo ? <FileVideo size={16} /> : <ImageIcon size={16} />}
                  </Box>

                  <VStack align="flex-start" gap={0.5} minW={0}>
                    <Text
                      fontSize="xs"
                      fontWeight="bold"
                      color="fg"
                      isTruncated
                      maxW={{ base: '180px', sm: '280px', md: '360px' }}
                    >
                      {nomeExibicao}
                    </Text>
                    <HStack gap={2} fontSize="11px" color="fg.subtle">
                      <HStack gap={1} align="center">
                        <Folder size={11} />
                        <Text as="span">{categoriaNome}</Text>
                      </HStack>
                      <Text as="span">•</Text>
                      <HStack gap={1} align="center">
                        <Clock size={11} />
                        <Text as="span">{formatarTempoRelativo(item.criadoEm)}</Text>
                      </HStack>
                    </HStack>
                  </VStack>
                </HStack>

                <HStack gap={2} flexShrink={0}>
                  <Badge
                    size="xs"
                    variant="subtle"
                    colorPalette={infoOrigem.colorPalette}
                    display={{ base: 'none', sm: 'inline-flex' }}
                    borderRadius="md"
                    px={2}
                  >
                    <IconeOrigem size={11} style={{ marginRight: '4px' }} />
                    {infoOrigem.label}
                  </Badge>

                  <Badge
                    size="xs"
                    variant="subtle"
                    colorPalette={infoStatus.colorPalette}
                    borderRadius="md"
                    px={2}
                  >
                    {infoStatus.label}
                  </Badge>
                </HStack>
              </HStack>
            )
          })}
        </VStack>
      )}
    </Card.Root>
  )
})
