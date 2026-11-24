import {
  Box,
  ColorPicker,
  HStack,
  Popover,
  Portal,
  SimpleGrid,
  Text,
  VStack,
  parseColor,
} from '@chakra-ui/react'
import { Check } from 'lucide-react'
import { memo, useMemo, useState } from 'react'
import { PALETA_CORES } from '../utils/constantesEditor'

const FORMATO_HEXADECIMAL = /^#[0-9a-f]{6}$/i

function normalizarCor(cor: string): string {
  return cor.toUpperCase()
}

function lerCor(cor: string) {
  try {
    return parseColor(FORMATO_HEXADECIMAL.test(cor) ? cor : '#000000')
  } catch {
    return parseColor('#000000')
  }
}

interface AmostraProps {
  cor: string
  ativa: boolean
  tamanho?: number
  onClick: () => void
}

export function AmostraCor({ cor, ativa, tamanho = 6, onClick }: AmostraProps) {
  return (
    <Box
      as="button"
      aria-label={`Cor ${cor}`}
      aria-pressed={ativa}
      title={cor}
      w={tamanho}
      h={tamanho}
      borderRadius="full"
      borderWidth="2px"
      borderColor={ativa ? 'fg' : 'border.subtle'}
      outline={ativa ? '2px solid' : 'none'}
      outlineColor="bg.panel"
      outlineOffset="-4px"
      cursor="pointer"
      flexShrink={0}
      transition="transform 0.12s ease"
      _hover={{ transform: 'scale(1.12)' }}
      style={{ backgroundColor: cor }}
      onClick={onClick}
    />
  )
}

export interface SeletorCorProps {
  valor: string
  rotulo: string
  coresRecentes: string[]
  tamanho?: number
  onPrevisualizar?: (cor: string) => void
  onCancelarPrevisualizacao?: () => void
  onConfirmar: (cor: string) => void
}

export const SeletorCor = memo(function SeletorCor({
  valor,
  rotulo,
  coresRecentes,
  tamanho = 7,
  onPrevisualizar,
  onCancelarPrevisualizacao,
  onConfirmar,
}: SeletorCorProps) {
  const [aberto, setAberto] = useState(false)
  const [rascunho, setRascunho] = useState(valor)
  const corDoSeletor = useMemo(() => lerCor(rascunho), [rascunho])
  const atual = normalizarCor(valor)

  function confirmar(cor: string) {
    const final = normalizarCor(cor)
    setRascunho(final)
    if (final !== atual) onConfirmar(final)
  }

  function alternar(proximo: boolean) {
    setAberto(proximo)
    if (proximo) {
      setRascunho(valor)
      return
    }
    if (normalizarCor(rascunho) !== atual) {
      confirmar(rascunho)
      return
    }
    onCancelarPrevisualizacao?.()
  }

  return (
    <Popover.Root
      open={aberto}
      onOpenChange={({ open }) => alternar(open)}
      positioning={{ placement: 'bottom-start' }}
      lazyMount
      unmountOnExit
    >
      <Popover.Trigger asChild>
        <Box
          as="button"
          aria-label={`${rotulo}: ${valor}`}
          title={`${rotulo} — escolher qualquer cor`}
          w={tamanho}
          h={tamanho}
          borderRadius="full"
          cursor="pointer"
          flexShrink={0}
          borderWidth="2px"
          borderColor="border"
          position="relative"
          style={{
            background:
              'conic-gradient(from 0deg, #ff3b30, #ffd60a, #30d158, #64d2ff, #0a84ff, #bf5af2, #ff2d55, #ff3b30)',
          }}
        >
          <Box
            position="absolute"
            inset="3px"
            borderRadius="full"
            borderWidth="2px"
            borderColor="bg.panel"
            style={{ backgroundColor: valor }}
          />
        </Box>
      </Popover.Trigger>
      <Portal>
        <Popover.Positioner>
          <Popover.Content w="272px">
            <Popover.Body p={3}>
              <VStack gap={3} alignItems="stretch">
                <Text fontSize="xs" fontWeight="semibold" color="fg.muted">
                  {rotulo}
                </Text>

                <SimpleGrid columns={7} gap={1.5}>
                  {PALETA_CORES.map((cor) => (
                    <AmostraCor
                      key={cor}
                      cor={cor}
                      tamanho={7}
                      ativa={normalizarCor(cor) === atual}
                      onClick={() => confirmar(cor)}
                    />
                  ))}
                </SimpleGrid>

                {coresRecentes.length > 0 && (
                  <VStack gap={1.5} alignItems="stretch">
                    <Text fontSize="2xs" color="fg.subtle" textTransform="uppercase">
                      Recentes
                    </Text>
                    <HStack gap={1.5} flexWrap="wrap">
                      {coresRecentes.map((cor) => (
                        <AmostraCor
                          key={cor}
                          cor={cor}
                          tamanho={6}
                          ativa={normalizarCor(cor) === atual}
                          onClick={() => confirmar(cor)}
                        />
                      ))}
                    </HStack>
                  </VStack>
                )}

                <Text fontSize="2xs" color="fg.subtle" textTransform="uppercase">
                  Qualquer cor
                </Text>
                <ColorPicker.Root
                  inline
                  open
                  value={corDoSeletor}
                  onValueChange={({ value }) => {
                    const cor = normalizarCor(value.toString('hex'))
                    setRascunho(cor)
                    onPrevisualizar?.(cor)
                  }}
                  onValueChangeEnd={({ value }) => confirmar(value.toString('hex'))}
                >
                  <VStack gap={2.5} alignItems="stretch">
                    <ColorPicker.Area h="140px" borderRadius="8px" />
                    <ColorPicker.ChannelSlider channel="hue" />
                    <HStack gap={2}>
                      <ColorPicker.EyeDropper
                        size="xs"
                        variant="outline"
                        title="Pegar cor da tela"
                      />
                      <Box flex="1">
                        <ColorPicker.ChannelInput
                          channel="hex"
                          onKeyDown={(evento) => {
                            if (evento.key === 'Enter') confirmar(rascunho)
                          }}
                        />
                      </Box>
                      <Box
                        as="button"
                        title="Usar esta cor"
                        aria-label="Usar esta cor"
                        display="inline-flex"
                        alignItems="center"
                        justifyContent="center"
                        w={7}
                        h={7}
                        borderRadius="8px"
                        cursor="pointer"
                        bg="cirqueira.brand.500"
                        color="white"
                        onClick={() => {
                          confirmar(rascunho)
                          setAberto(false)
                        }}
                      >
                        <Check size={14} />
                      </Box>
                    </HStack>
                  </VStack>
                </ColorPicker.Root>
              </VStack>
            </Popover.Body>
          </Popover.Content>
        </Popover.Positioner>
      </Portal>
    </Popover.Root>
  )
})
