import {
  Badge,
  Box,
  Button,
  Dialog,
  Field,
  Flex,
  Grid,
  HStack,
  IconButton,
  Input,
  NativeSelect,
  Portal,
  Text,
  VStack,
} from '@chakra-ui/react'
import {
  ArrowDownUp,
  Calendar,
  CalendarClock,
  Clock,
  Dices,
  Info,
  Loader2,
  RotateCcw,
  Sparkles,
  X,
} from 'lucide-react'
import { memo, useEffect, useMemo, useState } from 'react'
import type { ItemDistribuicaoHorario, MediaItem } from '../types'
import { formatarDataMidia, formatarHorarioMidia } from '../utils/formatadores'
import {
  calcularDistribuicaoOrganica,
  calcularDistribuicaoRetroativa,
  calcularDistribuicaoUniforme,
  combinarDataHora,
  deslocarDataHora,
  extrairDataHoraInicial,
  formatarDataIsoLocal,
} from '../utils/metadataEdicao'

export interface ModalDistribuirHorariosLoteProps {
  aberto: boolean
  itens: MediaItem[]
  onFechar: () => void
  onSalvar: (itens: ItemDistribuicaoHorario[]) => void
  pendente?: boolean
}

type ModoDistribuicao = 'uniforme' | 'retroativo' | 'organico'

export const ModalDistribuirHorariosLote = memo(function ModalDistribuirHorariosLote({
  aberto,
  itens,
  onFechar,
  onSalvar,
  pendente = false,
}: ModalDistribuirHorariosLoteProps) {
  const total = itens.length

  const dataHoraMaisRecente = useMemo(() => {
    const hoje = formatarDataIsoLocal(new Date())
    const agoraHora = `${String(new Date().getHours()).padStart(2, '0')}:${String(new Date().getMinutes()).padStart(2, '0')}`
    if (itens.length === 0) return { data: hoje, hora: agoraHora }
    const primeiro = itens[0] ?? null
    const ext = extrairDataHoraInicial(primeiro)
    return {
      data: ext.data || hoje,
      hora: ext.hora || agoraHora,
    }
  }, [itens])

  const [modo, setModo] = useState<ModoDistribuicao>('retroativo')
  const [dataBase, setDataBase] = useState(dataHoraMaisRecente.data)
  const [horaInicioUniforme, setHoraInicioUniforme] = useState('08:30')
  const [horaFimUniforme, setHoraFimUniforme] = useState('22:30')
  const [horaBaseRetroativa, setHoraBaseRetroativa] = useState(dataHoraMaisRecente.hora)
  const [passoRetroativoMinutos, setPassoRetroativoMinutos] = useState(120)
  const [ajustesManuais, setAjustesManuais] = useState<
    Record<string, { data: string; hora: string }>
  >({})

  useEffect(() => {
    if (aberto && itens.length > 0) {
      const hoje = formatarDataIsoLocal(new Date())
      const agoraHora = `${String(new Date().getHours()).padStart(2, '0')}:${String(new Date().getMinutes()).padStart(2, '0')}`
      const primeiro = itens[0] ?? null
      const ext = extrairDataHoraInicial(primeiro)
      setDataBase(ext.data || hoje)
      setHoraBaseRetroativa(ext.hora || agoraHora)
      setAjustesManuais({})
    }
  }, [aberto, itens])

  const listaHorariosCalculados = useMemo(() => {
    if (total === 0) return []

    let horas: string[] = []
    if (modo === 'uniforme') {
      horas = calcularDistribuicaoUniforme(total, horaInicioUniforme, horaFimUniforme)
    } else if (modo === 'retroativo') {
      horas = calcularDistribuicaoRetroativa(horaBaseRetroativa, passoRetroativoMinutos, total)
    } else {
      horas = calcularDistribuicaoOrganica(total)
    }

    return itens.map((item, index) => {
      const horaPadrao = horas[index] ?? '12:00'
      const manual = ajustesManuais[item.uuid]
      return {
        uuid: item.uuid,
        item,
        data: manual?.data ?? dataBase,
        hora: manual?.hora ?? horaPadrao,
      }
    })
  }, [
    total,
    itens,
    modo,
    dataBase,
    horaInicioUniforme,
    horaFimUniforme,
    horaBaseRetroativa,
    passoRetroativoMinutos,
    ajustesManuais,
  ])

  const handleAlterarLinha = (uuid: string, campo: 'data' | 'hora', valor: string) => {
    setAjustesManuais((prev) => {
      const atual = prev[uuid] || {
        data: dataBase,
        hora: listaHorariosCalculados.find((l) => l.uuid === uuid)?.hora || '12:00',
      }
      return {
        ...prev,
        [uuid]: {
          ...atual,
          [campo]: valor,
        },
      }
    })
  }

  const handleDeslocarLinha = (uuid: string, deltaMinutos: number) => {
    const atual = listaHorariosCalculados.find((l) => l.uuid === uuid)
    if (!atual) return
    const res = deslocarDataHora(atual.data, atual.hora, 0, deltaMinutos)
    setAjustesManuais((prev) => ({
      ...prev,
      [uuid]: {
        data: res.data,
        hora: res.hora,
      },
    }))
  }

  const handleResetarAjustes = () => {
    setAjustesManuais({})
  }

  const handleConfirmar = () => {
    const payload: ItemDistribuicaoHorario[] = listaHorariosCalculados.map((linha) => ({
      uuid: linha.uuid,
      data: combinarDataHora(linha.data, linha.hora) ?? `${linha.data} ${linha.hora}:00`,
    }))
    onSalvar(payload)
  }

  return (
    <Dialog.Root open={aberto} onOpenChange={(e) => !e.open && onFechar()} size="xl" placement="center">
      <Portal>
        <Dialog.Backdrop bg="rgba(0, 0, 0, 0.75)" backdropFilter="blur(8px)" />
        <Dialog.Positioner>
        <Dialog.Content
          bg="bg.panel"
          borderWidth="1px"
          borderColor="border.subtle"
          color="fg"
          borderRadius="2xl"
          p={0}
          maxW="3xl"
          w="full"
          overflow="hidden"
          shadow="2xl"
        >
          <Flex
            align="center"
            justify="space-between"
            px={5}
            py={4}
            borderBottomWidth="1px"
            borderColor="border.subtle"
            bg="bg.muted/30"
          >
            <HStack gap={3}>
              <Box
                p={2}
                borderRadius="lg"
                bg="cirqueira.brand.500/10"
                color="cirqueira.brand.400"
                borderWidth="1px"
                borderColor="cirqueira.brand.500/20"
                display="inline-flex"
                alignItems="center"
                justifyContent="center"
              >
                <CalendarClock size={20} />
              </Box>
              <VStack align="start" gap={0}>
                <HStack gap={2}>
                  <Dialog.Title fontSize="md" fontWeight="bold" color="fg">
                    Distribuir Horários em Lote
                  </Dialog.Title>
                  <Badge colorPalette="brand" size="xs" borderRadius="md">
                    {total} {total === 1 ? 'vídeo' : 'vídeos'}
                  </Badge>
                </HStack>
                <Text fontSize="xs" color="fg.subtle">
                  Espalhe os vídeos baixados ao longo do dia com intervalos inteligentes
                </Text>
              </VStack>
            </HStack>

            <IconButton
              size="xs"
              variant="ghost"
              onClick={onFechar}
              aria-label="Fechar modal"
              borderRadius="lg"
            >
              <X size={16} />
            </IconButton>
          </Flex>

          <Dialog.Body p={5} maxH="70vh" overflowY="auto">
            <VStack gap={5} align="stretch">
              <Box
                p={3.5}
                borderRadius="xl"
                bg="cirqueira.brand.500/10"
                borderWidth="1px"
                borderColor="cirqueira.brand.500/20"
              >
                <HStack justify="space-between" align="center" mb={2}>
                  <HStack gap={1.5} color="cirqueira.brand.400" fontSize="xs" fontWeight="bold">
                    <Sparkles size={14} />
                    <Text as="span">Escolha a Estratégia de Distribuição</Text>
                  </HStack>
                  <Badge size="xs" variant="subtle" colorPalette="brand">
                    Automático
                  </Badge>
                </HStack>

                <HStack gap={2} flexWrap="wrap">
                  <Button
                    size="xs"
                    variant={modo === 'retroativo' ? 'solid' : 'outline'}
                    colorPalette={modo === 'retroativo' ? 'brand' : 'gray'}
                    onClick={() => {
                      setModo('retroativo')
                      setAjustesManuais({})
                    }}
                    borderRadius="lg"
                  >
                    <ArrowDownUp size={13} style={{ marginRight: '4px' }} />
                    <Text as="span">Retroativo do Download (-2h por vídeo)</Text>
                  </Button>

                  <Button
                    size="xs"
                    variant={modo === 'uniforme' ? 'solid' : 'outline'}
                    colorPalette={modo === 'uniforme' ? 'brand' : 'gray'}
                    onClick={() => {
                      setModo('uniforme')
                      setAjustesManuais({})
                    }}
                    borderRadius="lg"
                  >
                    <Clock size={13} style={{ marginRight: '4px' }} />
                    <Text as="span">Espalhar pelo Dia (08h às 22h)</Text>
                  </Button>

                  <Button
                    size="xs"
                    variant={modo === 'organico' ? 'solid' : 'outline'}
                    colorPalette={modo === 'organico' ? 'brand' : 'gray'}
                    onClick={() => {
                      setModo('organico')
                      setAjustesManuais({})
                    }}
                    borderRadius="lg"
                  >
                    <Dices size={13} style={{ marginRight: '4px' }} />
                    <Text as="span">Orgânico / Turnos Reais</Text>
                  </Button>
                </HStack>
              </Box>

              <Grid templateColumns={{ base: '1fr', md: '1.2fr 2fr' }} gap={3}>
                <Field.Root>
                  <Field.Label fontSize="xs" fontWeight="semibold" color="fg.subtle">
                    Data Base de Aplicação
                  </Field.Label>
                  <Input
                    type="date"
                    value={dataBase}
                    onChange={(e) => {
                      setDataBase(e.target.value)
                      setAjustesManuais({})
                    }}
                    bg="bg.muted"
                    borderColor="border.subtle"
                    borderRadius="lg"
                    fontSize="xs"
                    h={9}
                  />
                </Field.Root>

                {modo === 'retroativo' && (
                  <Grid templateColumns="1fr 1fr" gap={2}>
                    <Field.Root>
                      <Field.Label fontSize="xs" fontWeight="semibold" color="fg.subtle">
                        Horário Final (Download)
                      </Field.Label>
                      <Input
                        type="time"
                        value={horaBaseRetroativa}
                        onChange={(e) => setHoraBaseRetroativa(e.target.value)}
                        bg="bg.muted"
                        borderColor="border.subtle"
                        borderRadius="lg"
                        fontSize="xs"
                        h={9}
                      />
                    </Field.Root>

                    <Field.Root>
                      <Field.Label fontSize="xs" fontWeight="semibold" color="fg.subtle">
                        Passo Retroativo
                      </Field.Label>
                      <NativeSelect.Root size="sm">
                        <NativeSelect.Field
                          value={passoRetroativoMinutos}
                          onChange={(e) => setPassoRetroativoMinutos(Number(e.target.value))}
                          bg="bg.muted"
                          borderColor="border.subtle"
                          borderRadius="lg"
                          fontSize="xs"
                          h={9}
                        >
                          <option value={30}>A cada 30 minutos</option>
                          <option value={60}>A cada 1 hora</option>
                          <option value={90}>A cada 1h 30m</option>
                          <option value={120}>A cada 2 horas (Recomendado)</option>
                          <option value={180}>A cada 3 horas</option>
                          <option value={240}>A cada 4 horas</option>
                        </NativeSelect.Field>
                        <NativeSelect.Indicator />
                      </NativeSelect.Root>
                    </Field.Root>
                  </Grid>
                )}

                {modo === 'uniforme' && (
                  <Grid templateColumns="1fr 1fr" gap={2}>
                    <Field.Root>
                      <Field.Label fontSize="xs" fontWeight="semibold" color="fg.subtle">
                        Horário Inicial
                      </Field.Label>
                      <Input
                        type="time"
                        value={horaInicioUniforme}
                        onChange={(e) => setHoraInicioUniforme(e.target.value)}
                        bg="bg.muted"
                        borderColor="border.subtle"
                        borderRadius="lg"
                        fontSize="xs"
                        h={9}
                      />
                    </Field.Root>

                    <Field.Root>
                      <Field.Label fontSize="xs" fontWeight="semibold" color="fg.subtle">
                        Horário Final
                      </Field.Label>
                      <Input
                        type="time"
                        value={horaFimUniforme}
                        onChange={(e) => setHoraFimUniforme(e.target.value)}
                        bg="bg.muted"
                        borderColor="border.subtle"
                        borderRadius="lg"
                        fontSize="xs"
                        h={9}
                      />
                    </Field.Root>
                  </Grid>
                )}

                {modo === 'organico' && (
                  <Flex align="center" gap={2} p={2} bg="bg.muted/20" borderRadius="lg">
                    <Box as="span" color="cirqueira.brand.400" display="inline-flex">
                      <Info size={14} color="currentColor" />
                    </Box>
                    <Text fontSize="xs" color="fg.subtle">
                      Distribui entre os picos de maior engajamento (manhã, almoço, tarde, noite)
                      com minutos variados.
                    </Text>
                  </Flex>
                )}
              </Grid>

              <Box
                borderRadius="xl"
                borderWidth="1px"
                borderColor="border.subtle"
                overflow="hidden"
                bg="bg.panel"
              >
                <Flex
                  justify="space-between"
                  align="center"
                  p={3}
                  px={4}
                  bg="bg.muted/30"
                  borderBottomWidth="1px"
                  borderColor="border.subtle"
                >
                  <HStack gap={2}>
                    <Text fontSize="xs" fontWeight="bold" color="fg">
                      Pré-visualização do Cronograma ({total} itens)
                    </Text>
                    {Object.keys(ajustesManuais).length > 0 && (
                      <Badge size="xs" colorPalette="amber" borderRadius="md">
                        {Object.keys(ajustesManuais).length} ajustado(s) manualmente
                      </Badge>
                    )}
                  </HStack>

                  {Object.keys(ajustesManuais).length > 0 && (
                    <Button
                      size="2xs"
                      variant="ghost"
                      onClick={handleResetarAjustes}
                      color="fg.subtle"
                    >
                      <RotateCcw size={12} style={{ marginRight: '4px' }} />
                      <Text as="span">Restaurar cálculo</Text>
                    </Button>
                  )}
                </Flex>

                <VStack gap={0} align="stretch" maxH="38vh" overflowY="auto">
                  {listaHorariosCalculados.map((linha, index) => {
                    const { item, data, hora } = linha
                    const originalHora = formatarHorarioMidia(item)
                    const originalData = formatarDataMidia(item.metadata?.data, item.criadoEm)
                    const titulo = item.metadata?.titulo || `Vídeo ${item.hash.slice(0, 10)}`

                    return (
                      <Flex
                        key={item.uuid}
                        align="center"
                        justify="space-between"
                        p={2.5}
                        px={4}
                        gap={3}
                        borderBottomWidth="1px"
                        borderColor="border.subtle"
                        _last={{ borderBottomWidth: 0 }}
                        _hover={{ bg: 'bg.muted/30' }}
                      >
                        <HStack gap={2.5} flex={1} minW={0}>
                          <Badge
                            size="xs"
                            variant="subtle"
                            colorPalette="gray"
                            minW={5}
                            textAlign="center"
                          >
                            #{index + 1}
                          </Badge>
                          <VStack align="start" gap={0} minW={0} flex={1}>
                            <Text
                              fontSize="xs"
                              fontWeight="medium"
                              color="fg"
                              truncate
                              maxW="280px"
                            >
                              {titulo}
                            </Text>
                            <Text fontSize="10px" color="fg.subtle">
                              Original: {originalData} às {originalHora}
                            </Text>
                          </VStack>
                        </HStack>

                        <HStack gap={2} flexShrink={0}>
                          <Input
                            type="date"
                            size="xs"
                            w="125px"
                            value={data}
                            onChange={(e) => handleAlterarLinha(item.uuid, 'data', e.target.value)}
                            bg="bg.muted"
                            borderColor="border.subtle"
                            borderRadius="md"
                            fontSize="xs"
                            h={7}
                          />

                          <Input
                            type="time"
                            size="xs"
                            w="90px"
                            value={hora}
                            onChange={(e) => handleAlterarLinha(item.uuid, 'hora', e.target.value)}
                            bg="bg.muted"
                            borderColor="border.subtle"
                            borderRadius="md"
                            fontSize="xs"
                            h={7}
                          />

                          <HStack gap={1}>
                            <IconButton
                              size="2xs"
                              variant="ghost"
                              onClick={() => handleDeslocarLinha(item.uuid, -15)}
                              title="Subtrair 15 minutos"
                              borderRadius="md"
                              fontSize="10px"
                            >
                              -15m
                            </IconButton>
                            <IconButton
                              size="2xs"
                              variant="ghost"
                              onClick={() => handleDeslocarLinha(item.uuid, 15)}
                              title="Adicionar 15 minutos"
                              borderRadius="md"
                              fontSize="10px"
                            >
                              +15m
                            </IconButton>
                          </HStack>
                        </HStack>
                      </Flex>
                    )
                  })}
                </VStack>
              </Box>
            </VStack>
          </Dialog.Body>

          <Flex
            align="center"
            justify="space-between"
            px={5}
            py={3.5}
            borderTopWidth="1px"
            borderColor="border.subtle"
            bg="bg.muted/20"
          >
            <HStack gap={2} fontSize="xs" color="fg.subtle">
              <Box as="span" color="cirqueira.brand.400" display="inline-flex">
                <Calendar size={13} color="currentColor" />
              </Box>
              <Text as="span">
                {listaHorariosCalculados[0]?.hora} até {listaHorariosCalculados[total - 1]?.hora}
              </Text>
            </HStack>

            <HStack gap={2}>
              <Button size="sm" variant="ghost" onClick={onFechar} borderRadius="lg">
                Cancelar
              </Button>
              <Button
                size="sm"
                bg="cirqueira.brand.500"
                _hover={{ bg: 'cirqueira.brand.600' }}
                color="cirqueira.grey.0"
                disabled={pendente || total === 0}
                onClick={handleConfirmar}
                borderRadius="lg"
                fontWeight="semibold"
              >
                {pendente && (
                  <Loader2
                    size={14}
                    style={{ animation: 'spin 1s linear infinite', marginRight: '6px' }}
                  />
                )}
                <Text as="span">Salvar {total} Horários Distribuídos</Text>
              </Button>
            </HStack>
          </Flex>
        </Dialog.Content>
      </Dialog.Positioner>
    </Portal>
  </Dialog.Root>
  )
})
