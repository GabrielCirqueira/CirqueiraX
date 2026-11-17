import type { FuncionalidadeSistema } from '@/shared/utils/funcionalidadesSistema'
import { Box, Checkbox, HStack, SimpleGrid, Text, VStack } from '@chakra-ui/react'
import { memo } from 'react'
import type { FuncionalidadeOpcao } from '../types'
import { alternarPermissao } from '../utils/formularioUsuario'

export interface GradePermissoesProps {
  funcionalidades: FuncionalidadeOpcao[]
  selecionadas: FuncionalidadeSistema[]
  desabilitado?: boolean
  onChange: (proximas: FuncionalidadeSistema[]) => void
}

export const GradePermissoes = memo(function GradePermissoes({
  funcionalidades,
  selecionadas,
  desabilitado = false,
  onChange,
}: GradePermissoesProps) {
  if (funcionalidades.length === 0) {
    return (
      <Box p={3} borderRadius="10px" border="1px dashed" borderColor="border.subtle">
        <Text fontSize="sm" color="fg.muted">
          Não foi possível carregar as funcionalidades. Recarregue a página.
        </Text>
      </Box>
    )
  }

  return (
    <VStack align="stretch" gap={3}>
      <HStack justify="space-between" align="center" gap={3} flexWrap="wrap">
        <VStack align="start" gap={0}>
          <Text fontSize="sm" fontWeight="semibold" color="fg">
            Funcionalidades
          </Text>
          <Text fontSize="xs" color="fg.muted">
            Marque ao menos uma para liberar o acesso do usuário.
          </Text>
        </VStack>
        {!desabilitado && (
          <HStack gap={2}>
            <Box
              as="button"
              type="button"
              fontSize="xs"
              color="cirqueira.brand.400"
              fontWeight="semibold"
              onClick={() =>
                onChange(funcionalidades.map((item) => item.codigo as FuncionalidadeSistema))
              }
            >
              Marcar todas
            </Box>
            <Text fontSize="xs" color="fg.subtle">
              ·
            </Text>
            <Box
              as="button"
              type="button"
              fontSize="xs"
              color="fg.muted"
              fontWeight="semibold"
              onClick={() => onChange([])}
            >
              Limpar
            </Box>
          </HStack>
        )}
      </HStack>

      <SimpleGrid columns={{ base: 1, md: 2 }} gap={2}>
        {funcionalidades.map((item) => {
          const codigo = item.codigo as FuncionalidadeSistema
          const marcada = selecionadas.includes(codigo)

          return (
            <Box
              key={codigo}
              as="button"
              type="button"
              textAlign="left"
              p={3}
              borderRadius="10px"
              border="1px solid"
              borderColor={marcada ? 'cirqueira.brand.500' : 'border.subtle'}
              bg={marcada ? 'brand.subtle' : 'bg.panel'}
              opacity={desabilitado ? 0.55 : 1}
              cursor={desabilitado ? 'not-allowed' : 'pointer'}
              transition="all 0.15s ease"
              disabled={desabilitado}
              onClick={() => {
                if (desabilitado) return
                onChange(alternarPermissao(selecionadas, codigo))
              }}
            >
              <HStack gap={3} align="center">
                <Checkbox.Root
                  checked={marcada}
                  disabled={desabilitado}
                  colorPalette="brand"
                  size="sm"
                  pointerEvents="none"
                >
                  <Checkbox.HiddenInput />
                  <Checkbox.Control />
                </Checkbox.Root>
                <Text fontSize="sm" fontWeight="medium" color="fg">
                  {item.descricao}
                </Text>
              </HStack>
            </Box>
          )
        })}
      </SimpleGrid>

      {!desabilitado && selecionadas.length === 0 && (
        <Text fontSize="xs" color="cirqueira.orange.400">
          Selecione pelo menos uma funcionalidade ou marque como administrador.
        </Text>
      )}
    </VStack>
  )
})
