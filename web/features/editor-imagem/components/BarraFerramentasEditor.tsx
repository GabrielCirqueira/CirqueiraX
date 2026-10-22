import { Box, HStack, IconButton } from '@chakra-ui/react'
import {
  Circle,
  Crop,
  EyeOff,
  Hash,
  Highlighter,
  type LucideIcon,
  Minus,
  MousePointer2,
  MoveUpRight,
  Pencil,
  Redo2,
  Square,
  Trash2,
  Type,
  Undo2,
} from 'lucide-react'
import { memo } from 'react'
import type { EstiloAnotacao, FerramentaEditor, NivelEspessura } from '../types'
import { atalhoDaFerramenta } from '../utils/atalhosTeclado'
import { CORES_ANOTACAO, NIVEIS_ESPESSURA, ROTULO_NIVEL_ESPESSURA } from '../utils/constantesEditor'

interface OpcaoFerramenta {
  ferramenta: FerramentaEditor
  rotulo: string
  icone: LucideIcon
}

const OPCOES_FERRAMENTA: OpcaoFerramenta[] = [
  { ferramenta: 'selecionar', rotulo: 'Selecionar e mover', icone: MousePointer2 },
  { ferramenta: 'seta', rotulo: 'Seta', icone: MoveUpRight },
  { ferramenta: 'retangulo', rotulo: 'Retângulo', icone: Square },
  { ferramenta: 'elipse', rotulo: 'Círculo', icone: Circle },
  { ferramenta: 'linha', rotulo: 'Linha', icone: Minus },
  { ferramenta: 'pincel', rotulo: 'Pincel', icone: Pencil },
  { ferramenta: 'marcaTexto', rotulo: 'Marca-texto', icone: Highlighter },
  { ferramenta: 'texto', rotulo: 'Texto', icone: Type },
  { ferramenta: 'numero', rotulo: 'Marcador numerado', icone: Hash },
  { ferramenta: 'desfoque', rotulo: 'Esconder dados (pixelar)', icone: EyeOff },
  { ferramenta: 'recorte', rotulo: 'Recortar', icone: Crop },
]

const TAMANHO_PONTO_ESPESSURA: Record<NivelEspessura, number> = {
  fina: 1.5,
  media: 2.5,
  grossa: 3.5,
}

function Separador() {
  return <Box w="1px" h={6} bg="border.subtle" mx={1} display={{ base: 'none', md: 'block' }} />
}

export interface BarraFerramentasEditorProps {
  ferramenta: FerramentaEditor
  estilo: EstiloAnotacao
  podeDesfazer: boolean
  podeRefazer: boolean
  temAnotacoes: boolean
  onSelecionarFerramenta: (ferramenta: FerramentaEditor) => void
  onSelecionarCor: (cor: string) => void
  onSelecionarEspessura: (nivel: NivelEspessura) => void
  onDesfazer: () => void
  onRefazer: () => void
  onLimpar: () => void
}

export const BarraFerramentasEditor = memo(function BarraFerramentasEditor({
  ferramenta,
  estilo,
  podeDesfazer,
  podeRefazer,
  temAnotacoes,
  onSelecionarFerramenta,
  onSelecionarCor,
  onSelecionarEspessura,
  onDesfazer,
  onRefazer,
  onLimpar,
}: BarraFerramentasEditorProps) {
  return (
    <HStack
      gap={0.5}
      p={1.5}
      bg="bg.panel"
      borderWidth="1px"
      borderColor="border.subtle"
      borderRadius="xl"
      shadow="sm"
      flexWrap="wrap"
      justify="center"
      alignSelf="center"
      maxW="full"
    >
      {OPCOES_FERRAMENTA.map(({ ferramenta: opcao, rotulo, icone: Icone }) => {
        const ativa = opcao === ferramenta
        const atalho = atalhoDaFerramenta(opcao)
        return (
          <IconButton
            key={opcao}
            size="sm"
            borderRadius="lg"
            variant={ativa ? 'solid' : 'ghost'}
            colorPalette={ativa ? 'brand' : 'gray'}
            color={ativa ? undefined : 'fg.muted'}
            aria-label={rotulo}
            aria-pressed={ativa}
            title={atalho ? `${rotulo} (${atalho})` : rotulo}
            onClick={() => onSelecionarFerramenta(opcao)}
          >
            <Icone size={17} />
          </IconButton>
        )
      })}

      <Separador />

      <HStack gap={1} px={1}>
        {CORES_ANOTACAO.map((cor) => {
          const ativa = cor.valor === estilo.cor
          return (
            <Box
              as="button"
              key={cor.valor}
              aria-label={`Cor ${cor.nome}`}
              aria-pressed={ativa}
              title={cor.nome}
              w={6}
              h={6}
              borderRadius="full"
              borderWidth="2px"
              borderColor={ativa ? 'fg' : 'border.subtle'}
              outline={ativa ? '2px solid' : 'none'}
              outlineColor="bg.panel"
              outlineOffset="-4px"
              cursor="pointer"
              transition="transform 0.12s ease"
              _hover={{ transform: 'scale(1.12)' }}
              style={{ backgroundColor: cor.valor }}
              onClick={() => onSelecionarCor(cor.valor)}
            />
          )
        })}
      </HStack>

      <Separador />

      {NIVEIS_ESPESSURA.map((nivel) => {
        const ativo = nivel === estilo.nivelEspessura
        return (
          <IconButton
            key={nivel}
            size="sm"
            borderRadius="lg"
            variant={ativo ? 'subtle' : 'ghost'}
            colorPalette={ativo ? 'brand' : 'gray'}
            aria-label={`Espessura ${ROTULO_NIVEL_ESPESSURA[nivel]}`}
            aria-pressed={ativo}
            title={`Espessura ${ROTULO_NIVEL_ESPESSURA[nivel]}`}
            onClick={() => onSelecionarEspessura(nivel)}
          >
            <Box
              w={TAMANHO_PONTO_ESPESSURA[nivel]}
              h={TAMANHO_PONTO_ESPESSURA[nivel]}
              borderRadius="full"
              bg="currentColor"
            />
          </IconButton>
        )
      })}

      <Separador />

      <IconButton
        size="sm"
        borderRadius="lg"
        variant="ghost"
        color="fg.muted"
        aria-label="Desfazer"
        title="Desfazer (Ctrl + Z)"
        disabled={!podeDesfazer}
        onClick={onDesfazer}
      >
        <Undo2 size={17} />
      </IconButton>
      <IconButton
        size="sm"
        borderRadius="lg"
        variant="ghost"
        color="fg.muted"
        aria-label="Refazer"
        title="Refazer (Ctrl + Y)"
        disabled={!podeRefazer}
        onClick={onRefazer}
      >
        <Redo2 size={17} />
      </IconButton>
      <IconButton
        size="sm"
        borderRadius="lg"
        variant="ghost"
        color="fg.muted"
        _hover={{ color: 'cirqueira.red.500' }}
        aria-label="Limpar edições"
        title="Limpar todas as edições"
        disabled={!temAnotacoes}
        onClick={onLimpar}
      >
        <Trash2 size={17} />
      </IconButton>
    </HStack>
  )
})
