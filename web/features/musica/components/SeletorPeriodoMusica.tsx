import { Box, Button, HStack, Menu, Portal, Text } from '@chakra-ui/react'
import { CalendarDays, CalendarRange, Check, ChevronDown, Clock } from 'lucide-react'
import { memo, useState } from 'react'
import { ModalPeriodoMusica, type ModoModalPeriodo } from './ModalPeriodoMusica'

export interface OpcaoSeletorPeriodo {
  chave: string
  rotulo: string
}

export interface PeriodoMesSeletor {
  ano: number
  mes: number
  anos: number[]
  onAplicar: (ano: number, mes: number) => void
}

export interface PeriodoAnoSeletor {
  ano: number
  anos: number[]
  onAplicar: (ano: number) => void
}

export interface PeriodoPersonalizadoSeletor {
  inicio: string
  fim: string
  onAplicar: (inicio: string, fim: string) => void
}

export interface SeletorPeriodoMusicaProps {
  opcoes: OpcaoSeletorPeriodo[]
  selecionada: string
  rotuloSelecionado?: string
  onSelecionar: (chave: string) => void
  mes?: PeriodoMesSeletor
  ano?: PeriodoAnoSeletor
  personalizado?: PeriodoPersonalizadoSeletor
}

export const CHAVE_PERIODO_MES = 'mes'
export const CHAVE_PERIODO_ANO = 'ano-escolhido'
export const CHAVE_PERIODO_PERSONALIZADO = 'personalizado'

const PROPS_ITEM = {
  fontSize: 'sm',
  color: 'cirqueira.musica.textoPrincipal',
  borderRadius: '6px',
  cursor: 'pointer',
  _highlighted: { bg: 'cirqueira.musica.cartaoElevado' },
} as const

export const SeletorPeriodoMusica = memo(function SeletorPeriodoMusica({
  opcoes,
  selecionada,
  rotuloSelecionado,
  onSelecionar,
  mes,
  ano,
  personalizado,
}: SeletorPeriodoMusicaProps) {
  const [modal, setModal] = useState<ModoModalPeriodo | null>(null)
  const rotulo =
    rotuloSelecionado ?? opcoes.find((opcao) => opcao.chave === selecionada)?.rotulo ?? 'Período'
  const temExtras = Boolean(mes || ano || personalizado)

  function escolher(chave: string) {
    if (chave === CHAVE_PERIODO_MES && mes) return setModal('mes')
    if (chave === CHAVE_PERIODO_ANO && ano) return setModal('ano')
    if (chave === CHAVE_PERIODO_PERSONALIZADO && personalizado) return setModal('personalizado')
    onSelecionar(chave)
  }

  return (
    <>
      <Menu.Root
        positioning={{ placement: 'bottom-end' }}
        onSelect={(detalhes) => escolher(detalhes.value)}
      >
        <Menu.Trigger asChild>
          <Button
            size="sm"
            h="34px"
            px={3.5}
            borderRadius="full"
            bg="cirqueira.musica.cartao"
            border="1px solid"
            borderColor="cirqueira.musica.cartaoElevado"
            color="cirqueira.musica.textoPrincipal"
            fontSize="xs"
            fontWeight="bold"
            flexShrink={0}
            maxW="full"
            _hover={{ borderColor: 'cirqueira.musica.verde' }}
            _expanded={{ borderColor: 'cirqueira.musica.verde' }}
            aria-label={`Período: ${rotulo}`}
          >
            <Clock size={14} color="var(--chakra-colors-cirqueira-musica-verde)" />
            <Text as="span" truncate>
              {rotulo}
            </Text>
            <ChevronDown size={14} />
          </Button>
        </Menu.Trigger>
        <Portal>
          <Menu.Positioner>
            <Menu.Content
              data-theme="dark"
              minW="220px"
              p={1.5}
              bg="cirqueira.musica.cartao"
              border="1px solid"
              borderColor="cirqueira.musica.cartaoElevado"
              borderRadius="10px"
              boxShadow="lg"
              fontFamily="inter"
            >
              {opcoes.map((opcao) => (
                <Menu.Item key={opcao.chave} value={opcao.chave} {...PROPS_ITEM}>
                  <Box flex={1}>{opcao.rotulo}</Box>
                  {opcao.chave === selecionada && (
                    <Check size={14} color="var(--chakra-colors-cirqueira-musica-verde)" />
                  )}
                </Menu.Item>
              ))}
              {temExtras && <Menu.Separator borderColor="cirqueira.musica.cartaoElevado" />}
              {mes && (
                <Menu.Item value={CHAVE_PERIODO_MES} {...PROPS_ITEM}>
                  <HStack flex={1} gap={2}>
                    <CalendarDays size={14} />
                    <Text>Escolher mês…</Text>
                  </HStack>
                  {selecionada === CHAVE_PERIODO_MES && (
                    <Check size={14} color="var(--chakra-colors-cirqueira-musica-verde)" />
                  )}
                </Menu.Item>
              )}
              {ano && (
                <Menu.Item value={CHAVE_PERIODO_ANO} {...PROPS_ITEM}>
                  <HStack flex={1} gap={2}>
                    <CalendarDays size={14} />
                    <Text>Escolher ano…</Text>
                  </HStack>
                  {selecionada === CHAVE_PERIODO_ANO && (
                    <Check size={14} color="var(--chakra-colors-cirqueira-musica-verde)" />
                  )}
                </Menu.Item>
              )}
              {personalizado && (
                <Menu.Item value={CHAVE_PERIODO_PERSONALIZADO} {...PROPS_ITEM}>
                  <HStack flex={1} gap={2}>
                    <CalendarRange size={14} />
                    <Text>Personalizado…</Text>
                  </HStack>
                  {selecionada === CHAVE_PERIODO_PERSONALIZADO && (
                    <Check size={14} color="var(--chakra-colors-cirqueira-musica-verde)" />
                  )}
                </Menu.Item>
              )}
            </Menu.Content>
          </Menu.Positioner>
        </Portal>
      </Menu.Root>

      {modal && (
        <ModalPeriodoMusica
          modo={modal}
          mes={mes}
          ano={ano}
          personalizado={personalizado}
          onFechar={() => setModal(null)}
        />
      )}
    </>
  )
})
