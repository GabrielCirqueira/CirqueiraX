import type { CategoriaOpcao } from '@/features/downloads-video/types'
import {
  Badge,
  Box,
  Button,
  Dialog,
  Field,
  HStack,
  Input,
  Portal,
  Spinner,
  Text,
  VStack,
} from '@chakra-ui/react'
import { CalendarClock, Images } from 'lucide-react'
import { memo, useState } from 'react'
import { ordenarCategoriasParaEdicao } from '../utils/categoriasEdicao'

export interface DadosSalvarEdicao {
  nomeArquivo: string
  categoriaId: string | null
}

export interface ModalSalvarEdicaoProps {
  aberto: boolean
  nomeSugerido: string
  categorias: CategoriaOpcao[]
  mantemDataOriginal: boolean
  salvando: boolean
  onFechar: () => void
  onSalvar: (dados: DadosSalvarEdicao) => void
}

const VALOR_SEM_CATEGORIA = ''

export const ModalSalvarEdicao = memo(function ModalSalvarEdicao({
  aberto,
  nomeSugerido,
  categorias,
  mantemDataOriginal,
  salvando,
  onFechar,
  onSalvar,
}: ModalSalvarEdicaoProps) {
  return (
    <Dialog.Root
      lazyMount
      unmountOnExit
      open={aberto}
      onOpenChange={(e) => !e.open && onFechar()}
      placement="center"
      size="md"
    >
      <Portal>
        <Dialog.Backdrop />
        <Dialog.Positioner p={4}>
          <Dialog.Content
            bg="bg.panel"
            borderWidth="1px"
            borderColor="border.subtle"
            borderRadius="xl"
            p={5}
            maxW="md"
          >
            <FormularioSalvarEdicao
              nomeSugerido={nomeSugerido}
              categorias={categorias}
              mantemDataOriginal={mantemDataOriginal}
              salvando={salvando}
              onFechar={onFechar}
              onSalvar={onSalvar}
            />
          </Dialog.Content>
        </Dialog.Positioner>
      </Portal>
    </Dialog.Root>
  )
})

type FormularioSalvarEdicaoProps = Omit<ModalSalvarEdicaoProps, 'aberto'>

function FormularioSalvarEdicao({
  nomeSugerido,
  categorias,
  mantemDataOriginal,
  salvando,
  onFechar,
  onSalvar,
}: FormularioSalvarEdicaoProps) {
  const [nomeArquivo, setNomeArquivo] = useState(nomeSugerido)
  const [categoriaId, setCategoriaId] = useState(VALOR_SEM_CATEGORIA)

  const categoriasOrdenadas = ordenarCategoriasParaEdicao(categorias)
  const categoriaEscolhida = categorias.find((categoria) => categoria.uuid === categoriaId)
  const enviaAoGoogleFotos = Boolean(categoriaEscolhida?.googlePhotosAlbumId)

  function aoSalvar() {
    onSalvar({
      nomeArquivo: nomeArquivo.trim() || nomeSugerido,
      categoriaId: categoriaId || null,
    })
  }

  return (
    <>
      <Dialog.Header p={0} mb={4}>
        <Dialog.Title fontSize="md" fontWeight="semibold">
          Salvar imagem editada
        </Dialog.Title>
      </Dialog.Header>
      <Dialog.Body p={0}>
        <VStack gap={4} align="stretch">
          <Field.Root>
            <Field.Label fontSize="xs" color="fg.muted">
              Nome do arquivo
            </Field.Label>
            <Input
              size="sm"
              borderRadius="lg"
              value={nomeArquivo}
              onChange={(evento) => setNomeArquivo(evento.target.value)}
            />
          </Field.Root>

          <VStack gap={1.5} align="stretch">
            <Text fontSize="xs" color="fg.muted" fontWeight="medium">
              Categoria
            </Text>
            <VStack
              gap={0.5}
              align="stretch"
              maxH="240px"
              overflowY="auto"
              borderWidth="1px"
              borderColor="border.subtle"
              borderRadius="lg"
              p={1}
            >
              <OpcaoCategoria
                nome="Sem categoria"
                descricao="Só salva. Você categoriza depois."
                selecionada={categoriaId === VALOR_SEM_CATEGORIA}
                onSelecionar={() => setCategoriaId(VALOR_SEM_CATEGORIA)}
              />
              {categoriasOrdenadas.map((categoria) => (
                <OpcaoCategoria
                  key={categoria.uuid}
                  nome={categoria.nome}
                  temAlbumGoogleFotos={Boolean(categoria.googlePhotosAlbumId)}
                  selecionada={categoriaId === categoria.uuid}
                  onSelecionar={() => setCategoriaId(categoria.uuid)}
                />
              ))}
            </VStack>
          </VStack>

          {mantemDataOriginal && (
            <HStack gap={2} fontSize="xs" color="fg.subtle">
              <CalendarClock size={14} />
              <Text>A cópia editada mantém a data e a hora da imagem original.</Text>
            </HStack>
          )}

          <HStack
            justify="flex-end"
            gap={2}
            pt={3}
            borderTopWidth="1px"
            borderColor="border.subtle"
          >
            <Button size="sm" variant="ghost" borderRadius="lg" onClick={onFechar}>
              Cancelar
            </Button>
            <Button
              size="sm"
              colorPalette="brand"
              borderRadius="lg"
              disabled={salvando}
              onClick={aoSalvar}
            >
              {salvando ? <Spinner size="xs" /> : enviaAoGoogleFotos && <Images size={14} />}
              {enviaAoGoogleFotos ? 'Salvar e enviar ao Google Fotos' : 'Salvar'}
            </Button>
          </HStack>
        </VStack>
      </Dialog.Body>
    </>
  )
}

interface OpcaoCategoriaProps {
  nome: string
  descricao?: string
  temAlbumGoogleFotos?: boolean
  selecionada: boolean
  onSelecionar: () => void
}

function OpcaoCategoria({
  nome,
  descricao,
  temAlbumGoogleFotos = false,
  selecionada,
  onSelecionar,
}: OpcaoCategoriaProps) {
  return (
    <HStack
      as="button"
      justify="space-between"
      gap={3}
      px={3}
      py={2}
      borderRadius="md"
      textAlign="left"
      cursor="pointer"
      bg={selecionada ? 'cirqueira.brand.500/10' : 'transparent'}
      _hover={{ bg: selecionada ? 'cirqueira.brand.500/15' : 'bg.muted' }}
      transition="background 0.12s ease"
      onClick={onSelecionar}
    >
      <HStack gap={2.5} minW={0}>
        <Box
          w={3.5}
          h={3.5}
          flexShrink={0}
          borderRadius="full"
          borderWidth={selecionada ? '4px' : '1.5px'}
          borderColor={selecionada ? 'cirqueira.brand.500' : 'border'}
        />
        <VStack gap={0} align="start" minW={0}>
          <Text fontSize="sm" color="fg" truncate>
            {nome}
          </Text>
          {descricao && (
            <Text fontSize="xs" color="fg.subtle">
              {descricao}
            </Text>
          )}
        </VStack>
      </HStack>
      {temAlbumGoogleFotos && (
        <Badge size="xs" variant="subtle" colorPalette="blue" borderRadius="md" flexShrink={0}>
          Google Fotos
        </Badge>
      )}
    </HStack>
  )
}
