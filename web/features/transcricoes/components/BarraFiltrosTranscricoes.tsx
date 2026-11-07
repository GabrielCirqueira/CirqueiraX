import { Box, Button, HStack, IconButton, Input, InputGroup, VStack } from '@chakra-ui/react'
import { Search, X } from 'lucide-react'
import { memo } from 'react'
import type { FiltroListagemTranscricao } from '../types'
import { OPCOES_FILTRO } from '../utils'

export interface BarraFiltrosTranscricoesProps {
  busca: string
  filtro: FiltroListagemTranscricao
  onMudarBusca: (busca: string) => void
  onMudarFiltro: (filtro: FiltroListagemTranscricao) => void
}

export const BarraFiltrosTranscricoes = memo(function BarraFiltrosTranscricoes({
  busca,
  filtro,
  onMudarBusca,
  onMudarFiltro,
}: BarraFiltrosTranscricoesProps) {
  return (
    <VStack align="stretch" gap={2.5}>
      <InputGroup
        startElement={<Search size={14} />}
        endElement={
          busca ? (
            <IconButton
              size="2xs"
              variant="ghost"
              borderRadius="full"
              aria-label="Limpar busca"
              onClick={() => onMudarBusca('')}
            >
              <X size={12} />
            </IconButton>
          ) : undefined
        }
      >
        <Input
          size="sm"
          value={busca}
          placeholder="Buscar no título ou dentro do texto..."
          onChange={(evento) => onMudarBusca(evento.target.value)}
          bg="bg.panel"
          borderColor="border.subtle"
          borderRadius="full"
        />
      </InputGroup>
      <Box overflowX="auto" mx={-1} px={1} pb={1}>
        <HStack gap={1.5} w="max-content">
          {OPCOES_FILTRO.map((opcao) => {
            const ativo = opcao.valor === filtro
            return (
              <Button
                key={opcao.valor}
                size="xs"
                h={7}
                borderRadius="full"
                variant={ativo ? 'solid' : 'outline'}
                colorPalette={ativo ? 'brand' : 'gray'}
                color={ativo ? undefined : 'fg.muted'}
                onClick={() => onMudarFiltro(opcao.valor)}
              >
                {opcao.rotulo}
              </Button>
            )
          })}
        </HStack>
      </Box>
    </VStack>
  )
})
