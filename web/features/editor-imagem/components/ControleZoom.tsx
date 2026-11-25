import { Button, HStack, IconButton } from '@chakra-ui/react'
import { Maximize, Minus, Plus } from 'lucide-react'
import { memo } from 'react'
import type { AcaoZoom } from '../types'

export interface ControleZoomProps {
  zoom: number | null
  ajustado: boolean
  onAplicar: (acao: AcaoZoom) => void
}

export const ControleZoom = memo(function ControleZoom({
  zoom,
  ajustado,
  onAplicar,
}: ControleZoomProps) {
  const porcentagem = zoom === null ? '—' : `${Math.round(zoom * 100)}%`
  return (
    <HStack
      gap={0.5}
      p={1}
      bg="bg.panel"
      borderWidth="1px"
      borderColor="border.subtle"
      borderRadius="10px"
      shadow="md"
    >
      <IconButton
        size="xs"
        variant="ghost"
        color="fg.muted"
        aria-label="Diminuir zoom"
        title="Diminuir zoom (Ctrl + -)"
        onClick={() => onAplicar('menos')}
      >
        <Minus size={14} />
      </IconButton>
      <Button
        size="xs"
        variant="ghost"
        minW="52px"
        fontVariantNumeric="tabular-nums"
        color="fg"
        title="Tamanho real (Ctrl + 1)"
        onClick={() => onAplicar('real')}
      >
        {porcentagem}
      </Button>
      <IconButton
        size="xs"
        variant="ghost"
        color="fg.muted"
        aria-label="Aumentar zoom"
        title="Aumentar zoom (Ctrl + +)"
        onClick={() => onAplicar('mais')}
      >
        <Plus size={14} />
      </IconButton>
      <IconButton
        size="xs"
        variant={ajustado ? 'subtle' : 'ghost'}
        colorPalette={ajustado ? 'brand' : 'gray'}
        color={ajustado ? undefined : 'fg.muted'}
        aria-label="Ajustar à tela"
        title="Ajustar à tela (Ctrl + 0)"
        onClick={() => onAplicar('ajustar')}
      >
        <Maximize size={14} />
      </IconButton>
    </HStack>
  )
})
