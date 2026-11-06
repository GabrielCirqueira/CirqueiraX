import { Badge, Box, Button, Flex, HStack, IconButton, Text, Textarea } from '@chakra-ui/react'
import { Bookmark, Download, Highlighter, Play, StickyNote, Trash2, X } from 'lucide-react'
import { useState } from 'react'
import type { MarcacaoLivro, TipoMarcacao } from '../types'
import { baixarArquivoTexto, gerarMarkdownMarcacoes } from '../utils/exportarMarcacoes'

interface PainelMarcacoesProps {
  titulo: string
  marcacoes: MarcacaoLivro[]
  carregando: boolean
  onOuvir: (marcacao: MarcacaoLivro) => void
  onIrParaPagina: (pagina: number) => void
  onSalvarNota: (marcacao: MarcacaoLivro, nota: string | null) => void
  onRemover: (marcacao: MarcacaoLivro) => void
  onFechar: () => void
}

type Filtro = 'todos' | TipoMarcacao

const FILTROS: { valor: Filtro; rotulo: string }[] = [
  { valor: 'todos', rotulo: 'Tudo' },
  { valor: 'marcador', rotulo: 'Marcadores' },
  { valor: 'destaque', rotulo: 'Destaques' },
  { valor: 'nota', rotulo: 'Notas' },
]

const ICONES = { marcador: Bookmark, destaque: Highlighter, nota: StickyNote }
const CORES = { marcador: 'brand', destaque: 'yellow', nota: 'orange' }

function nomeArquivo(titulo: string): string {
  const base = titulo
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .replace(/[^\w-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
  return `${base || 'livro'}-marcacoes.md`
}

export function PainelMarcacoes({
  titulo,
  marcacoes,
  carregando,
  onOuvir,
  onIrParaPagina,
  onSalvarNota,
  onRemover,
  onFechar,
}: PainelMarcacoesProps) {
  const [filtro, setFiltro] = useState<Filtro>('todos')
  const [editando, setEditando] = useState<string | null>(null)
  const [textoNota, setTextoNota] = useState('')
  const visiveis = filtro === 'todos' ? marcacoes : marcacoes.filter((item) => item.tipo === filtro)

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
      <Box p={3.5} pb={2} borderBottom="1px solid" borderColor="cirqueira.grey.800">
        <HStack justify="space-between" mb={2}>
          <HStack gap={2} color="cirqueira.brand.400">
            <Bookmark size={16} />
            <Text fontSize="xs" fontWeight="bold" color="white">
              Marcações ({marcacoes.length})
            </Text>
          </HStack>
          <HStack gap={1}>
            <Button
              size="xs"
              variant="subtle"
              disabled={marcacoes.length === 0}
              onClick={() =>
                baixarArquivoTexto(nomeArquivo(titulo), gerarMarkdownMarcacoes(titulo, marcacoes))
              }
              title="Baixar tudo em Markdown"
            >
              <Download size={12} />
              Markdown
            </Button>
            <IconButton
              size="xs"
              variant="ghost"
              color="cirqueira.grey.400"
              onClick={onFechar}
              aria-label="Fechar marcações"
            >
              <X size={14} />
            </IconButton>
          </HStack>
        </HStack>
        <HStack gap={1} flexWrap="wrap">
          {FILTROS.map((opcao) => (
            <Button
              key={opcao.valor}
              size="2xs"
              variant={filtro === opcao.valor ? 'solid' : 'ghost'}
              colorPalette={filtro === opcao.valor ? 'brand' : 'gray'}
              onClick={() => setFiltro(opcao.valor)}
            >
              {opcao.rotulo}
            </Button>
          ))}
        </HStack>
      </Box>

      <Flex direction="column" gap={1.5} p={3} overflowY="auto">
        {carregando && (
          <Text fontSize="xs" color="cirqueira.grey.400">
            Carregando…
          </Text>
        )}
        {!carregando && visiveis.length === 0 && (
          <Text fontSize="xs" color="cirqueira.grey.400" py={4} textAlign="center">
            Nada aqui ainda. Use “Marcar” no player ou clique numa frase da página para destacar ou
            anotar.
          </Text>
        )}
        {visiveis.map((marcacao) => {
          const Icone = ICONES[marcacao.tipo]
          return (
            <Box
              key={marcacao.uuid}
              px={2.5}
              py={2}
              borderRadius="8px"
              bg="rgba(255, 255, 255, 0.03)"
              _hover={{ bg: 'rgba(255, 255, 255, 0.06)' }}
            >
              <HStack justify="space-between" mb={1}>
                <HStack gap={1.5}>
                  <Badge size="xs" colorPalette={CORES[marcacao.tipo]} variant="subtle">
                    <Icone size={10} />
                    {marcacao.tipoDescricao}
                  </Badge>
                  <Text
                    as="button"
                    fontSize="11px"
                    color="cirqueira.brand.300"
                    fontWeight="semibold"
                    onClick={() => onIrParaPagina(marcacao.pagina)}
                  >
                    Página {marcacao.pagina}
                  </Text>
                </HStack>
                <HStack gap={0.5}>
                  <IconButton
                    size="2xs"
                    variant="ghost"
                    color="cirqueira.grey.300"
                    onClick={() => onOuvir(marcacao)}
                    aria-label="Ouvir a partir daqui"
                    title="Ouvir a partir daqui"
                  >
                    <Play size={12} />
                  </IconButton>
                  <IconButton
                    size="2xs"
                    variant="ghost"
                    color="cirqueira.grey.300"
                    onClick={() => {
                      setEditando(marcacao.uuid)
                      setTextoNota(marcacao.nota ?? '')
                    }}
                    aria-label="Editar nota"
                    title="Escrever nota"
                  >
                    <StickyNote size={12} />
                  </IconButton>
                  <IconButton
                    size="2xs"
                    variant="ghost"
                    color="cirqueira.grey.500"
                    _hover={{ color: 'cirqueira.red.400' }}
                    onClick={() => onRemover(marcacao)}
                    aria-label="Apagar marcação"
                  >
                    <Trash2 size={12} />
                  </IconButton>
                </HStack>
              </HStack>
              {marcacao.texto && (
                <Text fontSize="xs" color="cirqueira.grey.200" lineClamp={4}>
                  “{marcacao.texto}”
                </Text>
              )}
              {editando === marcacao.uuid ? (
                <Box mt={1.5}>
                  <Textarea
                    size="xs"
                    rows={3}
                    autoFocus
                    value={textoNota}
                    onChange={(evento) => setTextoNota(evento.target.value)}
                    bg="cirqueira.grey.950"
                    borderColor="cirqueira.grey.800"
                    mb={1.5}
                  />
                  <HStack justify="flex-end" gap={1}>
                    <Button size="2xs" variant="ghost" onClick={() => setEditando(null)}>
                      Cancelar
                    </Button>
                    <Button
                      size="2xs"
                      colorPalette="brand"
                      disabled={marcacao.tipo === 'nota' && !textoNota.trim()}
                      onClick={() => {
                        onSalvarNota(marcacao, textoNota.trim() || null)
                        setEditando(null)
                      }}
                    >
                      Salvar
                    </Button>
                  </HStack>
                </Box>
              ) : (
                marcacao.nota && (
                  <Text fontSize="xs" color="orange.200" mt={1} whiteSpace="pre-wrap">
                    {marcacao.nota}
                  </Text>
                )
              )}
            </Box>
          )
        })}
      </Flex>
    </Box>
  )
}
