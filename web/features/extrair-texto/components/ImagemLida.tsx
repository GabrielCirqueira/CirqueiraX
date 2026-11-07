import { Box, Image } from '@chakra-ui/react'
import { memo } from 'react'

export interface ImagemLidaProps {
  urlImagem: string
  arrastandoArquivo: boolean
  processando: boolean
}

export const ImagemLida = memo(function ImagemLida({
  urlImagem,
  arrastandoArquivo,
  processando,
}: ImagemLidaProps) {
  return (
    <Box
      display="flex"
      alignItems="center"
      justifyContent="center"
      p={{ base: 3, md: 4 }}
      minH={{ base: '200px', lg: 'auto' }}
      maxH={{ base: '45dvh', lg: 'calc(100dvh - 200px)' }}
      overflow="auto"
      borderRadius="8px"
      borderWidth="1px"
      borderColor={arrastandoArquivo ? 'cirqueira.brand.500' : 'border.subtle'}
      bg={arrastandoArquivo ? 'cirqueira.brand.500/5' : 'bg.subtle'}
      transition="border-color 0.15s ease, background 0.15s ease"
    >
      <Image
        src={urlImagem}
        alt="Imagem colada"
        maxW="full"
        maxH="full"
        objectFit="contain"
        opacity={processando ? 0.6 : 1}
        transition="opacity 0.2s ease"
      />
    </Box>
  )
})
