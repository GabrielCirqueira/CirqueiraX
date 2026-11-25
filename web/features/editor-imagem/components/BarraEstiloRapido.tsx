import { Box, HStack, IconButton, Text } from '@chakra-ui/react'
import { Copy, CopyPlus, Lock, type LucideIcon, MousePointerClick, Trash2 } from 'lucide-react'
import { memo } from 'react'
import type { EstiloExibido, NivelEspessura } from '../types'
import { CORES_RAPIDAS, NIVEIS_ESPESSURA, ROTULO_NIVEL_ESPESSURA } from '../utils/constantesEditor'
import { AmostraCor, SeletorCor } from './SeletorCor'

const TAMANHO_PONTO_ESPESSURA: Record<NivelEspessura, number> = {
  fina: 1.5,
  media: 2.5,
  grossa: 3.5,
}

function Separador() {
  return <Box w="1px" h={5} bg="border.subtle" mx={1} flexShrink={0} />
}

interface BotaoAcaoProps {
  rotulo: string
  icone: LucideIcon
  perigo?: boolean
  onClick: () => void
}

function BotaoAcao({ rotulo, icone: Icone, perigo, onClick }: BotaoAcaoProps) {
  return (
    <IconButton
      size="xs"
      variant="ghost"
      borderRadius="8px"
      color="fg.muted"
      flexShrink={0}
      _hover={perigo ? { color: 'cirqueira.red.500', bg: 'cirqueira.red.500/10' } : undefined}
      aria-label={rotulo}
      title={rotulo}
      onClick={onClick}
    >
      <Icone size={15} />
    </IconButton>
  )
}

export interface BarraEstiloRapidoProps {
  estilo: EstiloExibido
  coresRecentes: string[]
  rotuloAlvo: string | null
  /** Sem item selecionado e com o cursor ativo, não há o que estilizar: mostra só uma dica. */
  semAlvo: boolean
  temSelecao: boolean
  bloqueada: boolean
  mostrarEspessura: boolean
  onSelecionarCor: (cor: string) => void
  onSelecionarEspessura: (nivel: NivelEspessura) => void
  onCopiar: () => void
  onDuplicar: () => void
  onExcluir: () => void
}

/** Barra flutuante sobre a tela com o que mais se troca: cor, espessura e ações do item. */
export const BarraEstiloRapido = memo(function BarraEstiloRapido({
  estilo,
  coresRecentes,
  rotuloAlvo,
  semAlvo,
  temSelecao,
  bloqueada,
  mostrarEspessura,
  onSelecionarCor,
  onSelecionarEspessura,
  onCopiar,
  onDuplicar,
  onExcluir,
}: BarraEstiloRapidoProps) {
  const corAtual = estilo.cor.toUpperCase()

  if (semAlvo) {
    return (
      <HStack
        gap={2}
        px={3}
        py={2}
        bg="bg.panel"
        borderWidth="1px"
        borderColor="border.subtle"
        borderRadius="12px"
        shadow="md"
      >
        <MousePointerClick size={14} />
        <Text fontSize="xs" color="fg.muted">
          Clique num item para editar · arraste para mover · Ctrl + C / Ctrl + V duplica
        </Text>
      </HStack>
    )
  }

  return (
    <HStack
      gap={1}
      px={2}
      py={1.5}
      bg="bg.panel"
      borderWidth="1px"
      borderColor="border.subtle"
      borderRadius="12px"
      shadow="md"
      maxW="full"
      overflowX="auto"
    >
      {rotuloAlvo && (
        <>
          <HStack gap={1} px={1} flexShrink={0}>
            {bloqueada && <Lock size={12} />}
            <Text fontSize="xs" fontWeight="medium" color="fg" whiteSpace="nowrap">
              {rotuloAlvo}
            </Text>
          </HStack>
          <Separador />
        </>
      )}

      <HStack gap={1} flexShrink={0}>
        {CORES_RAPIDAS.map((cor) => (
          <AmostraCor
            key={cor.valor}
            cor={cor.valor}
            tamanho={5}
            ativa={cor.valor.toUpperCase() === corAtual}
            onClick={() => onSelecionarCor(cor.valor)}
          />
        ))}
        <SeletorCor
          valor={estilo.cor}
          rotulo="Mais cores"
          coresRecentes={coresRecentes}
          onConfirmar={onSelecionarCor}
        />
      </HStack>

      {mostrarEspessura && (
        <>
          <Separador />
          {NIVEIS_ESPESSURA.map((nivel) => {
            const ativo = nivel === estilo.nivelEspessura
            return (
              <IconButton
                key={nivel}
                size="xs"
                flexShrink={0}
                borderRadius="8px"
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
        </>
      )}

      {temSelecao && (
        <>
          <Separador />
          <BotaoAcao rotulo="Copiar item (Ctrl + C)" icone={Copy} onClick={onCopiar} />
          <BotaoAcao rotulo="Duplicar (Ctrl + D)" icone={CopyPlus} onClick={onDuplicar} />
          <BotaoAcao rotulo="Excluir (Delete)" icone={Trash2} perigo onClick={onExcluir} />
        </>
      )}
    </HStack>
  )
})
