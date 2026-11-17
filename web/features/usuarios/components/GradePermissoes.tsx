import type { FuncionalidadeSistema } from '@/shared/utils/funcionalidadesSistema'
import { Box, Button, Flex, Text, VStack, Wrap, WrapItem } from '@chakra-ui/react'
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
  const total = funcionalidades.length
  const marcadas = selecionadas.length

  return (
    <VStack align="stretch" gap={3}>
      <Flex justify="space-between" align="center" gap={3} flexWrap="wrap">
        <VStack align="start" gap={0}>
          <Text fontSize="sm" fontWeight="semibold" color="fg">
            Permissões de acesso
          </Text>
          <Text fontSize="xs" color="fg.muted">
            {desabilitado
              ? 'Administrador tem acesso a tudo automaticamente.'
              : `${marcadas} de ${total} selecionadas`}
          </Text>
        </VStack>
        {!desabilitado && (
          <Flex gap={2}>
            <Button
              type="button"
              size="xs"
              variant="ghost"
              colorPalette="brand"
              onClick={() =>
                onChange(funcionalidades.map((item) => item.codigo as FuncionalidadeSistema))
              }
            >
              Todas
            </Button>
            <Button
              type="button"
              size="xs"
              variant="ghost"
              onClick={() => onChange([])}
              disabled={marcadas === 0}
            >
              Limpar
            </Button>
          </Flex>
        )}
      </Flex>

      <Wrap gap={2}>
        {funcionalidades.map((item) => {
          const codigo = item.codigo as FuncionalidadeSistema
          const marcada = desabilitado || selecionadas.includes(codigo)

          return (
            <WrapItem key={codigo}>
              <Box
                as="button"
                type="button"
                px={3}
                py={1.5}
                borderRadius="full"
                borderWidth="1px"
                borderColor={marcada ? 'cirqueira.brand.500' : 'border.subtle'}
                bg={marcada ? 'cirqueira.brand.500/15' : 'bg.muted'}
                color={marcada ? 'cirqueira.brand.300' : 'fg.muted'}
                fontSize="xs"
                fontWeight={marcada ? 'semibold' : 'medium'}
                opacity={desabilitado ? 0.7 : 1}
                cursor={desabilitado ? 'default' : 'pointer'}
                transition="all 0.12s ease"
                _hover={
                  desabilitado
                    ? undefined
                    : {
                        borderColor: 'cirqueira.brand.400',
                        color: 'fg',
                      }
                }
                disabled={desabilitado}
                onClick={() => {
                  if (desabilitado) return
                  onChange(alternarPermissao(selecionadas, codigo))
                }}
              >
                {item.descricao}
              </Box>
            </WrapItem>
          )
        })}
      </Wrap>

      {!desabilitado && marcadas === 0 && (
        <Text fontSize="xs" color="cirqueira.orange.400">
          Selecione ao menos uma permissão ou ative administrador.
        </Text>
      )}
    </VStack>
  )
})
