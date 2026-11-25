import { Box, Textarea, chakra } from '@chakra-ui/react'
import type { KeyboardEvent, MouseEvent, PointerEvent } from 'react'
import type { AlinhamentoTexto, FerramentaEditor, ImagemEditor, TextoEmEdicao } from '../types'
import { montarFonte } from '../utils/desenhoCanvas'
import { cursorDaFerramenta } from '../utils/selecaoAnotacoes'

const LARGURA_MINIMA_TEXTO_CARACTERES = 6
const FUNDO_XADREZ = 'repeating-conic-gradient(#d4d4d8 0% 25%, #ffffff 0% 50%) 50% / 20px 20px'
const ALINHAMENTO_CSS: Record<AlinhamentoTexto, 'left' | 'center' | 'right'> = {
  esquerda: 'left',
  centro: 'center',
  direita: 'right',
}

export interface AreaEdicaoCanvasProps {
  imagem: ImagemEditor
  /** Largura da área visível (recorte) em pixels da imagem. */
  larguraTela: number
  zoom: number | null
  ferramenta: FerramentaEditor
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
  larguraTela,
  zoom,
  ferramenta,
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
  function aoTeclarNoTexto(evento: KeyboardEvent<HTMLTextAreaElement>) {
    if (evento.key === 'Enter' && !evento.shiftKey) {
      evento.preventDefault()
      onConfirmarTexto()
    }
    if (evento.key === 'Escape') {
      evento.preventDefault()
      onCancelarTexto()
    }
  }

  const tamanhoFonteTela = textoEmEdicao ? textoEmEdicao.tamanhoFonte * textoEmEdicao.escalaTela : 0
  const linhas = textoEmEdicao?.valor.split('\n') ?? []
  const maiorLinha = Math.max(0, ...linhas.map((linha) => linha.length))
  const transparente = imagem.tela !== null && imagem.tela.corFundo === null

  return (
    <Box
      position="relative"
      lineHeight={0}
      flexShrink={0}
      m="auto"
      shadow="0 1px 3px rgba(0,0,0,0.12), 0 8px 28px rgba(0,0,0,0.14)"
      maxW={zoom === null ? 'full' : undefined}
      style={transparente ? { background: FUNDO_XADREZ } : undefined}
    >
      <chakra.canvas
        key={imagem.id}
        ref={registrarCanvasBase}
        display="block"
        maxW={zoom === null ? 'full' : 'none'}
        h="auto"
        style={zoom === null ? undefined : { width: `${Math.round(larguraTela * zoom)}px` }}
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
        <Textarea
          autoFocus
          position="absolute"
          left={`${textoEmEdicao.posicaoTela.x}px`}
          top={`${textoEmEdicao.posicaoTela.y}px`}
          w={`${Math.max(maiorLinha + 2, LARGURA_MINIMA_TEXTO_CARACTERES)}ch`}
          rows={Math.max(1, linhas.length)}
          h="auto"
          minH={0}
          p={0}
          resize="none"
          overflow="hidden"
          whiteSpace="pre"
          bg="transparent"
          borderWidth="1px"
          borderStyle="dashed"
          borderColor="fg.muted"
          borderRadius="4px"
          lineHeight={1.2}
          placeholder="Digite..."
          title="Enter confirma · Shift + Enter quebra a linha"
          value={textoEmEdicao.valor}
          onChange={(evento) => onAtualizarTexto(evento.target.value)}
          onKeyDown={aoTeclarNoTexto}
          style={{
            color: textoEmEdicao.cor,
            font: montarFonte(tamanhoFonteTela, textoEmEdicao.formato),
            lineHeight: 1.2,
            textAlign: ALINHAMENTO_CSS[textoEmEdicao.formato.alinhamento],
          }}
        />
      )}
    </Box>
  )
}
