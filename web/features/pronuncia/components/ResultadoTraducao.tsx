import { Badge, Box, Button, Flex, HStack, IconButton, Text, VStack } from '@chakra-ui/react'
import { AlertTriangle, Copy, Flag, Snail, Square, Star, Trash2, Volume2 } from 'lucide-react'
import { memo } from 'react'
import type { FalaIngles } from '../hooks'
import type { ConsultaDetalhe, ModoPronuncia } from '../types'
import { OPCOES_MODO, VELOCIDADE_LENTA, VELOCIDADE_NORMAL, pronunciaNoModo } from '../utils'
import { PalavrasPronunciadas } from './PalavrasPronunciadas'
import { TextoComDestaqueFala } from './TextoComDestaqueFala'

const ID_FALA_NORMAL = 'frase-normal'
const ID_FALA_LENTA = 'frase-lenta'

function RotuloBloco({ children }: { children: string }) {
  return (
    <Text
      fontSize="xs"
      fontWeight="bold"
      color="fg.muted"
      textTransform="uppercase"
      letterSpacing="0.06em"
    >
      {children}
    </Text>
  )
}

export interface ResultadoTraducaoProps {
  consulta: ConsultaDetalhe
  modo: ModoPronuncia
  fala: FalaIngles
  favoritando: boolean
  onMudarModo: (modo: ModoPronuncia) => void
  onCopiar: (texto: string, descricao: string) => void
  onFavoritar: () => void
  onReportar: (palavra: string | null) => void
  onApagar: () => void
}

export const ResultadoTraducao = memo(function ResultadoTraducao({
  consulta,
  modo,
  fala,
  favoritando,
  onMudarModo,
  onCopiar,
  onFavoritar,
  onReportar,
  onApagar,
}: ResultadoTraducaoProps) {
  const { frase, analise } = consulta
  const pronuncia = pronunciaNoModo(consulta, modo)
  const falandoFrase = fala.falandoId === ID_FALA_NORMAL || fala.falandoId === ID_FALA_LENTA
  const rotuloOriginal = frase.idiomaOrigem === 'en' ? 'Tradução em português' : 'Português'

  return (
    <Box
      bg="bg.panel"
      borderWidth="1px"
      borderColor="border.subtle"
      borderRadius="12px"
      shadow="xs"
      overflow="hidden"
      animation="fade-in 0.25s ease-out"
    >
      <VStack align="stretch" gap={0}>
        <Box px={5} py={4} borderBottomWidth="1px" borderColor="border.subtle">
          <Flex justify="space-between" align="center" mb={1}>
            <RotuloBloco>{rotuloOriginal}</RotuloBloco>
            <IconButton
              size="2xs"
              variant="ghost"
              aria-label="Copiar português"
              title="Copiar português"
              onClick={() => onCopiar(frase.textoPortugues, 'Texto em português copiado.')}
            >
              <Copy size={13} />
            </IconButton>
          </Flex>
          <Text fontSize="md" color="fg.muted" whiteSpace="pre-wrap">
            {frase.textoPortugues}
          </Text>
        </Box>

        <Box px={5} py={4} borderBottomWidth="1px" borderColor="border.subtle">
          <Flex justify="space-between" align="center" mb={1} gap={2} wrap="wrap">
            <RotuloBloco>Inglês</RotuloBloco>
            <HStack gap={1}>
              <Button
                size="xs"
                variant={fala.falandoId === ID_FALA_NORMAL ? 'solid' : 'subtle'}
                colorPalette="brand"
                borderRadius="full"
                disabled={!fala.suportado}
                title={fala.suportado ? 'Ouvir a frase' : 'Seu navegador não tem voz em inglês'}
                onClick={() =>
                  fala.falar(frase.textoIngles, {
                    id: ID_FALA_NORMAL,
                    velocidade: VELOCIDADE_NORMAL,
                  })
                }
              >
                {fala.falandoId === ID_FALA_NORMAL ? <Square size={12} /> : <Volume2 size={13} />}
                Ouvir
              </Button>
              <Button
                size="xs"
                variant={fala.falandoId === ID_FALA_LENTA ? 'solid' : 'outline'}
                colorPalette={fala.falandoId === ID_FALA_LENTA ? 'brand' : 'gray'}
                borderRadius="full"
                disabled={!fala.suportado}
                title="Ouvir devagar"
                onClick={() =>
                  fala.falar(frase.textoIngles, { id: ID_FALA_LENTA, velocidade: VELOCIDADE_LENTA })
                }
              >
                {fala.falandoId === ID_FALA_LENTA ? <Square size={12} /> : <Snail size={13} />}
                Devagar
              </Button>
              <IconButton
                size="2xs"
                variant="ghost"
                aria-label="Copiar inglês"
                title="Copiar inglês"
                onClick={() => onCopiar(frase.textoIngles, 'Texto em inglês copiado.')}
              >
                <Copy size={13} />
              </IconButton>
            </HStack>
          </Flex>
          <TextoComDestaqueFala
            texto={frase.textoIngles}
            indiceFala={falandoFrase ? fala.indiceCaractere : null}
          />
        </Box>

        <Box
          px={5}
          py={4}
          bgGradient="to-br"
          gradientFrom="cirqueira.brand.500/12"
          gradientTo="cirqueira.cyan.500/5"
          borderBottomWidth="1px"
          borderColor="border.subtle"
        >
          <Flex justify="space-between" align="center" mb={2} gap={2} wrap="wrap">
            <RotuloBloco>Como se fala</RotuloBloco>
            <HStack gap={1}>
              <HStack gap={1} bg="bg.muted" p={0.5} borderRadius="8px">
                {OPCOES_MODO.map((opcao) => (
                  <Button
                    key={opcao.valor}
                    size="2xs"
                    borderRadius="6px"
                    variant={opcao.valor === modo ? 'solid' : 'ghost'}
                    colorPalette={opcao.valor === modo ? 'brand' : 'gray'}
                    aria-pressed={opcao.valor === modo}
                    title={opcao.descricao}
                    onClick={() => onMudarModo(opcao.valor)}
                  >
                    {opcao.rotulo}
                  </Button>
                ))}
              </HStack>
              <IconButton
                size="2xs"
                variant="ghost"
                aria-label="Copiar pronúncia"
                title="Copiar pronúncia"
                onClick={() => onCopiar(pronuncia, 'Pronúncia copiada.')}
              >
                <Copy size={13} />
              </IconButton>
            </HStack>
          </Flex>
          <Text
            fontSize={{ base: 'xl', md: '2xl' }}
            fontWeight="bold"
            color="cirqueira.brand.300"
            lineHeight="1.45"
            letterSpacing="0.01em"
            wordBreak="break-word"
          >
            {pronuncia}
          </Text>
          <Text fontSize="xs" color="fg.subtle" mt={2}>
            {modo === 'natural'
              ? 'Palavras curtas ficam reduzidas e emendadas, como o nativo fala rápido.'
              : 'Em MAIÚSCULAS fica a sílaba mais forte de cada palavra.'}
          </Text>
          {analise.palavrasAproximadas.length > 0 && (
            <HStack mt={3} gap={2} align="flex-start" fontSize="xs" color="cirqueira.orange.300">
              <Box pt="1px" flexShrink={0}>
                <AlertTriangle size={13} />
              </Box>
              <Text>
                Pronúncia aproximada para: {analise.palavrasAproximadas.join(', ')}. Se estiver
                estranha, reporte para corrigirmos.
              </Text>
            </HStack>
          )}
        </Box>

        <Box px={5} py={4}>
          <PalavrasPronunciadas
            key={consulta.uuid}
            analise={analise}
            fala={fala}
            onReportarPalavra={onReportar}
          />
        </Box>

        <Flex
          px={5}
          py={3}
          gap={2}
          borderTopWidth="1px"
          borderColor="border.subtle"
          bg="bg.subtle"
          align="center"
          wrap="wrap"
        >
          <Button
            size="xs"
            variant={consulta.favorita ? 'subtle' : 'ghost'}
            colorPalette={consulta.favorita ? 'yellow' : 'gray'}
            borderRadius="full"
            disabled={favoritando}
            onClick={onFavoritar}
          >
            <Star size={13} fill={consulta.favorita ? 'currentColor' : 'none'} />
            {consulta.favorita ? 'Favorita' : 'Favoritar'}
          </Button>
          <Button
            size="xs"
            variant="ghost"
            borderRadius="full"
            color="fg.muted"
            onClick={() => onReportar(null)}
          >
            <Flag size={13} />
            Reportar erro
          </Button>
          {frase.status !== 'ok' && (
            <Badge
              size="sm"
              variant="subtle"
              colorPalette={frase.status === 'corrigida' ? 'green' : 'orange'}
              borderRadius="full"
            >
              {frase.statusDescricao}
            </Badge>
          )}
          <IconButton
            size="xs"
            variant="ghost"
            ml="auto"
            borderRadius="full"
            aria-label="Tirar do histórico"
            title="Tirar do histórico"
            color="fg.subtle"
            _hover={{ color: 'cirqueira.red.400' }}
            onClick={onApagar}
          >
            <Trash2 size={13} />
          </IconButton>
        </Flex>
      </VStack>
    </Box>
  )
})
