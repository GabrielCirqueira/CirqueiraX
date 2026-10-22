import { Box, Input, chakra } from '@chakra-ui/react'
import type { KeyboardEvent, PointerEvent } from 'react'
import type { EstiloAnotacao, FerramentaEditor, ImagemEditor, TextoEmEdicao } from '../types'
import { montarFonte } from '../utils/desenhoCanvas'
import { calcularTamanhoFonte } from '../utils/fabricaAnotacoes'

const CURSOR_POR_FERRAMENTA: Partial<Record<FerramentaEditor, string>> = {
  texto: 'text',
  numero: 'copy',
}

const LARGURA_MINIMA_TEXTO_CARACTERES = 6

export interface AreaEdicaoCanvasProps {
  imagem: ImagemEditor
  ferramenta: FerramentaEditor
  estilo: EstiloAnotacao
  textoEmEdicao: TextoEmEdicao | null
  registrarCanvasBase: (canvas: HTMLCanvasElement | null) => void
  registrarCanvasRascunho: (canvas: HTMLCanvasElement | null) => void
  onIniciarDesenho: (evento: PointerEvent<HTMLCanvasElement>) => void
  onMoverDesenho: (evento: PointerEvent<HTMLCanvasElement>) => void
  onFinalizarDesenho: () => void
  onAtualizarTexto: (valor: string) => void
  onConfirmarTexto: () => void
  onCancelarTexto: () => void
}

export function AreaEdicaoCanvas({
  imagem,
  ferramenta,
  estilo,
  textoEmEdicao,
  registrarCanvasBase,
  registrarCanvasRascunho,
  onIniciarDesenho,
  onMoverDesenho,
  onFinalizarDesenho,
  onAtualizarTexto,
  onConfirmarTexto,
  onCancelarTexto,
}: AreaEdicaoCanvasProps) {
  function aoTeclarNoTexto(evento: KeyboardEvent<HTMLInputElement>) {
    if (evento.key === 'Enter') {
      evento.preventDefault()
      onConfirmarTexto()
    }
    if (evento.key === 'Escape') {
      evento.preventDefault()
      onCancelarTexto()
    }
  }

  const tamanhoFonteTela = textoEmEdicao
    ? calcularTamanhoFonte(imagem, estilo) * textoEmEdicao.escalaTela
    : 0

  return (
    <Box position="relative" lineHeight={0} shadow="lg" borderRadius="sm" maxW="full">
      <chakra.canvas
        key={imagem.id}
        ref={registrarCanvasBase}
        display="block"
        maxW="full"
        maxH={{ base: '62dvh', md: 'calc(100dvh - 300px)' }}
        w="auto"
        h="auto"
        borderRadius="sm"
      />
      <chakra.canvas
        ref={registrarCanvasRascunho}
        position="absolute"
        inset={0}
        w="full"
        h="full"
        touchAction="none"
        cursor={CURSOR_POR_FERRAMENTA[ferramenta] ?? 'crosshair'}
        onPointerDown={onIniciarDesenho}
        onPointerMove={onMoverDesenho}
        onPointerUp={onFinalizarDesenho}
        onPointerCancel={onFinalizarDesenho}
      />
      {textoEmEdicao && (
        <Input
          autoFocus
          position="absolute"
          left={`${textoEmEdicao.posicaoTela.x}px`}
          top={`${textoEmEdicao.posicaoTela.y}px`}
          w={`${Math.max(textoEmEdicao.valor.length + 1, LARGURA_MINIMA_TEXTO_CARACTERES)}ch`}
          h="auto"
          minH={0}
          p={0}
          bg="transparent"
          borderWidth="1px"
          borderStyle="dashed"
          borderColor="fg.muted"
          borderRadius="sm"
          lineHeight={1.2}
          placeholder="Digite..."
          value={textoEmEdicao.valor}
          onChange={(evento) => onAtualizarTexto(evento.target.value)}
          onKeyDown={aoTeclarNoTexto}
          style={{ color: estilo.cor, font: montarFonte(tamanhoFonteTela) }}
        />
      )}
    </Box>
  )
}
