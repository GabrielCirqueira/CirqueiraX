import { useStatusSpotify } from '@/features/spotify/hooks/useStatusSpotify'
import { useResumoIdentificacao, useStatusYoutubeMusic } from '@/features/youtube-music/hooks'
import { Box, Button, Text } from '@chakra-ui/react'
import { Settings2 } from 'lucide-react'
import { memo } from 'react'
import { Link as LinkRouter } from 'react-router-dom'
import { ROTA_GERENCIAR_MUSICA, contarPendenciasMusica, descreverPendenciasMusica } from '../utils'

export const BotaoGerenciarMusica = memo(function BotaoGerenciarMusica() {
  const { data: spotify } = useStatusSpotify()
  const { data: youtube } = useStatusYoutubeMusic()
  const { data: identificacao } = useResumoIdentificacao()
  const pendencias = contarPendenciasMusica({
    statusSpotify: spotify?.status,
    statusYoutubeMusic: youtube?.status,
    itensEmRevisao: identificacao?.emRevisao,
  })

  return (
    <Button
      asChild
      size="sm"
      borderRadius="full"
      variant="outline"
      borderColor={pendencias > 0 ? 'cirqueira.musica.amarelo' : 'cirqueira.musica.cartaoElevado'}
      color="cirqueira.musica.textoPrincipal"
      _hover={{ bg: 'cirqueira.musica.cartaoElevado' }}
      title={descreverPendenciasMusica(pendencias)}
    >
      <LinkRouter to={ROTA_GERENCIAR_MUSICA}>
        <Settings2 size={14} />
        Gerenciar
        {pendencias > 0 && (
          <Box
            as="span"
            minW={5}
            h={5}
            px={1.5}
            borderRadius="full"
            bg="cirqueira.musica.amarelo"
            color="cirqueira.grey.950"
            display="inline-flex"
            alignItems="center"
            justifyContent="center"
          >
            <Text as="span" fontSize="2xs" fontWeight="black">
              {pendencias}
            </Text>
          </Box>
        )}
      </LinkRouter>
    </Button>
  )
})
