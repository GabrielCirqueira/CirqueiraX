import { Box, Icon, Image } from '@chakra-ui/react'
import { Music } from 'lucide-react'
import { memo, useState } from 'react'

export interface CapaAudioProps {
  thumbnailUrl: string | null
  apagada?: boolean
  exibirIcone?: boolean
  tamanhoIcone?: number
}

export const CapaAudio = memo(function CapaAudio({
  thumbnailUrl,
  apagada = false,
  exibirIcone = true,
  tamanhoIcone = 8,
}: CapaAudioProps) {
  const [falhou, setFalhou] = useState(false)
  const exibirImagem = Boolean(thumbnailUrl) && !falhou

  return (
    <Box
      w="full"
      h="full"
      bg="bg.muted"
      display="flex"
      alignItems="center"
      justifyContent="center"
      filter={apagada ? 'grayscale(1)' : undefined}
      opacity={apagada ? 0.45 : 1}
      transition="opacity 0.2s ease, filter 0.2s ease"
    >
      {exibirImagem ? (
        <Image
          src={thumbnailUrl ?? undefined}
          alt=""
          w="full"
          h="full"
          objectFit="cover"
          loading="lazy"
          decoding="async"
          referrerPolicy="no-referrer"
          onError={() => setFalhou(true)}
        />
      ) : (
        exibirIcone && (
          <Icon as={Music} boxSize={tamanhoIcone} color="fg.subtle" strokeWidth={1.5} />
        )
      )}
    </Box>
  )
})
