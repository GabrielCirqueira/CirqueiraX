import { Box, Button, HStack, Link, Text, VStack } from '@chakra-ui/react'
import { ChevronDown, ChevronUp, Download, Palette } from 'lucide-react'
import { memo, useState } from 'react'
import {
  DESTAQUES_EXTENSAO_YTM_SPOTIFY_SKIN,
  EXPLICACAO_EXTENSAO_YTM_SPOTIFY_SKIN,
  PASSOS_INSTALAR_EXTENSAO_YTM_SPOTIFY_SKIN,
  URL_DOWNLOAD_EXTENSAO_YTM_SPOTIFY_SKIN,
  VERSAO_EXTENSAO_YTM_SPOTIFY_SKIN,
} from '../utils'

export const SecaoExtensaoYtmSpotifySkin = memo(function SecaoExtensaoYtmSpotifySkin() {
  const [aberta, setAberta] = useState(false)

  return (
    <Box
      p={{ base: 4, md: 6 }}
      bg="cirqueira.musica.cartao"
      borderRadius="8px"
      border="1px solid"
      borderColor="cirqueira.musica.cartaoElevado"
    >
      <VStack align="stretch" gap={3}>
        <Button
          variant="ghost"
          size="sm"
          justifyContent="space-between"
          px={0}
          color="cirqueira.musica.textoPrincipal"
          _hover={{ bg: 'transparent', color: 'cirqueira.musica.verde' }}
          onClick={() => setAberta(!aberta)}
          aria-expanded={aberta}
        >
          <HStack gap={2}>
            <Palette size={14} />
            <Text fontSize="sm" fontWeight="semibold">
              Visual Spotify no YouTube Music
            </Text>
          </HStack>
          {aberta ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </Button>
        <Text fontSize="xs" color="cirqueira.musica.textoSecundario" mt={-2}>
          Extensão opcional de aparência (versão {VERSAO_EXTENSAO_YTM_SPOTIFY_SKIN}).
        </Text>

        {aberta && (
          <VStack align="stretch" gap={3}>
            <Text fontSize="xs" color="cirqueira.musica.textoSecundario">
              {EXPLICACAO_EXTENSAO_YTM_SPOTIFY_SKIN}
            </Text>

            <VStack as="ul" align="stretch" gap={1.5} pl={4} fontSize="xs">
              {DESTAQUES_EXTENSAO_YTM_SPOTIFY_SKIN.map((item) => (
                <Text
                  as="li"
                  key={item}
                  color="cirqueira.musica.textoSecundario"
                  listStyleType="disc"
                >
                  {item}
                </Text>
              ))}
            </VStack>

            <Button
              asChild
              alignSelf="flex-start"
              size="sm"
              borderRadius="full"
              variant="outline"
              borderColor="cirqueira.musica.verde"
              color="cirqueira.musica.textoPrincipal"
              _hover={{ bg: 'cirqueira.musica.cartaoElevado' }}
            >
              <Link href={URL_DOWNLOAD_EXTENSAO_YTM_SPOTIFY_SKIN} download>
                <Download size={14} />
                Baixar o visual (versão {VERSAO_EXTENSAO_YTM_SPOTIFY_SKIN})
              </Link>
            </Button>

            <VStack as="ol" align="stretch" gap={1.5} pl={4} fontSize="xs">
              {PASSOS_INSTALAR_EXTENSAO_YTM_SPOTIFY_SKIN.map((passo) => (
                <Text
                  as="li"
                  key={passo}
                  color="cirqueira.musica.textoSecundario"
                  listStyleType="decimal"
                >
                  {passo}
                </Text>
              ))}
            </VStack>
          </VStack>
        )}
      </VStack>
    </Box>
  )
})
