import { Badge, Button, HStack, Skeleton, Text, VStack } from '@chakra-ui/react'
import { ArrowRight } from 'lucide-react'
import { memo } from 'react'
import { Link } from 'react-router-dom'
import type { MidiaRecenteDashboard } from '../types'
import {
  ROTULO_ORIGEM,
  STATUS_MIDIA,
  nomeExibicaoMidia,
  paletaDoTom,
  tempoRelativoCurto,
} from '../utils/metricasDashboard'
import { PainelDashboard } from './PainelDashboard'

export interface AtividadesRecentesProps {
  midias?: MidiaRecenteDashboard[]
  carregando?: boolean
}

const CHAVES_CARREGANDO = ['atividade-sk-1', 'atividade-sk-2', 'atividade-sk-3', 'atividade-sk-4']

export const AtividadesRecentes = memo(function AtividadesRecentes({
  midias = [],
  carregando = false,
}: AtividadesRecentesProps) {
  return (
    <PainelDashboard
      semEspacamento
      titulo="Últimas mídias"
      descricao="Entradas mais recentes no sistema"
      acao={
        <Button asChild size="xs" variant="ghost" borderRadius="lg" color="fg.muted">
          <Link to="/prints">
            Ver galeria
            <ArrowRight size={12} />
          </Link>
        </Button>
      }
    >
      <VStack align="stretch" gap={0} borderTopWidth="1px" borderColor="border.subtle">
        {carregando &&
          CHAVES_CARREGANDO.map((chave) => (
            <HStack key={chave} px={5} py={3} justify="space-between">
              <Skeleton h={4} w="60%" />
              <Skeleton h={4} w={16} />
            </HStack>
          ))}

        {!carregando && midias.length === 0 && (
          <Text px={5} py={8} fontSize="sm" color="fg.subtle" textAlign="center">
            Nenhuma atividade recente.
          </Text>
        )}

        {!carregando &&
          midias.map((midia) => {
            const status = STATUS_MIDIA[midia.status] ?? {
              rotulo: midia.status,
              tom: 'neutro' as const,
            }
            return (
              <HStack
                key={midia.uuid || midia.hash}
                justify="space-between"
                gap={3}
                px={5}
                py={3}
                borderBottomWidth="1px"
                borderColor="border.subtle"
                _last={{ borderBottomWidth: 0 }}
              >
                <VStack align="flex-start" gap={0.5} minW={0} flex={1}>
                  <Text fontSize="sm" color="fg" truncate maxW="full">
                    {nomeExibicaoMidia(midia)}
                  </Text>
                  <Text fontSize="xs" color="fg.subtle" truncate maxW="full">
                    {ROTULO_ORIGEM[midia.origem] ?? midia.origem} ·{' '}
                    {midia.categoria?.nome || 'Sem categoria'} ·{' '}
                    {tempoRelativoCurto(midia.criadoEm)}
                  </Text>
                </VStack>
                <Badge
                  size="sm"
                  variant="subtle"
                  colorPalette={paletaDoTom(status.tom)}
                  borderRadius="md"
                  flexShrink={0}
                >
                  {status.rotulo}
                </Badge>
              </HStack>
            )
          })}
      </VStack>
    </PainelDashboard>
  )
})
