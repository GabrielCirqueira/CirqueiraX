import { Box, HStack, IconButton, Popover, Portal, SimpleGrid, Text } from '@chakra-ui/react'
import {
  ChevronDown,
  Circle,
  Crop,
  Diamond,
  EyeOff,
  Hash,
  Hexagon,
  Highlighter,
  type LucideIcon,
  MessageSquare,
  Minus,
  MousePointer2,
  MoveUpRight,
  Pencil,
  Redo2,
  Square,
  Star,
  Trash2,
  Triangle,
  Type,
  Undo2,
} from 'lucide-react'
import { memo, useState } from 'react'
import type { EstiloExibido, FerramentaEditor, FerramentaForma, NivelEspessura } from '../types'
import { atalhoDaFerramenta } from '../utils/atalhosTeclado'
import {
  CORES_RAPIDAS,
  FERRAMENTAS_FORMA,
  NIVEIS_ESPESSURA,
  ROTULO_NIVEL_ESPESSURA,
} from '../utils/constantesEditor'
import { isFerramentaForma } from '../utils/fabricaAnotacoes'
import { AmostraCor, SeletorCor } from './SeletorCor'

interface OpcaoFerramenta {
  ferramenta: FerramentaEditor
  rotulo: string
  icone: LucideIcon
}

export const ICONE_FORMA: Record<FerramentaForma, LucideIcon> = {
  retangulo: Square,
  elipse: Circle,
  triangulo: Triangle,
  losango: Diamond,
  estrela: Star,
  hexagono: Hexagon,
  balao: MessageSquare,
}

export const ROTULO_FORMA: Record<FerramentaForma, string> = {
  retangulo: 'Retângulo',
  elipse: 'Círculo',
  triangulo: 'Triângulo',
  losango: 'Losango',
  estrela: 'Estrela',
  hexagono: 'Hexágono',
  balao: 'Balão de fala',
}

const FERRAMENTAS_ANTES_DAS_FORMAS: OpcaoFerramenta[] = [
  { ferramenta: 'selecionar', rotulo: 'Selecionar e mover', icone: MousePointer2 },
  { ferramenta: 'seta', rotulo: 'Seta', icone: MoveUpRight },
]

const FERRAMENTAS_DEPOIS_DAS_FORMAS: OpcaoFerramenta[] = [
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

function titulo(rotulo: string, ferramenta: FerramentaEditor): string {
  const atalho = atalhoDaFerramenta(ferramenta)
  return atalho ? `${rotulo} (${atalho})` : rotulo
}

interface BotaoFerramentaProps {
  opcao: OpcaoFerramenta
  ativa: boolean
  onSelecionar: (ferramenta: FerramentaEditor) => void
}

function BotaoFerramenta({ opcao, ativa, onSelecionar }: BotaoFerramentaProps) {
  const Icone = opcao.icone
  return (
    <IconButton
      size="sm"
      borderRadius="full"
      variant={ativa ? 'solid' : 'ghost'}
      colorPalette={ativa ? 'brand' : 'gray'}
      color={ativa ? undefined : 'fg.muted'}
      aria-label={opcao.rotulo}
      aria-pressed={ativa}
      title={titulo(opcao.rotulo, opcao.ferramenta)}
      onClick={() => onSelecionar(opcao.ferramenta)}
    >
      <Icone size={17} />
    </IconButton>
  )
}

interface MenuFormasProps {
  ferramenta: FerramentaEditor
  onSelecionar: (ferramenta: FerramentaEditor) => void
}

function MenuFormas({ ferramenta, onSelecionar }: MenuFormasProps) {
  const [aberto, setAberto] = useState(false)
  const [ultimaForma, setUltimaForma] = useState<FerramentaForma>('retangulo')
  const formaAtual = isFerramentaForma(ferramenta) ? ferramenta : ultimaForma
  const ativa = isFerramentaForma(ferramenta)
  const Icone = ICONE_FORMA[formaAtual]

  function escolher(forma: FerramentaForma) {
    setUltimaForma(forma)
    onSelecionar(forma)
    setAberto(false)
  }

  return (
    <HStack gap={0}>
      <IconButton
        size="sm"
        borderRadius="full"
        borderEndRadius={0}
        variant={ativa ? 'solid' : 'ghost'}
        colorPalette={ativa ? 'brand' : 'gray'}
        color={ativa ? undefined : 'fg.muted'}
        aria-label={ROTULO_FORMA[formaAtual]}
        aria-pressed={ativa}
        title={titulo(ROTULO_FORMA[formaAtual], formaAtual)}
        onClick={() => onSelecionar(formaAtual)}
      >
        <Icone size={17} />
      </IconButton>
      <Popover.Root
        open={aberto}
        onOpenChange={({ open }) => setAberto(open)}
        positioning={{ placement: 'bottom' }}
        lazyMount
        unmountOnExit
      >
        <Popover.Trigger asChild>
          <IconButton
            size="sm"
            minW={5}
            w={5}
            borderRadius="full"
            borderStartRadius={0}
            variant={ativa ? 'solid' : 'ghost'}
            colorPalette={ativa ? 'brand' : 'gray'}
            color={ativa ? undefined : 'fg.muted'}
            aria-label="Mais formas"
            title="Mais formas"
          >
            <ChevronDown size={13} />
          </IconButton>
        </Popover.Trigger>
        <Portal>
          <Popover.Positioner>
            <Popover.Content w="auto">
              <Popover.Body p={2}>
                <SimpleGrid columns={4} gap={1}>
                  {FERRAMENTAS_FORMA.map((forma) => {
                    const IconeForma = ICONE_FORMA[forma]
                    const selecionada = forma === ferramenta
                    return (
                      <Box
                        as="button"
                        key={forma}
                        display="flex"
                        flexDirection="column"
                        alignItems="center"
                        gap={1}
                        px={2}
                        py={1.5}
                        minW="64px"
                        borderRadius="8px"
                        cursor="pointer"
                        bg={selecionada ? 'cirqueira.brand.500/12' : 'transparent'}
                        color={selecionada ? 'cirqueira.brand.500' : 'fg.muted'}
                        _hover={{ bg: 'bg.muted', color: 'fg' }}
                        title={titulo(ROTULO_FORMA[forma], forma)}
                        onClick={() => escolher(forma)}
                      >
                        <IconeForma size={20} />
                        <Text fontSize="2xs">{ROTULO_FORMA[forma]}</Text>
                      </Box>
                    )
                  })}
                </SimpleGrid>
              </Popover.Body>
            </Popover.Content>
          </Popover.Positioner>
        </Portal>
      </Popover.Root>
    </HStack>
  )
}

export interface BarraFerramentasEditorProps {
  ferramenta: FerramentaEditor
  estilo: EstiloExibido
  coresRecentes: string[]
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
  coresRecentes,
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
  const corAtual = estilo.cor.toUpperCase()

  return (
    <HStack
      gap={0.5}
      p={1.5}
      bg="bg.panel"
      borderWidth="1px"
      borderColor="border.subtle"
      borderRadius="8px"
      shadow="sm"
      flexWrap="wrap"
      justify="center"
      alignSelf="center"
      maxW="full"
    >
      {FERRAMENTAS_ANTES_DAS_FORMAS.map((opcao) => (
        <BotaoFerramenta
          key={opcao.ferramenta}
          opcao={opcao}
          ativa={opcao.ferramenta === ferramenta}
          onSelecionar={onSelecionarFerramenta}
        />
      ))}
      <MenuFormas ferramenta={ferramenta} onSelecionar={onSelecionarFerramenta} />
      {FERRAMENTAS_DEPOIS_DAS_FORMAS.map((opcao) => (
        <BotaoFerramenta
          key={opcao.ferramenta}
          opcao={opcao}
          ativa={opcao.ferramenta === ferramenta}
          onSelecionar={onSelecionarFerramenta}
        />
      ))}

      <Separador />

      <HStack gap={1} px={1}>
        {CORES_RAPIDAS.map((cor) => (
          <AmostraCor
            key={cor.valor}
            cor={cor.valor}
            ativa={cor.valor.toUpperCase() === corAtual}
            onClick={() => onSelecionarCor(cor.valor)}
          />
        ))}
        <SeletorCor
          valor={estilo.cor}
          rotulo="Cor"
          coresRecentes={coresRecentes}
          onConfirmar={onSelecionarCor}
        />
      </HStack>

      <Separador />

      {NIVEIS_ESPESSURA.map((nivel) => {
        const ativo = nivel === estilo.nivelEspessura
        return (
          <IconButton
            key={nivel}
            size="sm"
            borderRadius="full"
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
        borderRadius="full"
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
        borderRadius="full"
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
        borderRadius="full"
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
