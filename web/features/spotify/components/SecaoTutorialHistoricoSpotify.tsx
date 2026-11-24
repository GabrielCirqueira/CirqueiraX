import { Box, Button, HStack, Link, Text, VStack } from '@chakra-ui/react'
import { BookOpen, CheckSquare, ChevronDown, ChevronUp, ExternalLink, Square } from 'lucide-react'
import { memo, useState } from 'react'
import {
  EXPLICACAO_TUTORIAL_HISTORICO_SPOTIFY,
  NOTA_TUTORIAL_HISTORICO_SPOTIFY,
  OPCOES_PEDIDO_SPOTIFY,
  PASSOS_TUTORIAL_HISTORICO_SPOTIFY,
  URL_PRIVACIDADE_SPOTIFY,
} from '../utils/tutorialHistoricoSpotify'

export const SecaoTutorialHistoricoSpotify = memo(function SecaoTutorialHistoricoSpotify() {
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
            <BookOpen size={14} />
            <Text fontSize="sm" fontWeight="semibold">
              Tutorial: dados retroativos do Spotify
            </Text>
          </HStack>
          {aberta ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </Button>
        <Text fontSize="xs" color="cirqueira.musica.textoSecundario" mt={-2}>
          Como pedir o histórico antigo na conta Spotify e trazer para cá.
        </Text>

        {aberta && (
          <VStack align="stretch" gap={3}>
            <Text fontSize="xs" color="cirqueira.musica.textoSecundario" lineHeight="tall">
              {EXPLICACAO_TUTORIAL_HISTORICO_SPOTIFY}
            </Text>

            <VStack as="ol" align="stretch" gap={1.5} pl={4} fontSize="xs">
              {PASSOS_TUTORIAL_HISTORICO_SPOTIFY.map((passo) => (
                <Text
                  as="li"
                  key={passo}
                  color="cirqueira.musica.textoSecundario"
                  listStyleType="decimal"
                  lineHeight="tall"
                >
                  {passo}
                </Text>
              ))}
            </VStack>

            <VStack align="stretch" gap={2}>
              <Text fontSize="xs" fontWeight="semibold" color="cirqueira.musica.textoPrincipal">
                Na tela do Spotify, marque assim:
              </Text>
              {OPCOES_PEDIDO_SPOTIFY.map((opcao) => (
                <HStack
                  key={opcao.titulo}
                  align="start"
                  gap={2.5}
                  px={3}
                  py={2.5}
                  borderRadius="8px"
                  bg="cirqueira.musica.fundo"
                  borderWidth="1px"
                  borderColor={
                    opcao.marcar ? 'cirqueira.musica.verde' : 'cirqueira.musica.cartaoElevado'
                  }
                >
                  <Box
                    color={
                      opcao.marcar ? 'cirqueira.musica.verde' : 'cirqueira.musica.textoDesabilitado'
                    }
                    pt="1px"
                    flexShrink={0}
                  >
                    {opcao.marcar ? <CheckSquare size={16} /> : <Square size={16} />}
                  </Box>
                  <VStack align="start" gap={0.5} minW={0}>
                    <Text
                      fontSize="xs"
                      fontWeight="semibold"
                      color={
                        opcao.marcar
                          ? 'cirqueira.musica.textoPrincipal'
                          : 'cirqueira.musica.textoDesabilitado'
                      }
                    >
                      {opcao.marcar ? 'Marque: ' : 'Não marque: '}
                      {opcao.titulo}
                    </Text>
                    <Text fontSize="xs" color="cirqueira.musica.textoSecundario" lineHeight="tall">
                      {opcao.detalhe}
                    </Text>
                  </VStack>
                </HStack>
              ))}
            </VStack>

            <Box
              p={3}
              borderRadius="8px"
              bg="cirqueira.musica.cartaoElevado"
              borderLeft="3px solid"
              borderColor="cirqueira.musica.amarelo"
            >
              <Text fontSize="xs" color="cirqueira.musica.textoPrincipal" lineHeight="tall">
                {NOTA_TUTORIAL_HISTORICO_SPOTIFY}
              </Text>
            </Box>

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
              <Link href={URL_PRIVACIDADE_SPOTIFY} target="_blank" rel="noopener noreferrer">
                <ExternalLink size={14} />
                Abrir privacidade do Spotify
              </Link>
            </Button>
          </VStack>
        )}
      </VStack>
    </Box>
  )
})
