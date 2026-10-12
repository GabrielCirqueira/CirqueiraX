import { Badge, Box, Card, Grid, HStack, Text } from '@chakra-ui/react'
import {
  Activity,
  Cloud,
  HardDrive,
  Server,
  Wifi,
  WifiOff,
} from 'lucide-react'
import { memo } from 'react'
import type { ResumoDashboard, StatusSyncthing } from '../types'

export interface StatusIntegracoesProps {
  statusSync?: StatusSyncthing
  resumo?: ResumoDashboard
  totalCategorias?: number
}

export const StatusIntegracoes = memo(function StatusIntegracoes({
  statusSync,
  resumo,
  totalCategorias = 0,
}: StatusIntegracoesProps) {
  const syncthingOnline = statusSync?.online ?? false
  const totalPastasSync = statusSync?.pastas?.length ?? 0
  const totalErros = resumo?.totalErros ?? 0

  return (
    <Card.Root
      borderWidth="1px"
      borderColor="border.subtle"
      bg="bg.panel"
      borderRadius="2xl"
      shadow="md"
      p={5}
      minW={0}
      w="full"
      overflow="hidden"
    >
      <HStack justify="space-between" align="center" mb={4} flexWrap="wrap" gap={3}>
        <HStack gap={2.5} minW={0} flex={1}>
          <Box
            p={2}
            borderRadius="xl"
            bg="cirqueira.brand.500/12"
            color="cirqueira.brand.400"
            borderWidth="1px"
            borderColor="cirqueira.brand.500/25"
            flexShrink={0}
          >
            <Activity size={16} />
          </Box>
          <Box minW={0}>
            <Text fontSize="sm" fontWeight="bold" color="fg" truncate>
              Saúde do Ecossistema & Serviços
            </Text>
            <Text fontSize="xs" color="fg.subtle" lineClamp={1}>
              Status operacional das conexões e agentes em tempo real
            </Text>
          </Box>
        </HStack>

        <Badge
          variant="subtle"
          colorPalette={totalErros === 0 ? 'green' : 'red'}
          size="sm"
          borderRadius="md"
          px={2.5}
          py={1}
          flexShrink={0}
        >
          <Box
            w={2}
            h={2}
            borderRadius="full"
            bg={totalErros === 0 ? 'green.400' : 'red.400'}
            mr={1.5}
            display="inline-block"
            style={{ animation: 'pulse 2s infinite' }}
          />
          {totalErros === 0 ? 'Pipeline Estável' : `${totalErros} Atenções`}
        </Badge>
      </HStack>

      <Grid
        templateColumns={{ base: '1fr', sm: 'repeat(2, 1fr)' }}
        gap={3}
        minW={0}
        w="full"
      >
        <Box
          p={3.5}
          borderRadius="xl"
          borderWidth="1px"
          borderColor="border.subtle"
          bg="bg.muted/30"
          minW={0}
        >
          <HStack justify="space-between" mb={2} gap={2}>
            <HStack gap={2} minW={0} flex={1}>
              <Box
                p={1.5}
                borderRadius="lg"
                bg={syncthingOnline ? 'cirqueira.brand.500/15' : 'cirqueira.red.500/15'}
                color={syncthingOnline ? 'cirqueira.brand.400' : 'cirqueira.red.400'}
                flexShrink={0}
              >
                {syncthingOnline ? <Wifi size={14} /> : <WifiOff size={14} />}
              </Box>
              <Text fontSize="xs" fontWeight="bold" color="fg" truncate>
                Syncthing
              </Text>
            </HStack>
            <Badge
              size="xs"
              variant="subtle"
              colorPalette={syncthingOnline ? 'green' : 'gray'}
              borderRadius="md"
              flexShrink={0}
            >
              {syncthingOnline ? 'Conectado' : 'Offline'}
            </Badge>
          </HStack>
          <Text fontSize="11px" color="fg.subtle" lineClamp={1}>
            {totalPastasSync} {totalPastasSync === 1 ? 'pasta ativa' : 'pastas ativas'} monitoradas
          </Text>
        </Box>

        <Box
          p={3.5}
          borderRadius="xl"
          borderWidth="1px"
          borderColor="border.subtle"
          bg="bg.muted/30"
          minW={0}
        >
          <HStack justify="space-between" mb={2} gap={2}>
            <HStack gap={2} minW={0} flex={1}>
              <Box
                p={1.5}
                borderRadius="lg"
                bg="cirqueira.blue.500/15"
                color="cirqueira.blue.400"
                flexShrink={0}
              >
                <Server size={14} />
              </Box>
              <Text fontSize="xs" fontWeight="bold" color="fg" truncate>
                Fila de Processamento
              </Text>
            </HStack>
            <Badge size="xs" variant="subtle" colorPalette="blue" borderRadius="md" flexShrink={0}>
              Ativo
            </Badge>
          </HStack>
          <Text fontSize="11px" color="fg.subtle" lineClamp={1}>
            Workers Symfony Messenger em execução
          </Text>
        </Box>

        <Box
          p={3.5}
          borderRadius="xl"
          borderWidth="1px"
          borderColor="border.subtle"
          bg="bg.muted/30"
          minW={0}
        >
          <HStack justify="space-between" mb={2} gap={2}>
            <HStack gap={2} minW={0} flex={1}>
              <Box
                p={1.5}
                borderRadius="lg"
                bg="cirqueira.purple.500/15"
                color="cirqueira.purple.400"
                flexShrink={0}
              >
                <Cloud size={14} />
              </Box>
              <Text fontSize="xs" fontWeight="bold" color="fg" truncate>
                Google Fotos
              </Text>
            </HStack>
            <Badge size="xs" variant="subtle" colorPalette="purple" borderRadius="md" flexShrink={0}>
              Pronto
            </Badge>
          </HStack>
          <Text fontSize="11px" color="fg.subtle" lineClamp={1}>
            Mapeamento de álbuns e backup na nuvem
          </Text>
        </Box>

        <Box
          p={3.5}
          borderRadius="xl"
          borderWidth="1px"
          borderColor="border.subtle"
          bg="bg.muted/30"
          minW={0}
        >
          <HStack justify="space-between" mb={2} gap={2}>
            <HStack gap={2} minW={0} flex={1}>
              <Box
                p={1.5}
                borderRadius="lg"
                bg="cirqueira.amber.500/15"
                color="cirqueira.amber.400"
                flexShrink={0}
              >
                <HardDrive size={14} />
              </Box>
              <Text fontSize="xs" fontWeight="bold" color="fg" truncate>
                Armazenamento
              </Text>
            </HStack>
            <Badge size="xs" variant="subtle" colorPalette="amber" borderRadius="md" flexShrink={0}>
              {resumo?.tamanhoTotalFormatado ?? '0 B'}
            </Badge>
          </HStack>
          <Text fontSize="11px" color="fg.subtle" lineClamp={1}>
            {totalCategorias} {totalCategorias === 1 ? 'categoria ativa' : 'categorias ativas'} no disco
          </Text>
        </Box>
      </Grid>
    </Card.Root>
  )
})
