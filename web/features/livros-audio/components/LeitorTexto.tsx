import { Box, Button, Center, HStack, Spinner, Text, VStack } from '@chakra-ui/react'
import { FileText } from 'lucide-react'
import { memo, useEffect, useRef } from 'react'
import type { NarracaoAtual } from '../hooks/useNarracaoAtual'
import type { LivroAudioBloco, TemaPagina } from '../types'

export const CORES_TEMA_TEXTO: Record<
  TemaPagina,
  { fundo: string; texto: string; suave: string; frase: string; palavra: string }
> = {
  claro: {
    fundo: '#fbfaf7',
    texto: '#1f2421',
    suave: '#6b716d',
    frase: 'rgba(0, 186, 156, 0.16)',
    palavra: 'rgba(0, 186, 156, 0.45)',
  },
  sepia: {
    fundo: '#f3e8cf',
    texto: '#3b2f1e',
    suave: '#7a6a51',
    frase: 'rgba(170, 120, 40, 0.18)',
    palavra: 'rgba(170, 120, 40, 0.42)',
  },
  escuro: {
    fundo: '#141716',
    texto: '#e6e9e7',
    suave: '#8d9490',
    frase: 'rgba(0, 186, 156, 0.2)',
    palavra: 'rgba(0, 186, 156, 0.5)',
  },
}

interface LeitorTextoProps {
  narracao: NarracaoAtual | null
  bloco: LivroAudioBloco | null
  tema: TemaPagina
  tamanhoFonte: number
  seguir: boolean
  destacarPalavra: boolean
  onOuvirTrecho: (numeroBloco: number, indice: number, texto: string) => void
  onVerPagina?: () => void
}

export const LeitorTexto = memo(function LeitorTexto({
  narracao,
  bloco,
  tema,
  tamanhoFonte,
  seguir,
  destacarPalavra,
  onOuvirTrecho,
  onVerPagina,
}: LeitorTextoProps) {
  const cores = CORES_TEMA_TEXTO[tema]
  const ativoRef = useRef<HTMLSpanElement | null>(null)
  const indice = narracao?.indice ?? -1
  const trechos = narracao?.trechos ?? []

  useEffect(() => {
    if (!seguir || indice < 0) return
    const elemento = ativoRef.current
    if (!elemento || typeof elemento.scrollIntoView !== 'function') return
    const reduzir = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    elemento.scrollIntoView({ block: 'center', behavior: reduzir ? 'auto' : 'smooth' })
  }, [indice, seguir])

  return (
    <Box
      flex={1}
      minH={0}
      w="full"
      overflowY="auto"
      bg={cores.fundo}
      color={cores.texto}
      css={{ WebkitOverflowScrolling: 'touch' }}
    >
      <Box maxW="680px" mx="auto" px={{ base: 5, md: 8 }} pt={{ base: 5, md: 8 }} pb="220px">
        {bloco && (
          <HStack justify="space-between" mb={4} gap={3}>
            <Text fontSize="xs" color={cores.suave} fontWeight="semibold">
              Parte {bloco.numeroBloco} · páginas {bloco.paginaInicio} a {bloco.paginaFim}
            </Text>
            {onVerPagina && (
              <Button
                size="xs"
                variant="outline"
                borderColor={cores.suave}
                color={cores.suave}
                borderRadius="full"
                onClick={onVerPagina}
              >
                <FileText size={13} />
                Ver página original
              </Button>
            )}
          </HStack>
        )}

        {!narracao || (narracao.carregandoTrechos && trechos.length === 0) ? (
          <Center py={16}>
            <Spinner color="cirqueira.brand.500" />
          </Center>
        ) : trechos.length === 0 ? (
          <VStack py={16} gap={2} textAlign="center">
            <Text fontWeight="bold">O texto desta parte não está disponível</Text>
            <Text fontSize="sm" color={cores.suave}>
              {navigator.onLine
                ? 'Esta parte foi narrada antes do texto ser guardado. O áudio funciona normalmente.'
                : 'Sem internet e esta parte não foi baixada para o aparelho.'}
            </Text>
          </VStack>
        ) : (
          <Text
            as="div"
            fontFamily="Georgia, 'Iowan Old Style', 'Times New Roman', serif"
            fontSize={`${tamanhoFonte}px`}
            lineHeight={1.75}
            textAlign="left"
            css={{ hyphens: 'auto', overflowWrap: 'break-word' }}
            lang="pt-BR"
          >
            {trechos.map((trecho, posicao) => {
              const ativo = posicao === indice
              const chave = `${narracao.numeroBloco}-${posicao}`
              return (
                <Box
                  as="span"
                  key={chave}
                  ref={ativo ? ativoRef : undefined}
                  role="button"
                  tabIndex={0}
                  cursor="pointer"
                  borderRadius="4px"
                  px="1px"
                  bg={ativo ? cores.frase : 'transparent'}
                  transition="background-color 0.25s ease"
                  onClick={() => onOuvirTrecho(narracao.numeroBloco, posicao, trecho.texto)}
                  onKeyDown={(evento) => {
                    if (evento.key === 'Enter' || evento.key === ' ') {
                      evento.preventDefault()
                      onOuvirTrecho(narracao.numeroBloco, posicao, trecho.texto)
                    }
                  }}
                >
                  {ativo && destacarPalavra && trecho.palavras.length > 0
                    ? trecho.palavras.map((palavra, indicePalavra) => (
                        <Box
                          as="span"
                          key={`${chave}-${indicePalavra}-${palavra.inicio}`}
                          borderRadius="3px"
                          bg={
                            indicePalavra === narracao.indicePalavra ? cores.palavra : 'transparent'
                          }
                        >
                          {palavra.texto}{' '}
                        </Box>
                      ))
                    : `${trecho.texto} `}
                </Box>
              )
            })}
          </Text>
        )}
      </Box>
    </Box>
  )
})
