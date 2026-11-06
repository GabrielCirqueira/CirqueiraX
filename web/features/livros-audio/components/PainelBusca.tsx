import { Box, Button, Flex, HStack, IconButton, Input, Progress, Text } from '@chakra-ui/react'
import { Play, Search, X } from 'lucide-react'
import { type FormEvent, useRef, useState } from 'react'
import { type ResultadoBusca, buscarNoLivro } from '../utils/buscaLivro'
import type { PDFDocumentProxy } from '../utils/pdf'

interface PainelBuscaProps {
  documento: PDFDocumentProxy
  resultadoAtivo: string | null
  onSelecionar: (resultado: ResultadoBusca) => void
  onOuvir: (resultado: ResultadoBusca) => void
  onFechar: () => void
}

const LIMITE_RESULTADOS = 200

export function PainelBusca({
  documento,
  resultadoAtivo,
  onSelecionar,
  onOuvir,
  onFechar,
}: PainelBuscaProps) {
  const [consulta, setConsulta] = useState('')
  const [resultados, setResultados] = useState<ResultadoBusca[] | null>(null)
  const [progresso, setProgresso] = useState<number | null>(null)
  const buscaAtualRef = useRef(0)

  async function buscar(evento: FormEvent) {
    evento.preventDefault()
    const termo = consulta.trim()
    if (termo.length < 2) return
    const id = ++buscaAtualRef.current
    setProgresso(0)
    const encontrados = await buscarNoLivro(documento, termo, LIMITE_RESULTADOS, (fracao) => {
      if (buscaAtualRef.current === id) setProgresso(fracao)
    })
    if (buscaAtualRef.current !== id) return
    setResultados(encontrados)
    setProgresso(null)
    const primeiro = encontrados[0]
    if (primeiro) onSelecionar(primeiro)
  }

  return (
    <Box
      position="fixed"
      top={{ base: '60px', md: '68px' }}
      right={{ base: 3, md: 6 }}
      w={{ base: 'calc(100vw - 24px)', sm: '420px' }}
      maxH="calc(100vh - 200px)"
      display="flex"
      flexDirection="column"
      bg="cirqueira.grey.900"
      border="1px solid"
      borderColor="cirqueira.grey.800"
      borderRadius="8px"
      boxShadow="0 20px 50px rgba(0, 0, 0, 0.9)"
      zIndex={70}
    >
      <Box p={3} borderBottom="1px solid" borderColor="cirqueira.grey.800">
        <form onSubmit={buscar}>
          <HStack gap={1.5}>
            <Input
              size="sm"
              autoFocus
              value={consulta}
              onChange={(evento) => setConsulta(evento.target.value)}
              placeholder="Buscar no texto do livro"
              color="white"
              bg="cirqueira.grey.950"
              borderColor="cirqueira.grey.800"
            />
            <IconButton
              type="submit"
              size="sm"
              colorPalette="brand"
              disabled={consulta.trim().length < 2}
              aria-label="Buscar"
            >
              <Search size={14} />
            </IconButton>
            <IconButton
              size="sm"
              variant="ghost"
              color="cirqueira.grey.400"
              onClick={onFechar}
              aria-label="Fechar busca"
            >
              <X size={14} />
            </IconButton>
          </HStack>
        </form>
        {progresso !== null && (
          <Progress.Root size="xs" value={Math.round(progresso * 100)} colorPalette="brand" mt={2}>
            <Progress.Track>
              <Progress.Range />
            </Progress.Track>
          </Progress.Root>
        )}
        {resultados && progresso === null && (
          <Text fontSize="11px" color="cirqueira.grey.400" mt={1.5}>
            {resultados.length === 0
              ? 'Nada encontrado.'
              : `${resultados.length >= LIMITE_RESULTADOS ? `Mais de ${LIMITE_RESULTADOS}` : resultados.length} resultado(s).`}
          </Text>
        )}
      </Box>

      <Flex direction="column" gap={1} p={2} overflowY="auto">
        {resultados?.map((resultado) => {
          const ativo = resultado.id === resultadoAtivo
          return (
            <HStack
              key={resultado.id}
              gap={2}
              px={2.5}
              py={2}
              borderRadius="8px"
              cursor="pointer"
              bg={ativo ? 'cirqueira.brand.500/15' : 'transparent'}
              _hover={{ bg: ativo ? 'cirqueira.brand.500/20' : 'rgba(255, 255, 255, 0.05)' }}
              onClick={() => onSelecionar(resultado)}
            >
              <Box flex={1} minW={0}>
                <Text fontSize="10px" color="cirqueira.brand.300" fontWeight="bold">
                  Página {resultado.pagina}
                </Text>
                <Text fontSize="xs" color="cirqueira.grey.300" lineClamp={2}>
                  …{resultado.antes}
                  <Text as="mark" bg="orange.400/30" color="white" borderRadius="8px" px="1px">
                    {resultado.encontrado}
                  </Text>
                  {resultado.depois}…
                </Text>
              </Box>
              <Button
                size="2xs"
                variant="subtle"
                colorPalette="brand"
                flexShrink={0}
                onClick={(evento) => {
                  evento.stopPropagation()
                  onOuvir(resultado)
                }}
                title="Ouvir a partir daqui"
              >
                <Play size={11} />
                Ouvir
              </Button>
            </HStack>
          )
        })}
      </Flex>
    </Box>
  )
}
