import { usuarioPossuiPermissao } from '@/shared/utils/funcionalidadesSistema'
import { useAuthStore } from '@/stores'
import { Button, HStack, IconButton, Menu, Portal, Text, VStack } from '@chakra-ui/react'
import { Copy, Download, FilePlus2, ImagePlus, Save } from 'lucide-react'
import { memo } from 'react'
import type { FormatoExportacao } from '../utils/exportacaoImagem'

export interface CabecalhoEditorProps {
  descricaoImagem: string | null
  temImagem: boolean
  copiando: boolean
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
  onAbrirArquivo,
  onNovaTela,
  onBaixar,
  onSalvar,
  onCopiar,
}: CabecalhoEditorProps) {
  const usuario = useAuthStore((s) => s.usuario)
  const podeGoogleFotos = usuarioPossuiPermissao(usuario, 'google_fotos')

  return (
    <HStack justify="space-between" align="flex-end" flexWrap="wrap" gap={4}>
      <VStack gap={1} alignItems="flex-start" minW={0}>
        <Text as="h1" fontSize="2xl" fontWeight="semibold" color="fg" letterSpacing="tight">
          Editor de imagem
        </Text>
        <Text fontSize="sm" color="fg.subtle" truncate maxW={{ base: '80vw', md: 'lg' }}>
          {descricaoImagem ?? 'Cole um print ou crie do zero com formas e texto.'}
        </Text>
      </VStack>

      <HStack gap={2}>
        <IconButton
          size="sm"
          variant="ghost"
          borderRadius="full"
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
          borderRadius="full"
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
              borderRadius="full"
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
          borderRadius="full"
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
          borderRadius="full"
          disabled={!temImagem || copiando}
          onClick={onCopiar}
          title="Copiar imagem editada (Ctrl + C)"
        >
          <Copy size={15} />
          {copiando ? 'Copiando...' : 'Copiar'}
        </Button>
      </HStack>
    </HStack>
  )
})
