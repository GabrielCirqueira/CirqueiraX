import { Badge, Button, HStack, SimpleGrid, Text } from '@chakra-ui/react'
import { memo } from 'react'
import type { ContagensRevisao, TipoRevisao } from '../types'
import { ABAS_REVISAO } from '../utils'

export interface SeletorCategoriaRevisaoProps {
  atual: TipoRevisao
  contagens: ContagensRevisao | undefined
  onEscolher: (tipo: TipoRevisao) => void
}

export const SeletorCategoriaRevisao = memo(function SeletorCategoriaRevisao({
  atual,
  contagens,
  onEscolher,
}: SeletorCategoriaRevisaoProps) {
  return (
    <SimpleGrid
      columns={{ base: 2, md: 3 }}
      gap={2}
      role="tablist"
      aria-label="Categorias da revisão"
    >
      {ABAS_REVISAO.map((aba) => {
        const quantidade = contagens?.[aba.tipo]
        const selecionada = aba.tipo === atual
        const comPendencias = (quantidade ?? 0) > 0
        return (
          <Button
            key={aba.tipo}
            role="tab"
            aria-selected={selecionada}
            onClick={() => onEscolher(aba.tipo)}
            h="auto"
            minH="44px"
            px={3}
            py={2}
            borderRadius="10px"
            justifyContent="space-between"
            whiteSpace="normal"
            textAlign="left"
            bg={selecionada ? 'cirqueira.musica.cartaoElevado' : 'cirqueira.musica.cartao'}
            border="1px solid"
            borderColor={selecionada ? 'cirqueira.musica.verde' : 'cirqueira.musica.cartaoElevado'}
            color={
              selecionada || comPendencias
                ? 'cirqueira.musica.textoPrincipal'
                : 'cirqueira.musica.textoDesabilitado'
            }
            _hover={{ bg: 'cirqueira.musica.cartaoElevado' }}
          >
            <HStack justify="space-between" w="full" gap={2}>
              <Text fontSize="sm" fontWeight={selecionada ? 'bold' : 'medium'} lineClamp={2}>
                {aba.rotulo}
              </Text>
              <Badge
                size="sm"
                borderRadius="full"
                flexShrink={0}
                bg={comPendencias ? 'cirqueira.musica.amarelo' : 'cirqueira.musica.fundo'}
                color={
                  comPendencias ? 'cirqueira.musica.fundo' : 'cirqueira.musica.textoDesabilitado'
                }
              >
                {quantidade ?? '·'}
              </Badge>
            </HStack>
          </Button>
        )
      })}
    </SimpleGrid>
  )
})
