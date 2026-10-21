import {
  Badge,
  Box,
  Button,
  Card,
  HStack,
  Icon,
  Skeleton,
  Table,
  Text,
  VStack,
} from '@chakra-ui/react'
import { ChevronLeft, ChevronRight, History, UploadCloud } from 'lucide-react'
import { memo, useState } from 'react'
import {
  useEnviosGoogleFotos,
  useReenviarGoogleFotos,
  useResumoEnviosGoogleFotos,
} from '../hooks/useGoogleFotos'
import type { StatusEnvioGoogleFotos } from '../types'
import { FILTROS_STATUS_ENVIO } from '../utils/enviosGoogleFotos'
import { LinhaEnvioGoogleFotos } from './LinhaEnvioGoogleFotos'

const LIMITE_POR_PAGINA = 15
const LINHAS_CARREGANDO = ['envio-sk-1', 'envio-sk-2', 'envio-sk-3', 'envio-sk-4']

export const TabelaEnviosGoogleFotos = memo(function TabelaEnviosGoogleFotos() {
  const [pagina, setPagina] = useState(1)
  const [filtroStatus, setFiltroStatus] = useState<StatusEnvioGoogleFotos | null>(null)
  const [registroReenviando, setRegistroReenviando] = useState<string | null>(null)

  const { data: resposta, isLoading } = useEnviosGoogleFotos(
    pagina,
    LIMITE_POR_PAGINA,
    filtroStatus
  )
  const { data: resumo } = useResumoEnviosGoogleFotos()
  const { mutate: reenviar, isPending: reenviando } = useReenviarGoogleFotos()

  const registros = resposta?.data ?? []
  const total = resposta?.total ?? 0
  const totalPaginas = Math.max(1, Math.ceil(total / LIMITE_POR_PAGINA))

  function handleFiltrar(status: StatusEnvioGoogleFotos | null) {
    setFiltroStatus(status)
    setPagina(1)
  }

  function handleReenviar(uuidRegistro: string) {
    setRegistroReenviando(uuidRegistro)
    reenviar(uuidRegistro, { onSettled: () => setRegistroReenviando(null) })
  }

  return (
    <Card.Root
      borderWidth="1px"
      borderColor="border.subtle"
      bg="bg.panel"
      borderRadius="xl"
      shadow="sm"
    >
      <Card.Body p={0}>
        <VStack align="stretch" gap={4} p={4} borderBottomWidth="1px" borderColor="border.subtle">
          <HStack justify="space-between" align="flex-start" flexWrap="wrap" gap={3}>
            <HStack gap={2.5}>
              <Box p={2} borderRadius="lg" bg="cirqueira.teal.500/10" color="cirqueira.teal.500">
                <Icon as={History} boxSize={5} />
              </Box>
              <VStack align="flex-start" gap={0.5}>
                <Text fontSize="base" fontWeight="semibold" color="fg">
                  Histórico de Envios
                </Text>
                <Text fontSize="xs" color="fg.subtle">
                  Cada tentativa de envio ao Google Fotos, com resultado, conta, tentativa e erro
                </Text>
              </VStack>
            </HStack>

            <HStack gap={2} flexWrap="wrap">
              <Badge size="sm" variant="subtle" colorPalette="green" borderRadius="md">
                {resumo?.enviados ?? 0} enviados em 24h
              </Badge>
              <Badge size="sm" variant="subtle" colorPalette="red" borderRadius="md">
                {resumo?.falhas ?? 0} falhas em 24h
              </Badge>
              <Badge size="sm" variant="subtle" colorPalette="teal" borderRadius="md">
                {resumo?.reaproveitados ?? 0} já existiam
              </Badge>
              {(resumo?.enviando ?? 0) > 0 && (
                <Badge size="sm" variant="subtle" colorPalette="amber" borderRadius="md">
                  {resumo?.enviando} enviando
                </Badge>
              )}
            </HStack>
          </HStack>

          <HStack gap={1.5} flexWrap="wrap">
            {FILTROS_STATUS_ENVIO.map((filtro) => (
              <Button
                key={filtro.rotulo}
                size="xs"
                borderRadius="lg"
                variant={filtroStatus === filtro.valor ? 'solid' : 'ghost'}
                colorPalette={filtroStatus === filtro.valor ? 'brand' : 'gray'}
                onClick={() => handleFiltrar(filtro.valor)}
              >
                {filtro.rotulo}
              </Button>
            ))}
          </HStack>
        </VStack>

        {isLoading && (
          <VStack align="stretch" gap={2} p={4}>
            {LINHAS_CARREGANDO.map((chave) => (
              <Skeleton key={chave} h={10} borderRadius="md" />
            ))}
          </VStack>
        )}

        {!isLoading && registros.length === 0 && (
          <VStack gap={2} py={10} color="fg.subtle">
            <Icon as={UploadCloud} boxSize={8} />
            <Text fontSize="sm">
              Nenhum envio registrado{filtroStatus ? ' com esse filtro' : ''}.
            </Text>
          </VStack>
        )}

        {!isLoading && registros.length > 0 && (
          <Box overflowX="auto">
            <Table.Root size="sm" variant="outline">
              <Table.Header bg="bg.muted">
                <Table.Row>
                  <Table.ColumnHeader w="110px">Status</Table.ColumnHeader>
                  <Table.ColumnHeader>Mídia</Table.ColumnHeader>
                  <Table.ColumnHeader w="130px">Data da mídia</Table.ColumnHeader>
                  <Table.ColumnHeader>Destino / Conta</Table.ColumnHeader>
                  <Table.ColumnHeader w="120px">Tentativa</Table.ColumnHeader>
                  <Table.ColumnHeader w="130px">Execução</Table.ColumnHeader>
                  <Table.ColumnHeader w="120px" textAlign="right">
                    Ações
                  </Table.ColumnHeader>
                </Table.Row>
              </Table.Header>
              <Table.Body>
                {registros.map((registro) => (
                  <LinhaEnvioGoogleFotos
                    key={registro.uuid}
                    registro={registro}
                    reenviando={reenviando && registroReenviando === registro.uuid}
                    onReenviar={handleReenviar}
                  />
                ))}
              </Table.Body>
            </Table.Root>
          </Box>
        )}

        {totalPaginas > 1 && (
          <HStack
            justify="space-between"
            px={4}
            py={3}
            fontSize="xs"
            color="fg.subtle"
            borderTopWidth="1px"
            borderColor="border.subtle"
          >
            <Text>
              Página {pagina} de {totalPaginas} ({total} envios)
            </Text>
            <HStack gap={1.5}>
              <Button
                size="xs"
                variant="ghost"
                borderRadius="lg"
                disabled={pagina <= 1}
                onClick={() => setPagina((atual) => Math.max(1, atual - 1))}
              >
                <ChevronLeft size={14} />
                <Text as="span">Anterior</Text>
              </Button>
              <Button
                size="xs"
                variant="ghost"
                borderRadius="lg"
                disabled={pagina >= totalPaginas}
                onClick={() => setPagina((atual) => atual + 1)}
              >
                <Text as="span">Próxima</Text>
                <ChevronRight size={14} />
              </Button>
            </HStack>
          </HStack>
        )}
      </Card.Body>
    </Card.Root>
  )
})
