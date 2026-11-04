import {
  Badge,
  Box,
  Button,
  Flex,
  HStack,
  IconButton,
  Spinner,
  Text,
  VStack,
} from '@chakra-ui/react'
import { Check, Mic, Pause, Play, Trash2, X } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { obterUrlAmostraVoz } from '../api'
import type { VozLivroAudio } from '../types'

interface PainelVozesProps {
  vozes: VozLivroAudio[]
  vozSelecionada: string | null
  numeroBlocoAtivo: number | null
  carregando: boolean
  vozEmAcao: string | null
  onSelecionar: (voz: VozLivroAudio) => void
  onGerar: (voz: VozLivroAudio) => void
  onRemover: (voz: VozLivroAudio) => void
  onFechar: () => void
}

function descreverStatus(voz: VozLivroAudio): { texto: string; cor: string } {
  if (voz.principal) return { texto: 'Principal', cor: 'brand' }

  switch (voz.status) {
    case 'pronta':
      return { texto: 'Pronta', cor: 'green' }
    case 'gerando':
      return {
        texto: `Gerando ${voz.blocosProntos.length}/${voz.totalBlocos}`,
        cor: 'yellow',
      }
    case 'parcial':
      return { texto: `${voz.blocosProntos.length}/${voz.totalBlocos} partes`, cor: 'orange' }
    case 'erro':
      return { texto: 'Erro', cor: 'red' }
    default:
      return { texto: 'Não gerada', cor: 'gray' }
  }
}

export function PainelVozes({
  vozes,
  vozSelecionada,
  numeroBlocoAtivo,
  carregando,
  vozEmAcao,
  onSelecionar,
  onGerar,
  onRemover,
  onFechar,
}: PainelVozesProps) {
  const amostraRef = useRef<HTMLAudioElement | null>(null)
  const [amostraTocando, setAmostraTocando] = useState<string | null>(null)
  const [amostraCarregando, setAmostraCarregando] = useState<string | null>(null)

  useEffect(() => {
    return () => {
      amostraRef.current?.pause()
    }
  }, [])

  function alternarAmostra(voz: string) {
    const atual = amostraRef.current
    if (atual && amostraTocando === voz) {
      atual.pause()
      setAmostraTocando(null)
      return
    }

    atual?.pause()
    const audio = new Audio(obterUrlAmostraVoz(voz))
    amostraRef.current = audio
    setAmostraCarregando(voz)
    setAmostraTocando(null)
    audio.onplaying = () => {
      setAmostraCarregando(null)
      setAmostraTocando(voz)
    }
    audio.onended = () => setAmostraTocando(null)
    audio.onerror = () => {
      setAmostraCarregando(null)
      setAmostraTocando(null)
    }
    audio.play().catch(() => {
      setAmostraCarregando(null)
    })
  }

  return (
    <Box
      position="absolute"
      bottom="calc(100% + 8px)"
      right={{ base: 4, md: 24 }}
      w={{ base: 'calc(100vw - 32px)', sm: '420px' }}
      maxH="420px"
      bg="cirqueira.grey.900"
      border="1px solid"
      borderColor="cirqueira.grey.800"
      borderRadius="2xl"
      p={3.5}
      overflowY="auto"
      boxShadow="0 20px 50px rgba(0, 0, 0, 0.9)"
      zIndex={60}
    >
      <HStack
        justify="space-between"
        mb={2}
        pb={2}
        borderBottom="1px solid"
        borderColor="cirqueira.grey.800"
      >
        <HStack gap={2} color="cirqueira.brand.400">
          <Mic size={16} />
          <Text fontSize="xs" fontWeight="bold" color="white">
            Vozes do narrador
          </Text>
        </HStack>
        <IconButton
          size="xs"
          variant="ghost"
          color="cirqueira.grey.400"
          _hover={{ color: 'white' }}
          onClick={onFechar}
          aria-label="Fechar vozes"
        >
          <X size={14} />
        </IconButton>
      </HStack>

      <Text fontSize="11px" color="cirqueira.grey.400" mb={2.5}>
        Ouça a amostra, gere a voz que quiser e troque a qualquer momento. A troca continua da mesma
        frase.
      </Text>

      {carregando ? (
        <Flex justify="center" py={6}>
          <Spinner size="sm" color="cirqueira.brand.500" />
        </Flex>
      ) : (
        <Flex direction="column" gap={1.5}>
          {vozes.map((voz) => {
            const selecionada = vozSelecionada === voz.id
            const status = descreverStatus(voz)
            const temAudio = voz.principal || voz.blocosProntos.length > 0
            const podeGerar =
              !voz.principal && (voz.status === 'nao_gerada' || voz.blocosComErro > 0)
            const podeRemover = !voz.principal && voz.status !== 'nao_gerada'
            const emAcao = vozEmAcao === voz.id
            const parteAtualPronta =
              voz.principal ||
              (numeroBlocoAtivo !== null && voz.blocosProntos.includes(numeroBlocoAtivo))

            return (
              <HStack
                key={voz.id}
                gap={2}
                px={2.5}
                py={2}
                borderRadius="xl"
                bg={selecionada ? 'cirqueira.brand.500/15' : 'rgba(255, 255, 255, 0.03)'}
                border="1px solid"
                borderColor={selecionada ? 'cirqueira.brand.500/40' : 'transparent'}
              >
                <IconButton
                  size="xs"
                  variant="ghost"
                  borderRadius="full"
                  color="cirqueira.grey.200"
                  _hover={{ color: 'white', bg: 'cirqueira.grey.800' }}
                  onClick={() => alternarAmostra(voz.id)}
                  aria-label={`Ouvir amostra da voz ${voz.nome}`}
                  title="Ouvir amostra"
                >
                  {amostraCarregando === voz.id ? (
                    <Spinner size="xs" />
                  ) : amostraTocando === voz.id ? (
                    <Pause size={13} />
                  ) : (
                    <Play size={13} />
                  )}
                </IconButton>

                <VStack align="start" gap={0} flex={1} minW={0}>
                  <HStack gap={1.5}>
                    <Text fontSize="xs" fontWeight="bold" color="white">
                      {voz.nome}
                    </Text>
                    <Badge size="xs" variant="subtle" colorPalette={status.cor} fontSize="9px">
                      {status.texto}
                    </Badge>
                  </HStack>
                  <Text fontSize="10px" color="cirqueira.grey.400" truncate maxW="full">
                    {selecionada && !parteAtualPronta
                      ? 'Esta parte ainda toca na voz principal'
                      : voz.descricao}
                  </Text>
                </VStack>

                {podeGerar && (
                  <Button
                    size="xs"
                    variant="subtle"
                    colorPalette="brand"
                    h="24px"
                    px={2}
                    fontSize="10px"
                    loading={emAcao}
                    onClick={() => onGerar(voz)}
                  >
                    {voz.status === 'nao_gerada' ? 'Gerar' : 'Tentar de novo'}
                  </Button>
                )}

                {temAudio && (
                  <Button
                    size="xs"
                    variant={selecionada ? 'solid' : 'subtle'}
                    colorPalette={selecionada ? 'brand' : 'gray'}
                    h="24px"
                    px={2}
                    fontSize="10px"
                    disabled={selecionada}
                    onClick={() => onSelecionar(voz)}
                  >
                    {selecionada ? <Check size={12} /> : 'Usar'}
                  </Button>
                )}

                {podeRemover && (
                  <IconButton
                    size="xs"
                    variant="ghost"
                    color="cirqueira.grey.500"
                    _hover={{ color: 'cirqueira.red.400', bg: 'cirqueira.grey.800' }}
                    disabled={emAcao}
                    onClick={() => onRemover(voz)}
                    aria-label={`Remover a voz ${voz.nome}`}
                    title="Apagar o áudio desta voz"
                  >
                    <Trash2 size={13} />
                  </IconButton>
                )}
              </HStack>
            )
          })}
        </Flex>
      )}
    </Box>
  )
}
