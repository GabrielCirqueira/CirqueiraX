import { Button, HStack, IconButton, Text, VStack } from '@chakra-ui/react'
import { Copy, Download, ImagePlus, Save } from 'lucide-react'
import { memo } from 'react'

export interface CabecalhoEditorProps {
  descricaoImagem: string | null
  temImagem: boolean
  copiando: boolean
  onAbrirArquivo: () => void
  onBaixar: () => void
  onSalvar: () => void
  onCopiar: () => void
}

export const CabecalhoEditor = memo(function CabecalhoEditor({
  descricaoImagem,
  temImagem,
  copiando,
  onAbrirArquivo,
  onBaixar,
  onSalvar,
  onCopiar,
}: CabecalhoEditorProps) {
  return (
    <HStack justify="space-between" align="flex-end" flexWrap="wrap" gap={4}>
      <VStack gap={1} alignItems="flex-start" minW={0}>
        <Text as="h1" fontSize="2xl" fontWeight="semibold" color="fg" letterSpacing="tight">
          Editor de imagem
        </Text>
        <Text fontSize="sm" color="fg.subtle" truncate maxW={{ base: '80vw', md: 'lg' }}>
          {descricaoImagem ?? 'Cole um print, marque o que importa e copie de volta.'}
        </Text>
      </VStack>

      <HStack gap={2}>
        <IconButton
          size="sm"
          variant="ghost"
          borderRadius="lg"
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
          borderRadius="lg"
          color="fg.muted"
          aria-label="Baixar imagem"
          title="Baixar PNG"
          disabled={!temImagem}
          onClick={onBaixar}
        >
          <Download size={16} />
        </IconButton>
        <Button
          size="sm"
          variant="outline"
          borderRadius="lg"
          disabled={!temImagem}
          onClick={onSalvar}
          title="Salvar no CirqueiraX ou enviar ao Google Fotos (Ctrl + S)"
        >
          <Save size={15} />
          Salvar
        </Button>
        <Button
          size="sm"
          colorPalette="brand"
          borderRadius="lg"
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
