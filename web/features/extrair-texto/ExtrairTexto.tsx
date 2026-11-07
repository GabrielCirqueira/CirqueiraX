import { extrairImagemDaTransferencia } from '@/features/editor-imagem/utils/areaTransferencia'
import { useSEO } from '@/shared/hooks'
import { Box, Grid, VStack } from '@chakra-ui/react'
import { type ChangeEvent, type DragEvent, memo, useRef, useState } from 'react'
import { CabecalhoExtracao } from './components/CabecalhoExtracao'
import { ImagemLida } from './components/ImagemLida'
import { ResultadoTexto } from './components/ResultadoTexto'
import { ZonaColarImagemTexto } from './components/ZonaColarImagemTexto'
import { useColarImagem } from './hooks/useColarImagem'
import { useExtracaoTexto } from './hooks/useExtracaoTexto'

const TIPOS_ACEITOS = 'image/png,image/jpeg,image/webp,image/gif,image/bmp'

export function Component() {
  return <ExtrairTextoView />
}

const ExtrairTextoView = memo(function ExtrairTextoView() {
  useSEO({
    title: 'Extrair Texto',
    description: 'Cole uma imagem com Ctrl + V e copie todo o texto dela na hora.',
    keywords: 'extrair texto, ocr, imagem para texto, cirqueirax',
  })

  const extracao = useExtracaoTexto()
  const [arrastandoArquivo, setArrastandoArquivo] = useState(false)
  const seletorArquivoRef = useRef<HTMLInputElement>(null)

  useColarImagem(extracao.extrair)

  function abrirSeletor() {
    seletorArquivoRef.current?.click()
  }

  function aoSoltarArquivo(evento: DragEvent<HTMLDivElement>) {
    evento.preventDefault()
    setArrastandoArquivo(false)
    const arquivo = extrairImagemDaTransferencia(evento.dataTransfer)
    if (arquivo) extracao.extrair(arquivo)
  }

  function aoArrastarSobre(evento: DragEvent<HTMLDivElement>) {
    evento.preventDefault()
    if (!arrastandoArquivo) setArrastandoArquivo(true)
  }

  function aoEscolherArquivo(evento: ChangeEvent<HTMLInputElement>) {
    const arquivo = evento.target.files?.[0]
    evento.target.value = ''
    if (arquivo) extracao.extrair(arquivo)
  }

  const processando = extracao.etapa === 'preparando' || extracao.etapa === 'lendo'

  return (
    <Box
      w="full"
      maxW="full"
      mx="auto"
      py={{ base: 4, md: 6 }}
      px={{ base: 4, md: 8 }}
      onDragOver={aoArrastarSobre}
      onDragLeave={() => setArrastandoArquivo(false)}
      onDrop={aoSoltarArquivo}
    >
      <input
        ref={seletorArquivoRef}
        type="file"
        accept={TIPOS_ACEITOS}
        onChange={aoEscolherArquivo}
        style={{ display: 'none' }}
      />

      <VStack w="full" gap={4} alignItems="stretch">
        <CabecalhoExtracao
          temTexto={Boolean(extracao.texto)}
          onAbrirArquivo={abrirSeletor}
          onCopiar={extracao.copiar}
        />

        {extracao.urlImagem ? (
          <Grid
            templateColumns={{ base: '1fr', lg: 'minmax(0, 1fr) minmax(0, 1fr)' }}
            gap={4}
            minH={{ lg: 'calc(100dvh - 200px)' }}
          >
            <ImagemLida
              urlImagem={extracao.urlImagem}
              arrastandoArquivo={arrastandoArquivo}
              processando={processando}
            />
            <ResultadoTexto
              etapa={extracao.etapa}
              progresso={extracao.progresso}
              texto={extracao.texto}
              copiadoAutomaticamente={extracao.copiadoAutomaticamente}
              onAlterarTexto={extracao.setTexto}
            />
          </Grid>
        ) : (
          <Box
            display="flex"
            alignItems="center"
            justifyContent="center"
            minH={{ base: '55dvh', md: 'calc(100dvh - 200px)' }}
            p={{ base: 3, md: 6 }}
            borderRadius="8px"
            borderWidth="1px"
            borderStyle="dashed"
            borderColor={arrastandoArquivo ? 'cirqueira.brand.500' : 'border.subtle'}
            bg={arrastandoArquivo ? 'cirqueira.brand.500/5' : 'bg.subtle'}
            transition="border-color 0.15s ease, background 0.15s ease"
          >
            <ZonaColarImagemTexto onEscolherArquivo={abrirSeletor} />
          </Box>
        )}
      </VStack>
    </Box>
  )
})

export default ExtrairTextoView
