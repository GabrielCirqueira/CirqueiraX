import { Badge, Box, Card, Grid, HStack, Text, VStack } from '@chakra-ui/react'
import {
  Activity,
  CheckCircle2,
  Cloud,
  FolderSync,
  HardDrive,
  Radio,
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
            <Activity size={16} />
          </Box>
          <Box>
            <Text fontSize="sm" fontWeight="bold" color="fg">
              Saúde do Ecossistema & Serviços
            </Text>
            <Text fontSize="xs" color="fg.subtle">
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
        templateColumns={{ base: '1fr', sm: 'repeat(2, 1fr)', lg: 'repeat(4, 1fr)' }}
        gap={3}
      >
        <Box
          p={3.5}
          borderRadius="xl"
          borderWidth="1px"
          borderColor="border.subtle"
          bg="rgba(255, 255, 255, 0.02)"
        >
          <HStack justify="space-between" mb={2}>
            <HStack gap={2}>
              <Box
                p={1.5}
                borderRadius="lg"
                bg={syncthingOnline ? 'cirqueira.brand.500/15' : 'cirqueira.red.500/15'}
                color={syncthingOnline ? 'cirqueira.brand.400' : 'cirqueira.red.400'}
              >
                {syncthingOnline ? <Wifi size={14} /> : <WifiOff size={14} />}
              </Box>
              <Text fontSize="xs" fontWeight="bold" color="fg">
                Syncthing
              </Text>
            </HStack>
            <Badge
              size="xs"
              variant="subtle"
              colorPalette={syncthingOnline ? 'green' : 'gray'}
              borderRadius="md"
            >
              {syncthingOnline ? 'Conectado' : 'Offline'}
            </Badge>
          </HStack>
          <Text fontSize="11px" color="fg.subtle">
            {totalPastasSync} {totalPastasSync === 1 ? 'pasta ativa' : 'pastas ativas'} monitoradas
          </Text>
        </Box>

        <Box
          p={3.5}
          borderRadius="xl"
          borderWidth="1px"
          borderColor="border.subtle"
          bg="rgba(255, 255, 255, 0.02)"
        >
          <HStack justify="space-between" mb={2}>
            <HStack gap={2}>
              <Box
                p={1.5}
                borderRadius="lg"
                bg="cirqueira.blue.500/15"
                color="cirqueira.blue.400"
              >
                <Server size={14} />
              </Box>
              <Text fontSize="xs" fontWeight="bold" color="fg">
                Fila de Processamento
              </Text>
            </HStack>
            <Badge size="xs" variant="subtle" colorPalette="blue" borderRadius="md">
              Ativo
            </Badge>
          </HStack>
          <Text fontSize="11px" color="fg.subtle">
            Workers Symfony Messenger em execução
          </Text>
        </Box>

        <Box
          p={3.5}
          borderRadius="xl"
          borderWidth="1px"
          borderColor="border.subtle"
          bg="rgba(255, 255, 255, 0.02)"
        >
          <HStack justify="space-between" mb={2}>
            <HStack gap={2}>
              <Box
                p={1.5}
                borderRadius="lg"
                bg="cirqueira.purple.500/15"
                color="cirqueira.purple.400"
              >
                <Cloud size={14} />
              </Box>
              <Text fontSize="xs" fontWeight="bold" color="fg">
                Google Fotos
              </Text>
            </HStack>
            <Badge size="xs" variant="subtle" colorPalette="purple" borderRadius="md">
              Pronto
            </Badge>
          </HStack>
          <Text fontSize="11px" color="fg.subtle">
            Mapeamento de álbuns e backup na nuvem
          </Text>
        </Box>

        <Box
          p={3.5}
          borderRadius="xl"
          borderWidth="1px"
          borderColor="border.subtle"
          bg="rgba(255, 255, 255, 0.02)"
        >
          <HStack justify="space-between" mb={2}>
            <HStack gap={2}>
              <Box
                p={1.5}
                borderRadius="lg"
                bg="cirqueira.amber.500/15"
                color="cirqueira.amber.400"
              >
                <HardDrive size={14} />
              </Box>
              <Text fontSize="xs" fontWeight="bold" color="fg">
                Armazenamento
              </Text>
            </HStack>
            <Badge size="xs" variant="subtle" colorPalette="amber" borderRadius="md">
              {resumo?.tamanhoTotalFormatado ?? '0 B'}
            </Badge>
          </HStack>
          <Text fontSize="11px" color="fg.subtle">
            {totalCategorias} {totalCategorias === 1 ? 'categoria ativa' : 'categorias ativas'} no disco
          </Text>
        </Box>
      </Grid>
    </Card.Root>
  )
})
