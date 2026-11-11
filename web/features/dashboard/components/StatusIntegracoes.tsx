import { useStatusGoogleFotos } from '@/features/google-fotos'
import { Box, HStack, Text, VStack } from '@chakra-ui/react'
import { Activity } from 'lucide-react'
import { memo } from 'react'
import { useNavigate } from 'react-router-dom'
import type { ResumoDashboard, StatusSyncthing } from '../types'
import {
  type TomMetrica,
  corTextoDoTom,
  montarServicosIntegracao,
} from '../utils/metricasDashboard'
import { PainelDashboard } from './PainelDashboard'

export interface StatusIntegracoesProps {
  statusSync?: StatusSyncthing
  resumo?: ResumoDashboard
  totalCategorias?: number
}

const COR_INDICADOR: Record<TomMetrica, string> = {
  neutro: 'fg.subtle',
  sucesso: 'cirqueira.musica.verde',
  alerta: 'cirqueira.musica.amarelo',
  erro: 'cirqueira.red.500',
  destaque: 'cirqueira.brand.400',
  info: 'cirqueira.musica.azul',
}

export const StatusIntegracoes = memo(function StatusIntegracoes({
  statusSync,
  resumo,
  totalCategorias = 0,
}: StatusIntegracoesProps) {
  const navigate = useNavigate()
  const { data: statusGoogleFotos } = useStatusGoogleFotos()

  const servicos = montarServicosIntegracao({
    syncthingOnline: statusSync?.online ?? false,
    totalPastas: statusSync?.pastas?.length ?? 0,
    totalErros: resumo?.totalErros ?? 0,
    googleFotosConectado: statusGoogleFotos?.conectado ?? false,
    googleFotosEmail: statusGoogleFotos?.email ?? null,
    totalCategorias,
    tamanhoTotal: resumo?.tamanhoTotalFormatado ?? '0 B',
    spotify: resumo?.spotify,
    youtubeMusic: resumo?.youtubeMusic,
  })

  return (
    <PainelDashboard semEspacamento icone={Activity} titulo="Serviços" descricao="Estado das integrações">
      <VStack align="stretch" gap={0} borderTopWidth="1px" borderColor="border.subtle">
        {servicos.map((servico) => (
          <HStack
            key={servico.nome}
            justify="space-between"
            gap={3}
            px={5}
            py={3}
            borderBottomWidth="1px"
            borderColor="border.subtle"
            _last={{ borderBottomWidth: 0 }}
            cursor={servico.rota ? 'pointer' : 'default'}
            _hover={servico.rota ? { bg: 'bg.muted' } : undefined}
            onClick={
              servico.rota
                ? () => {
                    if (servico.rota) navigate(servico.rota)
                  }
                : undefined
            }
          >
            <VStack align="flex-start" gap={0.5} minW={0}>
              <Text fontSize="sm" color="fg">
                {servico.nome}
              </Text>
              <Text fontSize="xs" color="fg.subtle" truncate>
                {servico.detalhe}
              </Text>
            </VStack>
            <HStack gap={2} flexShrink={0}>
              <Box w={1.5} h={1.5} borderRadius="full" bg={COR_INDICADOR[servico.tom]} />
              <Text
                fontSize="xs"
                color={servico.tom === 'erro' ? corTextoDoTom('erro') : 'fg.muted'}
              >
                {servico.estado}
              </Text>
            </HStack>
          </HStack>
        ))}
      </VStack>
    </PainelDashboard>
  )
})
