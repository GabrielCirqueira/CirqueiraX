import { usuarioPossuiPermissao } from '@/shared/utils/funcionalidadesSistema'
import { useAuthStore } from '@/stores'
import { Box, Button, HStack, IconButton, Menu, Portal, Text, VStack } from '@chakra-ui/react'
import {
  Copy,
  Download,
  Eraser,
  FilePlus2,
  ImagePlus,
  PenLine,
  Redo2,
  Save,
  Undo2,
} from 'lucide-react'
import { memo } from 'react'
import type { FormatoExportacao } from '../utils/exportacaoImagem'

export interface CabecalhoEditorProps {
  descricaoImagem: string | null
  temImagem: boolean
  copiando: boolean
  podeDesfazer: boolean
  podeRefazer: boolean
  temAnotacoes: boolean
  onDesfazer: () => void
  onRefazer: () => void
  onLimpar: () => void
  onAbrirArquivo: () => void
  onNovaTela: () => void
  onBaixar: (formato: FormatoExportacao) => void
  onSalvar: () => void
  onCopiar: () => void
}

export const CabecalhoEditor = memo(function CabecalhoEditor({
  descricaoImagem,
  temImagem,
  copiando,
  podeDesfazer,
  podeRefazer,
  temAnotacoes,
  onDesfazer,
  onRefazer,
  onLimpar,
  onAbrirArquivo,
  onNovaTela,
  onBaixar,
  onSalvar,
  onCopiar,
}: CabecalhoEditorProps) {
  const usuario = useAuthStore((s) => s.usuario)
  const podeGoogleFotos = usuarioPossuiPermissao(usuario, 'google_fotos')

  return (
    <HStack
      justify="space-between"
      gap={3}
      px={{ base: 3, md: 4 }}
      py={2}
      minH="52px"
      bg="bg.panel"
      borderBottomWidth="1px"
      borderColor="border.subtle"
      flexWrap="wrap"
    >
      <HStack gap={3} minW={0} flex="1">
        <Box
          p={1.5}
          borderRadius="8px"
          bg="cirqueira.rose.400/12"
          color="cirqueira.rose.400"
          display={{ base: 'none', sm: 'inline-flex' }}
        >
          <PenLine size={16} />
        </Box>
        <VStack gap={0} alignItems="flex-start" minW={0}>
          <Text as="h1" fontSize="sm" fontWeight="semibold" color="fg" lineHeight="1.3">
            Editor de imagem
          </Text>
          <Text fontSize="xs" color="fg.subtle" truncate maxW={{ base: '55vw', md: 'md' }}>
            {descricaoImagem ?? 'Cole um print ou crie do zero com formas e texto.'}
          </Text>
        </VStack>
        <HStack gap={0.5} ms={{ base: 0, md: 4 }}>
          <IconButton
            size="sm"
            variant="ghost"
            borderRadius="8px"
            color="fg.muted"
            aria-label="Desfazer"
            title="Desfazer (Ctrl + Z)"
            disabled={!podeDesfazer}
            onClick={onDesfazer}
          >
            <Undo2 size={16} />
          </IconButton>
          <IconButton
            size="sm"
            variant="ghost"
            borderRadius="8px"
            color="fg.muted"
            aria-label="Refazer"
            title="Refazer (Ctrl + Y)"
            disabled={!podeRefazer}
            onClick={onRefazer}
          >
            <Redo2 size={16} />
          </IconButton>
          <IconButton
            size="sm"
            variant="ghost"
            borderRadius="8px"
            color="fg.muted"
            _hover={{ color: 'cirqueira.red.500' }}
            aria-label="Limpar edições"
            title="Apagar todos os itens (dá para desfazer)"
            disabled={!temAnotacoes}
            onClick={onLimpar}
          >
            <Eraser size={16} />
          </IconButton>
        </HStack>
      </HStack>

      <HStack gap={2}>
        <IconButton
          size="sm"
          variant="ghost"
          borderRadius="8px"
          color="fg.muted"
          aria-label="Abrir outra imagem"
          title="Abrir outra imagem"
          onClick={onAbrirArquivo}
        >
          <ImagePlus size={16} />
        </IconButton>
        <IconButton
          size="sm"
          variant="ghost"
          borderRadius="8px"
          color="fg.muted"
          aria-label="Nova tela em branco"
          title="Nova tela em branco"
          onClick={onNovaTela}
        >
          <FilePlus2 size={16} />
        </IconButton>
        <Menu.Root positioning={{ placement: 'bottom-end' }}>
          <Menu.Trigger asChild>
            <IconButton
              size="sm"
              variant="ghost"
              borderRadius="8px"
              color="fg.muted"
              aria-label="Baixar imagem"
              title="Baixar imagem"
              disabled={!temImagem}
            >
              <Download size={16} />
            </IconButton>
          </Menu.Trigger>
          <Portal>
            <Menu.Positioner>
              <Menu.Content minW="200px">
                <Menu.Item value="png" onClick={() => onBaixar('png')}>
                  Baixar PNG
                  <Menu.ItemCommand>transparência</Menu.ItemCommand>
                </Menu.Item>
                <Menu.Item value="jpg" onClick={() => onBaixar('jpg')}>
                  Baixar JPG
                  <Menu.ItemCommand>menor</Menu.ItemCommand>
                </Menu.Item>
              </Menu.Content>
            </Menu.Positioner>
          </Portal>
        </Menu.Root>
        <Button
          size="sm"
          variant="outline"
          borderRadius="8px"
          disabled={!temImagem}
          onClick={onSalvar}
          title={
            podeGoogleFotos
              ? 'Salvar no CirqueiraX ou enviar ao Google Fotos (Ctrl + S)'
              : 'Salvar no CirqueiraX (Ctrl + S)'
          }
        >
          <Save size={15} />
          Salvar
        </Button>
        <Button
          size="sm"
          colorPalette="brand"
          borderRadius="8px"
          disabled={!temImagem || copiando}
          onClick={onCopiar}
          title="Copiar a imagem final (Ctrl + Shift + C)"
        >
          <Copy size={15} />
          {copiando ? 'Copiando...' : 'Copiar imagem'}
        </Button>
      </HStack>
    </HStack>
  )
})
