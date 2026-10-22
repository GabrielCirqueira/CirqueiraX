import { Box, Input, chakra } from '@chakra-ui/react'
import type { KeyboardEvent, MouseEvent, PointerEvent } from 'react'
import type { EstiloAnotacao, FerramentaEditor, ImagemEditor, TextoEmEdicao } from '../types'
import { montarFonte } from '../utils/desenhoCanvas'
import { calcularTamanhoFonte } from '../utils/fabricaAnotacoes'
import { cursorDaFerramenta } from '../utils/selecaoAnotacoes'

const LARGURA_MINIMA_TEXTO_CARACTERES = 6

export interface AreaEdicaoCanvasProps {
  imagem: ImagemEditor
  ferramenta: FerramentaEditor
  estilo: EstiloAnotacao
  textoEmEdicao: TextoEmEdicao | null
  registrarCanvasBase: (canvas: HTMLCanvasElement | null) => void
  registrarCanvasSobreposicao: (canvas: HTMLCanvasElement | null) => void
  onIniciarDesenho: (evento: PointerEvent<HTMLCanvasElement>) => void
  onMoverDesenho: (evento: PointerEvent<HTMLCanvasElement>) => void
  onFinalizarDesenho: () => void
  onDuploClique: (evento: MouseEvent<HTMLCanvasElement>) => void
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
  registrarCanvasSobreposicao,
  onIniciarDesenho,
  onMoverDesenho,
  onFinalizarDesenho,
  onDuploClique,
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
    ? (textoEmEdicao.tamanhoFonte ?? calcularTamanhoFonte(imagem, estilo)) *
      textoEmEdicao.escalaTela
    : 0
  const corTexto = textoEmEdicao?.cor ?? estilo.cor

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
        ref={registrarCanvasSobreposicao}
        position="absolute"
        inset={0}
        w="full"
        h="full"
        touchAction="none"
        cursor={cursorDaFerramenta(ferramenta)}
        onPointerDown={onIniciarDesenho}
        onPointerMove={onMoverDesenho}
        onPointerUp={onFinalizarDesenho}
        onPointerCancel={onFinalizarDesenho}
        onDoubleClick={onDuploClique}
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
          style={{ color: corTexto, font: montarFonte(tamanhoFonteTela) }}
        />
      )}
    </Box>
  )
}
