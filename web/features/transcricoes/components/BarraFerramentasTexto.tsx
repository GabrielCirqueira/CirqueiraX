import { Button, HStack, IconButton, Input, InputGroup, Text, Wrap } from '@chakra-ui/react'
import { AlignLeft, Copy, Download, ListOrdered, LocateFixed, Search } from 'lucide-react'
import { memo } from 'react'
import type { FormatoExportacao, ModoVisualizacaoTexto } from '../types'
import { OPCOES_EXPORTACAO } from '../utils'

export interface BarraFerramentasTextoProps {
  modo: ModoVisualizacaoTexto
  termo: string
  ocorrencias: number
  seguirAudio: boolean
  exibirSeguirAudio: boolean
  onMudarModo: (modo: ModoVisualizacaoTexto) => void
  onMudarTermo: (termo: string) => void
  onAlternarSeguirAudio: () => void
  onCopiar: () => void
  onExportar: (formato: FormatoExportacao) => void
}

export const BarraFerramentasTexto = memo(function BarraFerramentasTexto({
  modo,
  termo,
  ocorrencias,
  seguirAudio,
  exibirSeguirAudio,
  onMudarModo,
  onMudarTermo,
  onAlternarSeguirAudio,
  onCopiar,
  onExportar,
}: BarraFerramentasTextoProps) {
  return (
    <HStack gap={2} flexWrap="wrap" justify="space-between">
      <HStack gap={1} p={0.5} bg="bg.muted" borderRadius="full">
        <Button
          size="xs"
          borderRadius="full"
          variant={modo === 'trechos' ? 'solid' : 'ghost'}
          colorPalette={modo === 'trechos' ? 'brand' : 'gray'}
          onClick={() => onMudarModo('trechos')}
        >
          <ListOrdered size={13} />
          Trechos
        </Button>
        <Button
          size="xs"
          borderRadius="full"
          variant={modo === 'corrido' ? 'solid' : 'ghost'}
          colorPalette={modo === 'corrido' ? 'brand' : 'gray'}
          onClick={() => onMudarModo('corrido')}
        >
          <AlignLeft size={13} />
          Texto corrido
        </Button>
      </HStack>

      <HStack gap={1.5} flex={{ base: '1 1 100%', md: '0 1 auto' }} order={{ base: 3, md: 2 }}>
        <InputGroup
          startElement={<Search size={13} />}
          endElement={
            termo ? (
              <Text fontSize="10px" color="fg.subtle" pr={1}>
                {ocorrencias}
              </Text>
            ) : undefined
          }
        >
          <Input
            size="xs"
            h={8}
            w={{ base: 'full', md: '200px' }}
            placeholder="Procurar no texto"
            value={termo}
            onChange={(evento) => onMudarTermo(evento.target.value)}
            borderRadius="full"
            bg="bg.panel"
          />
        </InputGroup>
        {exibirSeguirAudio && (
          <IconButton
            size="xs"
            h={8}
            w={8}
            borderRadius="full"
            variant={seguirAudio ? 'subtle' : 'ghost'}
            colorPalette={seguirAudio ? 'brand' : 'gray'}
            aria-label="Seguir o áudio"
            title={seguirAudio ? 'Rolagem acompanha o áudio' : 'Rolagem livre'}
            onClick={onAlternarSeguirAudio}
          >
            <LocateFixed size={14} />
          </IconButton>
        )}
      </HStack>

      <Wrap gap={1} order={{ base: 2, md: 3 }}>
        <Button size="xs" h={8} variant="outline" borderRadius="full" onClick={onCopiar}>
          <Copy size={13} />
          Copiar
        </Button>
        {OPCOES_EXPORTACAO.map((opcao) => (
          <Button
            key={opcao.formato}
            size="xs"
            h={8}
            variant="ghost"
            borderRadius="full"
            color="fg.muted"
            title={opcao.descricao}
            onClick={() => onExportar(opcao.formato)}
          >
            <Download size={12} />.{opcao.formato}
          </Button>
        ))}
      </Wrap>
    </HStack>
  )
})
