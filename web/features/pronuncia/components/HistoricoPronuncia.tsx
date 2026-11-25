import { Box, Button, Flex, HStack, Input, Skeleton, Text, VStack } from '@chakra-ui/react'
import { History, Search, Star } from 'lucide-react'
import { memo } from 'react'
import type { ConsultaResumo, PaginaHistorico } from '../types'

export interface HistoricoPronunciaProps {
  pagina: PaginaHistorico | undefined
  carregando: boolean
  busca: string
  somenteFavoritas: boolean
  selecionadaUuid: string | null
  onMudarBusca: (busca: string) => void
  onAlternarFavoritas: () => void
  onSelecionar: (consulta: ConsultaResumo) => void
}

export const HistoricoPronuncia = memo(function HistoricoPronuncia({
  pagina,
  carregando,
  busca,
  somenteFavoritas,
  selecionadaUuid,
  onMudarBusca,
  onAlternarFavoritas,
  onSelecionar,
}: HistoricoPronunciaProps) {
  const consultas = pagina?.consultas ?? []

  return (
    <Box
      bg="bg.panel"
      borderWidth="1px"
      borderColor="border.subtle"
      borderRadius="12px"
      shadow="xs"
      overflow="hidden"
      position={{ base: 'static', xl: 'sticky' }}
      top={{ xl: 20 }}
    >
      <VStack align="stretch" gap={0}>
        <Flex
          px={4}
          py={3}
          justify="space-between"
          align="center"
          borderBottomWidth="1px"
          borderColor="border.subtle"
        >
          <HStack gap={2}>
            <History size={15} />
            <Text fontSize="sm" fontWeight="bold" color="fg">
              Histórico
            </Text>
            {pagina && (
              <Text fontSize="xs" color="fg.subtle">
                {pagina.total}
              </Text>
            )}
          </HStack>
          <Button
            size="2xs"
            borderRadius="full"
            variant={somenteFavoritas ? 'subtle' : 'ghost'}
            colorPalette={somenteFavoritas ? 'yellow' : 'gray'}
            aria-pressed={somenteFavoritas}
            onClick={onAlternarFavoritas}
          >
            <Star size={12} fill={somenteFavoritas ? 'currentColor' : 'none'} />
            Favoritas
          </Button>
        </Flex>

        <Box px={3} py={2.5} borderBottomWidth="1px" borderColor="border.subtle">
          <HStack gap={2} px={2.5} bg="bg.subtle" borderRadius="8px" color="fg.subtle">
            <Search size={14} />
            <Input
              value={busca}
              onChange={(evento) => onMudarBusca(evento.target.value)}
              placeholder="Buscar no histórico"
              size="sm"
              border="none"
              px={0}
              _focusVisible={{ outline: 'none', boxShadow: 'none' }}
              aria-label="Buscar no histórico"
            />
          </HStack>
        </Box>

        <VStack align="stretch" gap={0} maxH={{ xl: 'calc(100dvh - 260px)' }} overflowY="auto">
          {carregando &&
            ['a', 'b', 'c', 'd'].map((chave) => (
              <Box key={chave} px={4} py={3}>
                <Skeleton h="14px" w="70%" mb={2} />
                <Skeleton h="12px" w="50%" />
              </Box>
            ))}

          {!carregando && consultas.length === 0 && (
            <VStack py={10} px={6} gap={1}>
              <Text fontSize="sm" color="fg.muted" textAlign="center">
                {busca || somenteFavoritas
                  ? 'Nada encontrado com esse filtro.'
                  : 'As frases que você traduzir aparecem aqui.'}
              </Text>
            </VStack>
          )}

          {consultas.map((consulta) => {
            const selecionada = consulta.uuid === selecionadaUuid
            return (
              <Box
                as="button"
                key={consulta.uuid}
                onClick={() => onSelecionar(consulta)}
                textAlign="left"
                px={4}
                py={3}
                borderBottomWidth="1px"
                borderColor="border.subtle"
                borderLeftWidth="3px"
                borderLeftColor={selecionada ? 'cirqueira.brand.400' : 'transparent'}
                bg={selecionada ? 'cirqueira.brand.500/8' : 'transparent'}
                transition="background 0.15s"
                _hover={{ bg: selecionada ? 'cirqueira.brand.500/10' : 'bg.subtle' }}
              >
                <HStack justify="space-between" align="flex-start" gap={2}>
                  <Text fontSize="sm" fontWeight="semibold" color="fg" lineClamp={2}>
                    {consulta.frase.textoIngles}
                  </Text>
                  {consulta.favorita && (
                    <Box color="cirqueira.yellow.400" flexShrink={0} pt="2px">
                      <Star size={12} fill="currentColor" />
                    </Box>
                  )}
                </HStack>
                <Text fontSize="xs" color="fg.subtle" lineClamp={1}>
                  {consulta.frase.textoPortugues}
                </Text>
                <Text
                  fontSize="xs"
                  color="cirqueira.brand.300"
                  fontWeight="medium"
                  lineClamp={1}
                  mt={0.5}
                >
                  {consulta.frase.pronuncia}
                </Text>
              </Box>
            )
          })}
        </VStack>
      </VStack>
    </Box>
  )
})
