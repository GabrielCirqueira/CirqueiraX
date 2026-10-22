import { Box, Icon, Image } from '@chakra-ui/react'
import { Music } from 'lucide-react'
import { memo, useState } from 'react'

export interface CapaAudioProps {
  thumbnailUrl: string | null
  esmaecida: boolean
}

export const CapaAudio = memo(function CapaAudio({ thumbnailUrl, esmaecida }: CapaAudioProps) {
  const [falhou, setFalhou] = useState(false)
  const exibirImagem = Boolean(thumbnailUrl) && !falhou

  return (
    <Box
      boxSize={12}
      borderRadius="lg"
      overflow="hidden"
      bg="bg.muted"
      flexShrink={0}
      display="flex"
      alignItems="center"
      justifyContent="center"
      opacity={esmaecida ? 0.5 : 1}
    >
      {exibirImagem ? (
        <Image
          src={thumbnailUrl ?? undefined}
          alt=""
          boxSize="full"
          objectFit="cover"
          loading="lazy"
          referrerPolicy="no-referrer"
          onError={() => setFalhou(true)}
        />
      ) : (
        <Icon as={Music} boxSize={5} color="fg.subtle" />
      )}
    </Box>
  )
})
