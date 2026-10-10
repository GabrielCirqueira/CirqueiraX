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
  Text,
  VStack,
} from '@chakra-ui/react'
import {
  Calendar,
  Check,
  Clock,
  Film,
  Image as ImageIcon,
  Loader2,
  RotateCcw,
  Sparkles,
  User,
  X,
} from 'lucide-react'
import { memo, useState } from 'react'
import type { AtualizarMetadataInput, MediaItem } from '../types'

export interface ModalEditarMetadataProps {
  item: MediaItem | null
  aberto: boolean
  onFechar: () => void
  onSalvar: (input: AtualizarMetadataInput) => void
  pendente?: boolean
}

function extrairDataHoraInicial(item: MediaItem | null): { data: string; hora: string } {
  if (!item) return { data: '', hora: '12:00' }

  const valorData = item.metadata?.data || item.criadoEm
  if (!valorData) {
    const hoje = new Date().toISOString().split('T')[0] ?? ''
    return { data: hoje, hora: '12:00' }
  }

  if (/^\d{8}$/.test(valorData)) {
    const ano = valorData.substring(0, 4)
    const mes = valorData.substring(4, 6)
    const dia = valorData.substring(6, 8)
    return { data: `${ano}-${mes}-${dia}`, hora: '12:00' }
  }

  if (valorData.includes('T')) {
    const [d = '', h = '12:00'] = valorData.split('T')
    return { data: d, hora: h.substring(0, 5) || '12:00' }
  }

  if (valorData.includes(' ')) {
    const [d = '', h = '12:00'] = valorData.split(' ')
    return { data: d, hora: h.substring(0, 5) || '12:00' }
  }

  return { data: valorData, hora: '12:00' }
}

export const ModalEditarMetadata = memo(function ModalEditarMetadata({
  item,
  aberto,
  onFechar,
  onSalvar,
  pendente = false,
}: ModalEditarMetadataProps) {
  if (!item) return null

  const dataHoraInicial = extrairDataHoraInicial(item)
  const duracaoInicial = Number(item.metadata?.duracao) || 0
  const minutosIniciais = Math.floor(duracaoInicial / 60)
  const segundosIniciais = duracaoInicial % 60

  const [titulo, setTitulo] = useState(item.metadata?.titulo || '')
  const [uploader, setUploader] = useState(item.metadata?.uploader || '')
  const [dataIso, setDataIso] = useState(dataHoraInicial.data)
  const [hora, setHora] = useState(dataHoraInicial.hora)
  const [minutos, setMinutos] = useState(String(minutosIniciais))
  const [segundos, setSegundos] = useState(String(segundosIniciais))
  const [thumbnail, setThumbnail] = useState(item.thumbnailUrl || item.metadata?.thumbnail || '')
  const [abaAtiva, setAbaAtiva] = useState<'geral' | 'data' | 'duracao' | 'capa'>('geral')

  const aplicarAtalhoData = (diasOffset: number) => {
    const dataAlvo = new Date()
    dataAlvo.setDate(dataAlvo.getDate() + diasOffset)
    setDataIso(dataAlvo.toISOString().split('T')[0] ?? '')
  }

  const aplicarAtalhoHora = (novaHora: string) => {
    setHora(novaHora)
  }

  const aplicarAgora = () => {
    const agora = new Date()
    setDataIso(agora.toISOString().split('T')[0] ?? '')
    const hh = String(agora.getHours()).padStart(2, '0')
    const mm = String(agora.getMinutes()).padStart(2, '0')
    setHora(`${hh}:${mm}`)
  }

  const restaurarOriginal = () => {
    const original = extrairDataHoraInicial(item)
    setTitulo(item.metadata?.titulo || '')
    setUploader(item.metadata?.uploader || '')
    setDataIso(original.data)
    setHora(original.hora)
    setMinutos(String(minutosIniciais))
    setSegundos(String(segundosIniciais))
    setThumbnail(item.thumbnailUrl || item.metadata?.thumbnail || '')
  }

  const ajustarMinutos = (delta: number) => {
    const atual = Math.max(0, (Number(minutos) || 0) + delta)
    setMinutos(String(atual))
  }

  const handleSubmeter = () => {
    const totalSegundos = (Number(minutos) || 0) * 60 + (Number(segundos) || 0)
    let dataFinal = dataIso
    if (dataIso && hora) {
      dataFinal = `${dataIso} ${hora}:00`
    }

    onSalvar({
      titulo: titulo.trim(),
      uploader: uploader.trim(),
      data: dataFinal || undefined,
      duracao: totalSegundos > 0 ? totalSegundos : undefined,
      thumbnail: thumbnail.trim() || undefined,
    })
  }

  return (
    <Dialog.Root open={aberto} onOpenChange={(e) => !e.open && onFechar()} size="lg">
      <Dialog.Backdrop />
      <Dialog.Positioner>
        <Dialog.Content
          bg="bg.panel"
          borderWidth="1px"
          borderColor="border.subtle"
          color="fg"
          borderRadius="xl"
          p={0}
          maxW="2xl"
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
                <Film size={18} />
              </Box>
              <VStack align="start" gap={0}>
                <Dialog.Title fontSize="md" fontWeight="bold" color="fg">
                  Editar Metadados da Mídia
                </Dialog.Title>
                <Text fontSize="xs" color="fg.subtle">
                  Altere título, data, hora, duração e capa com atalhos rápidos
                </Text>
              </VStack>
            </HStack>

            <HStack gap={2}>
              <IconButton
                size="xs"
                variant="ghost"
                onClick={restaurarOriginal}
                aria-label="Restaurar originais"
                title="Restaurar metadados originais"
                borderRadius="lg"
              >
                <RotateCcw size={14} />
              </IconButton>
              <IconButton
                size="xs"
                variant="ghost"
                onClick={onFechar}
                aria-label="Fechar modal"
                borderRadius="lg"
              >
                <X size={16} />
              </IconButton>
            </HStack>
          </Flex>

          <HStack
            px={5}
            pt={3}
            gap={2}
            borderBottomWidth="1px"
            borderColor="border.subtle"
            bg="bg.muted/10"
          >
            <Button
              size="xs"
              variant={abaAtiva === 'geral' ? 'solid' : 'ghost'}
              colorPalette={abaAtiva === 'geral' ? 'brand' : 'gray'}
              onClick={() => setAbaAtiva('geral')}
              borderRadius="lg"
            >
              <User size={13} />
              <Text as="span">Informações Gerais</Text>
            </Button>
            <Button
              size="xs"
              variant={abaAtiva === 'data' ? 'solid' : 'ghost'}
              colorPalette={abaAtiva === 'data' ? 'brand' : 'gray'}
              onClick={() => setAbaAtiva('data')}
              borderRadius="lg"
            >
              <Calendar size={13} />
              <Text as="span">Data & Horário</Text>
            </Button>
            <Button
              size="xs"
              variant={abaAtiva === 'duracao' ? 'solid' : 'ghost'}
              colorPalette={abaAtiva === 'duracao' ? 'brand' : 'gray'}
              onClick={() => setAbaAtiva('duracao')}
              borderRadius="lg"
            >
              <Clock size={13} />
              <Text as="span">Duração</Text>
            </Button>
            <Button
              size="xs"
              variant={abaAtiva === 'capa' ? 'solid' : 'ghost'}
              colorPalette={abaAtiva === 'capa' ? 'brand' : 'gray'}
              onClick={() => setAbaAtiva('capa')}
              borderRadius="lg"
            >
              <ImageIcon size={13} />
              <Text as="span">Capa / Thumbnail</Text>
            </Button>
          </HStack>

          <Dialog.Body p={5} maxH="65vh" overflowY="auto">
            {abaAtiva === 'geral' && (
              <VStack gap={4} align="stretch">
                <Field.Root>
                  <Field.Label fontSize="xs" fontWeight="semibold" color="fg.subtle">
                    Título do Vídeo / Post
                  </Field.Label>
                  <Input
                    type="text"
                    value={titulo}
                    onChange={(e) => setTitulo(e.target.value)}
                    placeholder="Ex: Highlights do Jogo"
                    bg="bg.muted"
                    borderColor="border.subtle"
                    borderRadius="lg"
                    fontSize="sm"
                  />
                </Field.Root>

                <Field.Root>
                  <Field.Label fontSize="xs" fontWeight="semibold" color="fg.subtle">
                    Uploader / Canal / Criador
                  </Field.Label>
                  <Input
                    type="text"
                    value={uploader}
                    onChange={(e) => setUploader(e.target.value)}
                    placeholder="Ex: @criador"
                    bg="bg.muted"
                    borderColor="border.subtle"
                    borderRadius="lg"
                    fontSize="sm"
                  />
                </Field.Root>

                <Box
                  p={3.5}
                  borderRadius="xl"
                  bg="bg.muted/40"
                  borderWidth="1px"
                  borderColor="border.subtle"
                >
                  <Text fontSize="xs" fontWeight="semibold" color="fg.subtle" mb={2}>
                    Resumo Atual
                  </Text>
                  <Grid templateColumns="repeat(2, 1fr)" gap={2} fontSize="xs">
                    <HStack gap={2}>
                      <Box as="span" color="cirqueira.brand.400" display="inline-flex">
                        <Calendar size={13} color="currentColor" />
                      </Box>
                      <Text as="span" color="fg">
                        Data: {dataIso || 'Não definida'} {hora}
                      </Text>
                    </HStack>
                    <HStack gap={2}>
                      <Box as="span" color="cirqueira.blue.400" display="inline-flex">
                        <Clock size={13} color="currentColor" />
                      </Box>
                      <Text as="span" color="fg">
                        Duração: {minutos}m {segundos}s
                      </Text>
                    </HStack>
                  </Grid>
                </Box>
              </VStack>
            )}

            {abaAtiva === 'data' && (
              <VStack gap={4} align="stretch">
                <Box
                  p={3}
                  borderRadius="xl"
                  bg="cirqueira.brand.500/10"
                  borderWidth="1px"
                  borderColor="cirqueira.brand.500/20"
                >
                  <HStack justify="space-between" align="center" mb={2}>
                    <HStack gap={1.5} color="cirqueira.brand.400" fontSize="xs" fontWeight="bold">
                      <Sparkles size={14} />
                      <Text as="span">Atalhos Rápidos de Data</Text>
                    </HStack>
                    <Button
                      size="2xs"
                      variant="subtle"
                      colorPalette="brand"
                      onClick={aplicarAgora}
                      borderRadius="lg"
                    >
                      ⚡ Agora
                    </Button>
                  </HStack>
                  <HStack gap={2} flexWrap="wrap">
                    <Button
                      size="2xs"
                      variant="outline"
                      onClick={() => aplicarAtalhoData(0)}
                      borderRadius="lg"
                    >
                      Hoje
                    </Button>
                    <Button
                      size="2xs"
                      variant="outline"
                      onClick={() => aplicarAtalhoData(-1)}
                      borderRadius="lg"
                    >
                      Ontem
                    </Button>
                    <Button
                      size="2xs"
                      variant="outline"
                      onClick={() => aplicarAtalhoData(-7)}
                      borderRadius="lg"
                    >
                      Há 1 semana
                    </Button>
                    <Button
                      size="2xs"
                      variant="outline"
                      onClick={() => aplicarAtalhoData(-30)}
                      borderRadius="lg"
                    >
                      Há 1 mês
                    </Button>
                  </HStack>
                </Box>

                <Grid templateColumns={{ base: '1fr', sm: '2fr 1fr' }} gap={3}>
                  <Field.Root>
                    <Field.Label fontSize="xs" fontWeight="semibold" color="fg.subtle">
                      Data (Dia / Mês / Ano)
                    </Field.Label>
                    <Input
                      type="date"
                      value={dataIso}
                      onChange={(e) => setDataIso(e.target.value)}
                      bg="bg.muted"
                      borderColor="border.subtle"
                      borderRadius="lg"
                      fontSize="sm"
                    />
                  </Field.Root>

                  <Field.Root>
                    <Field.Label fontSize="xs" fontWeight="semibold" color="fg.subtle">
                      Horário (Hora : Minuto)
                    </Field.Label>
                    <Input
                      type="time"
                      value={hora}
                      onChange={(e) => setHora(e.target.value)}
                      bg="bg.muted"
                      borderColor="border.subtle"
                      borderRadius="lg"
                      fontSize="sm"
                    />
                  </Field.Root>
                </Grid>

                <Box
                  p={3}
                  borderRadius="xl"
                  bg="bg.muted/30"
                  borderWidth="1px"
                  borderColor="border.subtle"
                >
                  <Text fontSize="xs" fontWeight="semibold" color="fg.subtle" mb={2}>
                    Atalhos Rápidos de Horário
                  </Text>
                  <HStack gap={2} flexWrap="wrap">
                    <Button
                      size="2xs"
                      variant="outline"
                      onClick={() => aplicarAtalhoHora('00:00')}
                      borderRadius="lg"
                    >
                      00:00 (Início)
                    </Button>
                    <Button
                      size="2xs"
                      variant="outline"
                      onClick={() => aplicarAtalhoHora('08:00')}
                      borderRadius="lg"
                    >
                      08:00 (Manhã)
                    </Button>
                    <Button
                      size="2xs"
                      variant="outline"
                      onClick={() => aplicarAtalhoHora('12:00')}
                      borderRadius="lg"
                    >
                      12:00 (Meio-dia)
                    </Button>
                    <Button
                      size="2xs"
                      variant="outline"
                      onClick={() => aplicarAtalhoHora('18:00')}
                      borderRadius="lg"
                    >
                      18:00 (Tarde)
                    </Button>
                    <Button
                      size="2xs"
                      variant="outline"
                      onClick={() => aplicarAtalhoHora('23:59')}
                      borderRadius="lg"
                    >
                      23:59 (Fim do dia)
                    </Button>
                  </HStack>
                </Box>
              </VStack>
            )}

            {abaAtiva === 'duracao' && (
              <VStack gap={4} align="stretch">
                <Box
                  p={3}
                  borderRadius="xl"
                  bg="cirqueira.brand.500/10"
                  borderWidth="1px"
                  borderColor="cirqueira.brand.500/20"
                >
                  <HStack justify="space-between" align="center" mb={2}>
                    <HStack gap={1.5} color="cirqueira.brand.400" fontSize="xs" fontWeight="bold">
                      <Clock size={14} />
                      <Text as="span">Ajuste Rápido de Duração</Text>
                    </HStack>
                    <Badge size="sm" variant="subtle" colorPalette="brand" borderRadius="md">
                      Total: {(Number(minutos) || 0) * 60 + (Number(segundos) || 0)} segundos
                    </Badge>
                  </HStack>
                  <HStack gap={2} flexWrap="wrap">
                    <Button
                      size="2xs"
                      variant="outline"
                      onClick={() => ajustarMinutos(-5)}
                      borderRadius="lg"
                    >
                      -5 min
                    </Button>
                    <Button
                      size="2xs"
                      variant="outline"
                      onClick={() => ajustarMinutos(-1)}
                      borderRadius="lg"
                    >
                      -1 min
                    </Button>
                    <Button
                      size="2xs"
                      variant="outline"
                      onClick={() => ajustarMinutos(1)}
                      borderRadius="lg"
                    >
                      +1 min
                    </Button>
                    <Button
                      size="2xs"
                      variant="outline"
                      onClick={() => ajustarMinutos(5)}
                      borderRadius="lg"
                    >
                      +5 min
                    </Button>
                    <Button
                      size="2xs"
                      variant="outline"
                      onClick={() => ajustarMinutos(10)}
                      borderRadius="lg"
                    >
                      +10 min
                    </Button>
                  </HStack>
                </Box>

                <Grid templateColumns="repeat(2, 1fr)" gap={3}>
                  <Field.Root>
                    <Field.Label fontSize="xs" fontWeight="semibold" color="fg.subtle">
                      Minutos
                    </Field.Label>
                    <Input
                      type="number"
                      min={0}
                      value={minutos}
                      onChange={(e) => setMinutos(e.target.value)}
                      bg="bg.muted"
                      borderColor="border.subtle"
                      borderRadius="lg"
                      fontSize="sm"
                    />
                  </Field.Root>

                  <Field.Root>
                    <Field.Label fontSize="xs" fontWeight="semibold" color="fg.subtle">
                      Segundos (0 a 59)
                    </Field.Label>
                    <Input
                      type="number"
                      min={0}
                      max={59}
                      value={segundos}
                      onChange={(e) => setSegundos(e.target.value)}
                      bg="bg.muted"
                      borderColor="border.subtle"
                      borderRadius="lg"
                      fontSize="sm"
                    />
                  </Field.Root>
                </Grid>
              </VStack>
            )}

            {abaAtiva === 'capa' && (
              <VStack gap={4} align="stretch">
                <Field.Root>
                  <Field.Label fontSize="xs" fontWeight="semibold" color="fg.subtle">
                    URL da Imagem de Capa (Thumbnail)
                  </Field.Label>
                  <Input
                    type="url"
                    value={thumbnail}
                    onChange={(e) => setThumbnail(e.target.value)}
                    placeholder="https://exemplo.com/capa.jpg"
                    bg="bg.muted"
                    borderColor="border.subtle"
                    borderRadius="lg"
                    fontSize="sm"
                  />
                </Field.Root>

                <Box
                  position="relative"
                  aspectRatio="16/9"
                  w="full"
                  borderRadius="xl"
                  overflow="hidden"
                  bg="black"
                  borderWidth="1px"
                  borderColor="border.subtle"
                  display="flex"
                  alignItems="center"
                  justifyContent="center"
                >
                  {thumbnail ? (
                    <img
                      src={thumbnail}
                      alt="Prévia da Thumbnail"
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      onError={() => {}}
                    />
                  ) : (
                    <VStack gap={2} color="fg.subtle">
                      <ImageIcon size={32} strokeWidth={1.5} />
                      <Text fontSize="xs">Nenhuma URL de thumbnail informada</Text>
                    </VStack>
                  )}
                </Box>
              </VStack>
            )}
          </Dialog.Body>

          <Flex
            justify="space-between"
            align="center"
            px={5}
            py={3.5}
            borderTopWidth="1px"
            borderColor="border.subtle"
            bg="bg.muted/20"
          >
            <Button size="sm" variant="ghost" onClick={onFechar} borderRadius="lg">
              Cancelar
            </Button>

            <Button
              size="sm"
              colorPalette="brand"
              disabled={pendente}
              onClick={handleSubmeter}
              fontWeight="semibold"
              borderRadius="lg"
            >
              {pendente ? (
                <>
                  <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} />
                  <Text as="span">Salvando...</Text>
                </>
              ) : (
                <>
                  <Check size={14} />
                  <Text as="span">Salvar Alterações</Text>
                </>
              )}
            </Button>
          </Flex>
        </Dialog.Content>
      </Dialog.Positioner>
    </Dialog.Root>
  )
})
