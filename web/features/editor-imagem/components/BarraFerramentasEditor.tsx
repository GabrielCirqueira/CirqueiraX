import {
  Box,
  Flex,
  IconButton,
  Kbd,
  Popover,
  Portal,
  SimpleGrid,
  Text,
  VStack,
} from '@chakra-ui/react'
import {
  Circle,
  Crop,
  Diamond,
  EyeOff,
  Hash,
  Hexagon,
  Highlighter,
  Keyboard,
  Lock,
  type LucideIcon,
  MessageSquare,
  Minus,
  MousePointer2,
  MoveUpRight,
  Pencil,
  Square,
  Star,
  Triangle,
  Type,
  Unlock,
} from 'lucide-react'
import { memo, useState } from 'react'
import type { FerramentaEditor, FerramentaForma } from '../types'
import { atalhoDaFerramenta } from '../utils/atalhosTeclado'
import { FERRAMENTAS_FORMA } from '../utils/constantesEditor'
import { isFerramentaForma } from '../utils/fabricaAnotacoes'

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

const FERRAMENTAS_DESENHO_ANTES: OpcaoFerramenta[] = [
  { ferramenta: 'seta', rotulo: 'Seta', icone: MoveUpRight },
  { ferramenta: 'linha', rotulo: 'Linha', icone: Minus },
]

const FERRAMENTAS_DESENHO_DEPOIS: OpcaoFerramenta[] = [
  { ferramenta: 'texto', rotulo: 'Texto', icone: Type },
  { ferramenta: 'pincel', rotulo: 'Pincel', icone: Pencil },
  { ferramenta: 'marcaTexto', rotulo: 'Marca-texto', icone: Highlighter },
  { ferramenta: 'numero', rotulo: 'Marcador numerado', icone: Hash },
]

const FERRAMENTAS_IMAGEM: OpcaoFerramenta[] = [
  { ferramenta: 'desfoque', rotulo: 'Esconder dados (pixelar)', icone: EyeOff },
  { ferramenta: 'recorte', rotulo: 'Recortar', icone: Crop },
]

const SELECIONAR: OpcaoFerramenta = {
  ferramenta: 'selecionar',
  rotulo: 'Selecionar e mover',
  icone: MousePointer2,
}

interface GrupoAtalhos {
  titulo: string
  itens: { teclas: string[]; descricao: string }[]
}

const ATALHOS: GrupoAtalhos[] = [
  {
    titulo: 'Itens',
    itens: [
      { teclas: ['Ctrl', 'C'], descricao: 'Copiar item (sem item: copia a imagem)' },
      { teclas: ['Ctrl', 'X'], descricao: 'Recortar item' },
      { teclas: ['Ctrl', 'V'], descricao: 'Colar item, imagem ou texto' },
      { teclas: ['Ctrl', 'D'], descricao: 'Duplicar' },
      { teclas: ['Delete'], descricao: 'Excluir' },
      { teclas: ['Setas'], descricao: 'Mover 1px (Shift: 10px)' },
      { teclas: ['[', ']'], descricao: 'Diminuir / aumentar' },
      { teclas: ['Ctrl', ']'], descricao: 'Subir camada (Shift: para a frente)' },
      { teclas: ['Alt'], descricao: 'Mover sem encaixar nas guias' },
      { teclas: ['Shift'], descricao: 'Reta, quadrado ou manter proporção' },
    ],
  },
  {
    titulo: 'Editor',
    itens: [
      { teclas: ['Ctrl', 'Z'], descricao: 'Desfazer' },
      { teclas: ['Ctrl', 'Y'], descricao: 'Refazer' },
      { teclas: ['Ctrl', 'Shift', 'C'], descricao: 'Copiar a imagem final' },
      { teclas: ['Ctrl', 'S'], descricao: 'Salvar' },
      { teclas: ['Ctrl', '+ / -'], descricao: 'Zoom (ou Ctrl + roda do mouse)' },
      { teclas: ['Ctrl', '0'], descricao: 'Ajustar à tela' },
      { teclas: ['Ctrl', '1'], descricao: 'Tamanho real' },
      { teclas: ['Q'], descricao: 'Travar a ferramenta' },
      { teclas: ['Esc'], descricao: 'Soltar seleção / voltar ao cursor' },
    ],
  },
]

function Separador() {
  return (
    <Box
      flexShrink={0}
      bg="border.subtle"
      w={{ base: '1px', lg: 6 }}
      h={{ base: 6, lg: '1px' }}
      my={{ base: 0, lg: 1 }}
      mx={{ base: 1, lg: 0 }}
    />
  )
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
      flexShrink={0}
      borderRadius="10px"
      variant={ativa ? 'solid' : 'ghost'}
      colorPalette={ativa ? 'brand' : 'gray'}
      color={ativa ? undefined : 'fg.muted'}
      aria-label={opcao.rotulo}
      aria-pressed={ativa}
      title={titulo(opcao.rotulo, opcao.ferramenta)}
      onClick={() => onSelecionar(opcao.ferramenta)}
    >
      <Icone size={18} />
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
    <Popover.Root
      open={aberto}
      onOpenChange={({ open }) => setAberto(open)}
      positioning={{ placement: 'right-start', gutter: 10 }}
      lazyMount
      unmountOnExit
    >
      <Box position="relative" flexShrink={0}>
        <IconButton
          size="sm"
          borderRadius="10px"
          variant={ativa ? 'solid' : 'ghost'}
          colorPalette={ativa ? 'brand' : 'gray'}
          color={ativa ? undefined : 'fg.muted'}
          aria-label={ROTULO_FORMA[formaAtual]}
          aria-pressed={ativa}
          title={`${titulo(ROTULO_FORMA[formaAtual], formaAtual)} · clique de novo para ver todas`}
          onClick={() => (ativa ? setAberto(true) : onSelecionar(formaAtual))}
        >
          <Icone size={18} />
        </IconButton>
        <Popover.Trigger asChild>
          <Box
            as="button"
            position="absolute"
            right="1px"
            bottom="1px"
            w="10px"
            h="10px"
            cursor="pointer"
            aria-label="Mais formas"
            title="Mais formas"
            color={ativa ? 'white' : 'fg.subtle'}
            _hover={{ color: ativa ? 'white' : 'fg' }}
          >
            <svg viewBox="0 0 10 10" width="10" height="10" aria-hidden="true">
              <path d="M9 3 L9 9 L3 9 Z" fill="currentColor" />
            </svg>
          </Box>
        </Popover.Trigger>
      </Box>
      <Portal>
        <Popover.Positioner>
          <Popover.Content w="auto">
            <Popover.Body p={2}>
              <Text fontSize="2xs" fontWeight="semibold" color="fg.subtle" px={1} pb={1.5}>
                FORMAS
              </Text>
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
                      py={2}
                      minW="68px"
                      borderRadius="8px"
                      cursor="pointer"
                      bg={selecionada ? 'cirqueira.brand.500/12' : 'transparent'}
                      color={selecionada ? 'cirqueira.brand.500' : 'fg.muted'}
                      _hover={{ bg: 'bg.muted', color: 'fg' }}
                      title={titulo(ROTULO_FORMA[forma], forma)}
                      onClick={() => escolher(forma)}
                    >
                      <IconeForma size={22} />
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
  )
}

function AjudaAtalhos() {
  return (
    <Popover.Root positioning={{ placement: 'right-end', gutter: 10 }} lazyMount unmountOnExit>
      <Popover.Trigger asChild>
        <IconButton
          size="sm"
          flexShrink={0}
          borderRadius="10px"
          variant="ghost"
          color="fg.muted"
          aria-label="Atalhos do teclado"
          title="Atalhos do teclado"
        >
          <Keyboard size={18} />
        </IconButton>
      </Popover.Trigger>
      <Portal>
        <Popover.Positioner>
          <Popover.Content w="340px" maxH="80dvh" overflowY="auto">
            <Popover.Body p={4}>
              <VStack gap={4} alignItems="stretch">
                {ATALHOS.map((grupo) => (
                  <VStack key={grupo.titulo} gap={1.5} alignItems="stretch">
                    <Text fontSize="2xs" fontWeight="semibold" color="fg.subtle">
                      {grupo.titulo.toUpperCase()}
                    </Text>
                    {grupo.itens.map((item) => (
                      <Flex key={item.descricao} justify="space-between" gap={3} align="center">
                        <Text fontSize="xs" color="fg.muted">
                          {item.descricao}
                        </Text>
                        <Flex gap={1} flexShrink={0}>
                          {item.teclas.map((tecla) => (
                            <Kbd key={tecla} size="sm">
                              {tecla}
                            </Kbd>
                          ))}
                        </Flex>
                      </Flex>
                    ))}
                  </VStack>
                ))}
                <Text fontSize="2xs" color="fg.subtle">
                  Letras trocam de ferramenta: V cursor, A seta, L linha, R retângulo, E círculo, G
                  triângulo, S estrela, T texto, B pincel, H marca-texto, N marcador, D pixelar, C
                  recortar.
                </Text>
              </VStack>
            </Popover.Body>
          </Popover.Content>
        </Popover.Positioner>
      </Portal>
    </Popover.Root>
  )
}

export interface BarraFerramentasEditorProps {
  ferramenta: FerramentaEditor
  travarFerramenta: boolean
  onSelecionarFerramenta: (ferramenta: FerramentaEditor) => void
  onAlternarTravar: () => void
}

export const BarraFerramentasEditor = memo(function BarraFerramentasEditor({
  ferramenta,
  travarFerramenta,
  onSelecionarFerramenta,
  onAlternarTravar,
}: BarraFerramentasEditorProps) {
  const botao = (opcao: OpcaoFerramenta) => (
    <BotaoFerramenta
      key={opcao.ferramenta}
      opcao={opcao}
      ativa={opcao.ferramenta === ferramenta}
      onSelecionar={onSelecionarFerramenta}
    />
  )

  return (
    <Flex
      as="nav"
      aria-label="Ferramentas"
      direction={{ base: 'row', lg: 'column' }}
      align="center"
      gap={1}
      p={1.5}
      bg="bg.panel"
      borderColor="border.subtle"
      borderBottomWidth={{ base: '1px', lg: 0 }}
      borderRightWidth={{ base: 0, lg: '1px' }}
      overflowX={{ base: 'auto', lg: 'visible' }}
      overflowY={{ base: 'visible', lg: 'auto' }}
      flexShrink={0}
    >
      {botao(SELECIONAR)}
      <Separador />
      {FERRAMENTAS_DESENHO_ANTES.map(botao)}
      <MenuFormas ferramenta={ferramenta} onSelecionar={onSelecionarFerramenta} />
      {FERRAMENTAS_DESENHO_DEPOIS.map(botao)}
      <Separador />
      {FERRAMENTAS_IMAGEM.map(botao)}

      <Box flex="1" minW={2} minH={2} />

      <IconButton
        size="sm"
        flexShrink={0}
        borderRadius="10px"
        variant={travarFerramenta ? 'subtle' : 'ghost'}
        colorPalette={travarFerramenta ? 'brand' : 'gray'}
        color={travarFerramenta ? undefined : 'fg.muted'}
        aria-label="Manter a ferramenta ativa"
        aria-pressed={travarFerramenta}
        title={
          travarFerramenta
            ? 'Ferramenta travada: continua desenhando depois de cada item (Q)'
            : 'Depois de desenhar, volta para o cursor. Clique para travar a ferramenta (Q)'
        }
        onClick={onAlternarTravar}
      >
        {travarFerramenta ? <Lock size={17} /> : <Unlock size={17} />}
      </IconButton>
      <AjudaAtalhos />
    </Flex>
  )
})
