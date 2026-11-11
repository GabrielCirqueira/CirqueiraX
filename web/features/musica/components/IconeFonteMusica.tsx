import { Box, HStack } from '@chakra-ui/react'
import { memo } from 'react'
import type { FonteReproducao } from '../types'
import { CORES_FONTE_REPRODUCAO, ROTULOS_FONTE_REPRODUCAO } from '../utils'
import { TooltipMusica } from './MinutosMusica'

const CAMINHOS_ICONE_FONTE: Record<FonteReproducao, string> = {
  spotify:
    'M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.503 17.306c-.216.353-.676.467-1.029.25-2.822-1.724-6.375-2.114-10.56-1.157-.403.092-.806-.157-.899-.56-.092-.403.158-.806.56-.899 4.582-1.047 8.52-.604 11.678 1.337.354.217.468.676.25 1.029zm1.468-3.262c-.272.443-.852.584-1.295.312-3.23-1.986-8.156-2.56-11.977-1.4-.499.151-.937-.24-1.088-.739-.15-.499.24-.937.739-1.088 4.372-1.327 9.8-.69 13.309 1.62.443.272.584.852.312 1.295zm.126-3.41c-3.873-2.3-10.264-2.512-13.978-1.384-.593.18-1.222-.158-1.402-.751-.18-.593.158-1.222.751-1.402 4.267-1.295 11.323-1.047 15.792 1.606.533.316.708 1.008.392 1.541-.316.533-1.008.708-1.541.392z',
  youtube_music:
    'M12 0C5.376 0 0 5.376 0 12s5.376 12 12 12 12-5.376 12-12S18.624 0 12 0zm0 19.104c-3.924 0-7.104-3.18-7.104-7.104S8.076 4.896 12 4.896s7.104 3.18 7.104 7.104-3.18 7.104-7.104 7.104zm0-13.332c-3.432 0-6.228 2.796-6.228 6.228S8.568 18.228 12 18.228s6.228-2.796 6.228-6.228S15.432 5.772 12 5.772zM9.684 15.54V8.46L15.816 12l-6.132 3.54z',
}

export interface IconeFonteMusicaProps {
  fonte: FonteReproducao
  tamanho?: number
}

export const IconeFonteMusica = memo(function IconeFonteMusica({
  fonte,
  tamanho = 14,
}: IconeFonteMusicaProps) {
  const rotulo = ROTULOS_FONTE_REPRODUCAO[fonte]

  return (
    <TooltipMusica conteudo={rotulo}>
      <Box
        as="span"
        display="inline-flex"
        alignItems="center"
        justifyContent="center"
        color={CORES_FONTE_REPRODUCAO[fonte]}
        flexShrink={0}
        cursor="default"
      >
        <svg
          role="img"
          aria-label={rotulo}
          viewBox="0 0 24 24"
          width={tamanho}
          height={tamanho}
          fill="currentColor"
          xmlns="http://www.w3.org/2000/svg"
        >
          <title>{rotulo}</title>
          <path d={CAMINHOS_ICONE_FONTE[fonte]} />
        </svg>
      </Box>
    </TooltipMusica>
  )
})

export interface GrupoIconesFonteProps {
  fontes: FonteReproducao[] | undefined
  tamanho?: number
}

export const GrupoIconesFonte = memo(function GrupoIconesFonte({
  fontes,
  tamanho = 14,
}: GrupoIconesFonteProps) {
  if (!fontes || fontes.length === 0) return null

  return (
    <HStack as="span" gap={1} display="inline-flex" flexShrink={0}>
      {fontes.map((fonte) => (
        <IconeFonteMusica key={fonte} fonte={fonte} tamanho={tamanho} />
      ))}
    </HStack>
  )
})
