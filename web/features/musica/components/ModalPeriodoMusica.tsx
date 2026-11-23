import { Button, Dialog, HStack, Input, NativeSelect, Portal, Text, VStack } from '@chakra-ui/react'
import { X } from 'lucide-react'
import { type ReactNode, memo, useState } from 'react'
import type {
  PeriodoAnoSeletor,
  PeriodoMesSeletor,
  PeriodoPersonalizadoSeletor,
} from './SeletorPeriodoMusica'

export type ModoModalPeriodo = 'mes' | 'ano' | 'personalizado'

const NOMES_MESES = [
  'Janeiro',
  'Fevereiro',
  'Março',
  'Abril',
  'Maio',
  'Junho',
  'Julho',
  'Agosto',
  'Setembro',
  'Outubro',
  'Novembro',
  'Dezembro',
]

const TITULOS: Record<ModoModalPeriodo, string> = {
  mes: 'Escolher mês',
  ano: 'Escolher ano',
  personalizado: 'Período personalizado',
}

const PROPS_CAMPO = {
  size: 'sm',
  borderRadius: '8px',
  bg: 'cirqueira.musica.fundo',
  borderColor: 'cirqueira.musica.cartaoElevado',
  color: 'cirqueira.musica.textoPrincipal',
} as const

function Campo({ rotulo, children }: { rotulo: string; children: ReactNode }) {
  return (
    <VStack align="stretch" gap={1} flex={1}>
      <Text fontSize="xs" fontWeight="semibold" color="cirqueira.musica.textoSecundario">
        {rotulo}
      </Text>
      {children}
    </VStack>
  )
}

function SeletorAno({
  anos,
  valor,
  onMudar,
}: {
  anos: number[]
  valor: number
  onMudar: (ano: number) => void
}) {
  return (
    <NativeSelect.Root size="sm">
      <NativeSelect.Field
        {...PROPS_CAMPO}
        value={String(valor)}
        onChange={(evento) => onMudar(Number(evento.target.value))}
      >
        {anos.map((ano) => (
          <option key={ano} value={ano}>
            {ano}
          </option>
        ))}
      </NativeSelect.Field>
      <NativeSelect.Indicator />
    </NativeSelect.Root>
  )
}

export interface ModalPeriodoMusicaProps {
  modo: ModoModalPeriodo
  mes?: PeriodoMesSeletor
  ano?: PeriodoAnoSeletor
  personalizado?: PeriodoPersonalizadoSeletor
  onFechar: () => void
}

export const ModalPeriodoMusica = memo(function ModalPeriodoMusica({
  modo,
  mes,
  ano,
  personalizado,
  onFechar,
}: ModalPeriodoMusicaProps) {
  const [anoMes, setAnoMes] = useState(mes?.ano ?? new Date().getFullYear())
  const [numeroMes, setNumeroMes] = useState(mes?.mes ?? new Date().getMonth() + 1)
  const [anoEscolhido, setAnoEscolhido] = useState(ano?.ano ?? new Date().getFullYear())
  const [inicio, setInicio] = useState(personalizado?.inicio ?? '')
  const [fim, setFim] = useState(personalizado?.fim ?? '')
  const intervaloValido = inicio !== '' && fim !== '' && inicio <= fim

  function aplicar() {
    if (modo === 'mes' && mes) mes.onAplicar(anoMes, numeroMes)
    if (modo === 'ano' && ano) ano.onAplicar(anoEscolhido)
    if (modo === 'personalizado' && personalizado && intervaloValido)
      personalizado.onAplicar(inicio, fim)
    onFechar()
  }

  return (
    <Dialog.Root
      open
      onOpenChange={(detalhes) => !detalhes.open && onFechar()}
      placement="center"
      size="sm"
    >
      <Portal>
        <Dialog.Backdrop bg="blackAlpha.700" backdropFilter="blur(4px)" />
        <Dialog.Positioner p={4}>
          <Dialog.Content
            data-theme="dark"
            bg="cirqueira.musica.cartao"
            color="cirqueira.musica.textoPrincipal"
            border="1px solid"
            borderColor="cirqueira.musica.cartaoElevado"
            borderRadius="12px"
            fontFamily="inter"
          >
            <Dialog.Header px={5} pt={4} pb={2}>
              <HStack justify="space-between" w="full">
                <Dialog.Title fontSize="md" fontWeight="bold">
                  {TITULOS[modo]}
                </Dialog.Title>
                <Button
                  size="xs"
                  variant="ghost"
                  borderRadius="full"
                  color="cirqueira.musica.textoSecundario"
                  aria-label="Fechar"
                  onClick={onFechar}
                >
                  <X size={16} />
                </Button>
              </HStack>
            </Dialog.Header>
            <Dialog.Body px={5} pb={2}>
              {modo === 'mes' && mes && (
                <HStack gap={3} align="end">
                  <Campo rotulo="Mês">
                    <NativeSelect.Root size="sm">
                      <NativeSelect.Field
                        {...PROPS_CAMPO}
                        value={String(numeroMes)}
                        onChange={(evento) => setNumeroMes(Number(evento.target.value))}
                      >
                        {NOMES_MESES.map((nome, indice) => (
                          <option key={nome} value={indice + 1}>
                            {nome}
                          </option>
                        ))}
                      </NativeSelect.Field>
                      <NativeSelect.Indicator />
                    </NativeSelect.Root>
                  </Campo>
                  <Campo rotulo="Ano">
                    <SeletorAno anos={mes.anos} valor={anoMes} onMudar={setAnoMes} />
                  </Campo>
                </HStack>
              )}
              {modo === 'ano' && ano && (
                <Campo rotulo="Ano">
                  <SeletorAno anos={ano.anos} valor={anoEscolhido} onMudar={setAnoEscolhido} />
                </Campo>
              )}
              {modo === 'personalizado' && (
                <VStack align="stretch" gap={2}>
                  <HStack gap={3}>
                    <Campo rotulo="De">
                      <Input
                        {...PROPS_CAMPO}
                        type="date"
                        value={inicio}
                        max={fim || undefined}
                        onChange={(evento) => setInicio(evento.target.value)}
                      />
                    </Campo>
                    <Campo rotulo="Até">
                      <Input
                        {...PROPS_CAMPO}
                        type="date"
                        value={fim}
                        min={inicio || undefined}
                        onChange={(evento) => setFim(evento.target.value)}
                      />
                    </Campo>
                  </HStack>
                  {!intervaloValido && inicio !== '' && fim !== '' && (
                    <Text fontSize="xs" color="cirqueira.musica.amarelo">
                      A data inicial precisa ser antes da final.
                    </Text>
                  )}
                </VStack>
              )}
            </Dialog.Body>
            <Dialog.Footer px={5} pb={4} pt={3} gap={2}>
              <Button
                size="sm"
                variant="ghost"
                color="cirqueira.musica.textoSecundario"
                onClick={onFechar}
              >
                Cancelar
              </Button>
              <Button
                size="sm"
                borderRadius="full"
                bg="cirqueira.musica.verde"
                color="cirqueira.musica.fundo"
                _hover={{ bg: 'cirqueira.musica.verdeHover' }}
                disabled={modo === 'personalizado' && !intervaloValido}
                onClick={aplicar}
              >
                Aplicar
              </Button>
            </Dialog.Footer>
          </Dialog.Content>
        </Dialog.Positioner>
      </Portal>
    </Dialog.Root>
  )
})
