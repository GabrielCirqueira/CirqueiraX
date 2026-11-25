import {
  Box,
  Button,
  Dialog,
  Flex,
  HStack,
  IconButton,
  NativeSelect,
  Portal,
  SimpleGrid,
  Text,
  Textarea,
  VStack,
} from '@chakra-ui/react'
import { Flag, Languages, Mic, X } from 'lucide-react'
import { memo, useState } from 'react'
import type { ReportarErroPayload, TipoErroPronuncia } from '../types'

const OPCOES_TIPO: Array<{
  valor: TipoErroPronuncia
  titulo: string
  texto: string
  icone: typeof Mic
}> = [
  { valor: 'pronuncia', titulo: 'Pronúncia', texto: 'Alguma palavra não soa assim', icone: Mic },
  {
    valor: 'traducao',
    titulo: 'Tradução',
    texto: 'O sentido ficou errado ou estranho',
    icone: Languages,
  },
]
const LIMITE_COMENTARIO = 500
const VALOR_FRASE_INTEIRA = ''

export interface DialogoReportarErroProps {
  aberto: boolean
  palavras: string[]
  palavraInicial: string | null
  enviando: boolean
  onFechar: () => void
  onEnviar: (payload: ReportarErroPayload) => void
}

export const DialogoReportarErro = memo(function DialogoReportarErro({
  aberto,
  palavras,
  palavraInicial,
  enviando,
  onFechar,
  onEnviar,
}: DialogoReportarErroProps) {
  const [tipo, setTipo] = useState<TipoErroPronuncia>('pronuncia')
  const [palavra, setPalavra] = useState(palavraInicial ?? VALOR_FRASE_INTEIRA)
  const [comentario, setComentario] = useState('')

  function enviar() {
    onEnviar({
      tipo,
      palavra: tipo === 'pronuncia' && palavra !== VALOR_FRASE_INTEIRA ? palavra : null,
      comentario: comentario.trim() || null,
    })
  }

  return (
    <Dialog.Root
      lazyMount
      unmountOnExit
      open={aberto}
      onOpenChange={(evento) => !evento.open && onFechar()}
      size="md"
      placement="center"
    >
      <Portal>
        <Dialog.Backdrop bg="rgba(0, 0, 0, 0.75)" />
        <Dialog.Positioner px={4}>
          <Dialog.Content
            borderRadius="12px"
            bg="bg.panel"
            borderWidth="1px"
            borderColor="border.subtle"
            shadow="2xl"
            overflow="hidden"
          >
            <Flex
              align="center"
              justify="space-between"
              p={4}
              borderBottomWidth="1px"
              borderColor="border.subtle"
            >
              <HStack gap={2.5}>
                <Box
                  p={2}
                  borderRadius="8px"
                  bg="cirqueira.orange.500/10"
                  color="cirqueira.orange.400"
                  display="inline-flex"
                >
                  <Flag size={18} />
                </Box>
                <VStack align="start" gap={0}>
                  <Dialog.Title fontSize="md" fontWeight="bold" color="fg">
                    Reportar erro
                  </Dialog.Title>
                  <Text fontSize="xs" color="fg.subtle">
                    Vai para a fila de correções; a correção vale para todas as frases
                  </Text>
                </VStack>
              </HStack>
              <IconButton
                size="sm"
                variant="ghost"
                onClick={onFechar}
                aria-label="Fechar"
                borderRadius="full"
              >
                <X size={18} />
              </IconButton>
            </Flex>

            <Dialog.Body p={5}>
              <VStack gap={4} align="stretch">
                <SimpleGrid columns={2} gap={2}>
                  {OPCOES_TIPO.map(({ valor, titulo, texto, icone: Icone }) => {
                    const ativo = valor === tipo
                    return (
                      <Box
                        as="button"
                        key={valor}
                        onClick={() => setTipo(valor)}
                        aria-pressed={ativo}
                        textAlign="left"
                        p={3}
                        borderRadius="10px"
                        borderWidth="1px"
                        borderColor={ativo ? 'cirqueira.brand.400' : 'border.subtle'}
                        bg={ativo ? 'cirqueira.brand.500/10' : 'bg.subtle'}
                        transition="all 0.15s"
                      >
                        <HStack gap={2} color={ativo ? 'cirqueira.brand.300' : 'fg'}>
                          <Icone size={15} />
                          <Text fontSize="sm" fontWeight="semibold">
                            {titulo}
                          </Text>
                        </HStack>
                        <Text fontSize="xs" color="fg.subtle" mt={1}>
                          {texto}
                        </Text>
                      </Box>
                    )
                  })}
                </SimpleGrid>

                {tipo === 'pronuncia' && palavras.length > 0 && (
                  <VStack align="stretch" gap={1.5}>
                    <Text fontSize="xs" fontWeight="semibold" color="fg.muted">
                      Qual palavra?
                    </Text>
                    <NativeSelect.Root size="sm">
                      <NativeSelect.Field
                        value={palavra}
                        onChange={(evento) => setPalavra(evento.target.value)}
                        borderRadius="8px"
                      >
                        <option value={VALOR_FRASE_INTEIRA}>Não sei / a frase inteira</option>
                        {palavras.map((opcao) => (
                          <option key={opcao} value={opcao}>
                            {opcao}
                          </option>
                        ))}
                      </NativeSelect.Field>
                      <NativeSelect.Indicator />
                    </NativeSelect.Root>
                  </VStack>
                )}

                <VStack align="stretch" gap={1.5}>
                  <Text fontSize="xs" fontWeight="semibold" color="fg.muted">
                    O que está errado? (opcional)
                  </Text>
                  <Textarea
                    value={comentario}
                    onChange={(evento) =>
                      setComentario(evento.target.value.slice(0, LIMITE_COMENTARIO))
                    }
                    placeholder='Ex.: o "th" ficou como "f"; o certo seria…'
                    rows={3}
                    borderRadius="8px"
                    fontSize="sm"
                  />
                </VStack>
              </VStack>
            </Dialog.Body>

            <Dialog.Footer p={4} borderTopWidth="1px" borderColor="border.subtle">
              <HStack gap={2} justify="flex-end">
                <Button size="sm" variant="ghost" onClick={onFechar} borderRadius="full">
                  Cancelar
                </Button>
                <Button
                  size="sm"
                  colorPalette="brand"
                  onClick={enviar}
                  disabled={enviando}
                  borderRadius="full"
                >
                  <Flag size={14} />
                  {enviando ? 'Enviando…' : 'Enviar relato'}
                </Button>
              </HStack>
            </Dialog.Footer>
          </Dialog.Content>
        </Dialog.Positioner>
      </Portal>
    </Dialog.Root>
  )
})
