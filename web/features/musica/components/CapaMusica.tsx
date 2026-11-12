import { Box, type BoxProps, Center } from '@chakra-ui/react'
import { Disc3, Music2, UserRound } from 'lucide-react'
import { memo, useState } from 'react'

export interface CapaMusicaProps extends Omit<BoxProps, 'children'> {
  url: string | null | undefined
  alt: string
  tipo?: 'faixa' | 'artista' | 'album'
  tamanhoIcone?: number
}

const ICONES = { faixa: Music2, artista: UserRound, album: Disc3 }

export const CapaMusica = memo(function CapaMusica({
  url,
  alt,
  tipo = 'faixa',
  tamanhoIcone = 18,
  ...props
}: CapaMusicaProps) {
  const [urlComErro, setUrlComErro] = useState<string | null>(null)
  const Icone = ICONES[tipo]
  const mostrarImagem = Boolean(url) && urlComErro !== url

  return (
    <Box
      flexShrink={0}
      overflow="hidden"
      bg="cirqueira.musica.cartaoElevado"
      borderRadius={tipo === 'artista' ? 'full' : '4px'}
      {...props}
    >
      {mostrarImagem && url ? (
        <Box
          as="img"
          src={url}
          alt={alt}
          w="full"
          h="full"
          objectFit="cover"
          loading="lazy"
          referrerPolicy="no-referrer"
          onError={() => setUrlComErro(url)}
        />
      ) : (
        <Center w="full" h="full" color="cirqueira.musica.textoDesabilitado">
          <Icone size={tamanhoIcone} />
        </Center>
      )}
    </Box>
  )
})
