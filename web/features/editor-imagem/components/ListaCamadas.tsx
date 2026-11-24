import { Box, HStack, IconButton, Text, VStack } from '@chakra-ui/react'
import {
  ChevronDown,
  ChevronUp,
  Crop,
  EyeOff,
  Hash,
  Highlighter,
  type LucideIcon,
  Minus,
  MoveUpRight,
  Pencil,
  Trash2,
  Type,
} from 'lucide-react'
import { memo } from 'react'
import type { Anotacao, DirecaoCamada } from '../types'
import { isFerramentaForma } from '../utils/fabricaAnotacoes'
import { ROTULO_TIPO_ANOTACAO } from '../utils/propriedadesPainel'
import { ICONE_FORMA } from './BarraFerramentasEditor'

const ICONE_TIPO: Partial<Record<Anotacao['tipo'], LucideIcon>> = {
  seta: MoveUpRight,
  linha: Minus,
  pincel: Pencil,
  marcaTexto: Highlighter,
  texto: Type,
  numero: Hash,
  desfoque: EyeOff,
  recorte: Crop,
}

const LIMITE_CARACTERES_TEXTO = 28

function iconeDa(anotacao: Anotacao): LucideIcon {
  if (isFerramentaForma(anotacao.tipo)) return ICONE_FORMA[anotacao.tipo]
  return ICONE_TIPO[anotacao.tipo] ?? Pencil
}

function descricaoDa(anotacao: Anotacao): string {
  if (anotacao.tipo === 'texto') {
    const texto = anotacao.texto.replace(/\s+/g, ' ')
    return texto.length > LIMITE_CARACTERES_TEXTO
      ? `${texto.slice(0, LIMITE_CARACTERES_TEXTO)}…`
      : texto
  }
  if (anotacao.tipo === 'numero') return `Marcador ${anotacao.numero}`
  return ROTULO_TIPO_ANOTACAO[anotacao.tipo]
}

export interface ListaCamadasProps {
  anotacoes: Anotacao[]
  selecionadaId: string | null
  onSelecionar: (id: string) => void
  onMover: (direcao: DirecaoCamada, id: string) => void
  onExcluir: (id: string) => void
}

export const ListaCamadas = memo(function ListaCamadas({
  anotacoes,
  selecionadaId,
  onSelecionar,
  onMover,
  onExcluir,
}: ListaCamadasProps) {
  const camadas = anotacoes.filter((anotacao) => anotacao.tipo !== 'recorte')
  if (camadas.length === 0) return null
  const ordenadas = [...camadas].reverse()

  return (
    <VStack
      gap={1}
      alignItems="stretch"
      p={3}
      bg="bg.panel"
      borderWidth="1px"
      borderColor="border.subtle"
      borderRadius="8px"
      shadow="sm"
    >
      <HStack justify="space-between" mb={1}>
        <Text fontSize="sm" fontWeight="semibold" color="fg">
          Camadas
        </Text>
        <Text fontSize="2xs" color="fg.subtle">
          {camadas.length} {camadas.length === 1 ? 'item' : 'itens'}
        </Text>
      </HStack>
      <VStack gap={0.5} alignItems="stretch" maxH="240px" overflowY="auto">
        {ordenadas.map((anotacao, indice) => {
          const Icone = iconeDa(anotacao)
          const ativa = anotacao.id === selecionadaId
          return (
            <HStack
              key={anotacao.id}
              gap={2}
              px={2}
              py={1}
              borderRadius="8px"
              cursor="pointer"
              bg={ativa ? 'cirqueira.brand.500/12' : 'transparent'}
              _hover={{ bg: ativa ? 'cirqueira.brand.500/16' : 'bg.muted' }}
              onClick={() => onSelecionar(anotacao.id)}
            >
              <Box
                w={3}
                h={3}
                borderRadius="full"
                flexShrink={0}
                borderWidth="1px"
                borderColor="border"
                style={{ backgroundColor: anotacao.cor }}
              />
              <Icone size={14} />
              <Text fontSize="xs" flex="1" truncate color={ativa ? 'fg' : 'fg.muted'}>
                {descricaoDa(anotacao)}
              </Text>
              <HStack gap={0} onClick={(evento) => evento.stopPropagation()}>
                <IconButton
                  size="2xs"
                  variant="ghost"
                  color="fg.subtle"
                  aria-label="Subir camada"
                  title="Subir"
                  disabled={indice === 0}
                  onClick={() => onMover('subir', anotacao.id)}
                >
                  <ChevronUp size={13} />
                </IconButton>
                <IconButton
                  size="2xs"
                  variant="ghost"
                  color="fg.subtle"
                  aria-label="Descer camada"
                  title="Descer"
                  disabled={indice === ordenadas.length - 1}
                  onClick={() => onMover('descer', anotacao.id)}
                >
                  <ChevronDown size={13} />
                </IconButton>
                <IconButton
                  size="2xs"
                  variant="ghost"
                  color="fg.subtle"
                  _hover={{ color: 'cirqueira.red.500' }}
                  aria-label="Excluir"
                  title="Excluir"
                  onClick={() => onExcluir(anotacao.id)}
                >
                  <Trash2 size={13} />
                </IconButton>
              </HStack>
            </HStack>
          )
        })}
      </VStack>
    </VStack>
  )
})
