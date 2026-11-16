import { Box, Button, HStack, Heading, Spinner, Text, VStack } from '@chakra-ui/react'
import { ArrowLeftRight, RefreshCw } from 'lucide-react'
import { memo, useState } from 'react'
import { useListarVinculos, useSincronizarVinculo } from '../hooks'
import { formatarDataCurta } from '../utils'
import { AssistenteTransferenciaPlaylists } from './AssistenteTransferenciaPlaylists'

export const SecaoTransferenciaPlaylists = memo(function SecaoTransferenciaPlaylists() {
  const [assistenteAberto, setAssistenteAberto] = useState(false)
  const { data: vinculos, isLoading } = useListarVinculos()
  const sincronizar = useSincronizarVinculo()

  return (
    <>
      <VStack
        align="stretch"
        gap={4}
        p={{ base: 4, md: 6 }}
        bg="cirqueira.musica.cartao"
        borderRadius="8px"
        border="1px solid"
        borderColor="cirqueira.musica.cartaoElevado"
      >
        <HStack justify="space-between" align="start" gap={3} wrap="wrap">
          <VStack align="start" gap={1} minW={0} flex={1}>
            <HStack gap={2}>
              <ArrowLeftRight size={18} color="var(--chakra-colors-cirqueira-musica-verde)" />
              <Heading
                as="h2"
                fontSize="md"
                fontWeight="bold"
                color="cirqueira.musica.textoPrincipal"
              >
                Transferência de playlists
              </Heading>
            </HStack>
            <Text fontSize="sm" color="cirqueira.musica.textoSecundario">
              Copie playlists entre Spotify e YouTube Music, revise o casamento das faixas e
              sincronize vínculos já criados.
            </Text>
          </VStack>
          <Button
            borderRadius="full"
            fontWeight="bold"
            bg="cirqueira.musica.verde"
            color="cirqueira.grey.950"
            _hover={{ bg: 'cirqueira.musica.verdeHover' }}
            onClick={() => setAssistenteAberto(true)}
          >
            Abrir transferência
          </Button>
        </HStack>

        {isLoading ? (
          <HStack gap={2}>
            <Spinner size="sm" color="cirqueira.musica.verde" />
            <Text fontSize="xs" color="cirqueira.musica.textoSecundario">
              Carregando vínculos...
            </Text>
          </HStack>
        ) : !vinculos || vinculos.length === 0 ? (
          <Text fontSize="xs" color="cirqueira.musica.textoDesabilitado">
            Nenhum vínculo de playlist ainda. Use o assistente para criar a primeira transferência.
          </Text>
        ) : (
          <VStack align="stretch" gap={2}>
            {vinculos.map((vinculo) => (
              <Box key={vinculo.uuid} p={3} borderRadius="8px" bg="cirqueira.musica.cartaoElevado">
                <HStack justify="space-between" align="start" gap={3}>
                  <VStack align="start" gap={0.5} minW={0} flex={1}>
                    <Text fontSize="sm" fontWeight="semibold" truncate maxW="full">
                      {vinculo.nomeSpotify} ↔ {vinculo.nomeYoutube}
                    </Text>
                    <Text fontSize="2xs" color="cirqueira.musica.textoSecundario">
                      {vinculo.modoDescricao}
                      {vinculo.ultimaSincronizacaoEm
                        ? ` · última sync ${formatarDataCurta(vinculo.ultimaSincronizacaoEm)}`
                        : ' · ainda não sincronizado'}
                    </Text>
                  </VStack>
                  <Button
                    size="xs"
                    borderRadius="full"
                    variant="outline"
                    borderColor="cirqueira.musica.verde"
                    color="cirqueira.musica.verde"
                    flexShrink={0}
                    loading={sincronizar.isPending && sincronizar.variables?.uuid === vinculo.uuid}
                    onClick={() => sincronizar.mutate({ uuid: vinculo.uuid })}
                  >
                    <HStack gap={1}>
                      <RefreshCw size={12} />
                      <Text as="span">Sincronizar</Text>
                    </HStack>
                  </Button>
                </HStack>
              </Box>
            ))}
          </VStack>
        )}
      </VStack>

      <AssistenteTransferenciaPlaylists
        aberto={assistenteAberto}
        onFechar={() => setAssistenteAberto(false)}
      />
    </>
  )
})
