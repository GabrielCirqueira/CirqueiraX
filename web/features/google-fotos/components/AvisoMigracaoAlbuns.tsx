import { Badge, Box, Button, Card, Flex, HStack, Icon, Link, Text, VStack } from '@chakra-ui/react'
import {
  ArrowRight,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  FolderPlus,
  HelpCircle,
  Info,
  Layers,
  ShieldAlert,
} from 'lucide-react'
import { memo, useState } from 'react'

export interface AvisoMigracaoAlbunsProps {
  padraoAberto?: boolean
}

export const AvisoMigracaoAlbuns = memo(function AvisoMigracaoAlbuns({
  padraoAberto = false,
}: AvisoMigracaoAlbunsProps) {
  const [expandido, setExpandido] = useState(padraoAberto)

  return (
    <Card.Root
      w="full"
      borderWidth="1px"
      borderColor="cirqueira.brand.500/20"
      bg="bg.panel"
      borderRadius="xl"
      overflow="hidden"
      shadow="sm"
    >
      <Card.Header
        p={5}
        bg="cirqueira.brand.500/5"
        borderBottomWidth={expandido ? '1px' : '0px'}
        borderColor="border.subtle"
        cursor="pointer"
        onClick={() => setExpandido(!expandido)}
        transition="background 0.2s"
        _hover={{ bg: 'cirqueira.brand.500/10' }}
      >
        <Flex
          direction={{ base: 'column', md: 'row' }}
          align={{ base: 'flex-start', md: 'center' }}
          justify="space-between"
          gap={3}
        >
          <HStack gap={3}>
            <Flex
              w={10}
              h={10}
              borderRadius="lg"
              bg="cirqueira.brand.500/15"
              color="cirqueira.brand.400"
              align="center"
              justify="center"
              flexShrink={0}
            >
              <Icon as={HelpCircle} boxSize={5} />
            </Flex>
            <VStack align="flex-start" gap={0.5}>
              <HStack gap={2} flexWrap="wrap">
                <Text fontSize="sm" fontWeight="bold" color="fg">
                  Por que meus álbuns antigos do Google Fotos não aparecem aqui?
                </Text>
                <Badge size="xs" variant="subtle" colorPalette="brand" borderRadius="md">
                  Guia de Migração
                </Badge>
              </HStack>
              <Text fontSize="xs" color="fg.subtle">
                Entenda a política de segurança da API do Google Photos e como organizar seus álbuns
                existentes
              </Text>
            </VStack>
          </HStack>

          <Button
            size="xs"
            variant="ghost"
            color="fg.subtle"
            borderRadius="lg"
            h={8}
            px={2.5}
            onClick={(e) => {
              e.stopPropagation()
              setExpandido(!expandido)
            }}
          >
            <Text as="span" fontSize="xs">
              {expandido ? 'Ocultar Detalhes' : 'Ver Instruções'}
            </Text>
            <Icon as={expandido ? ChevronUp : ChevronDown} ml={1} />
          </Button>
        </Flex>
      </Card.Header>

      {expandido && (
        <Card.Body p={5}>
          <VStack gap={5} align="stretch">
            <Box
              p={4}
              borderRadius="lg"
              bg="cirqueira.amber.500/10"
              borderWidth="1px"
              borderColor="cirqueira.amber.500/20"
              color="fg"
            >
              <HStack align="flex-start" gap={3}>
                <Icon
                  as={ShieldAlert}
                  boxSize={5}
                  color="cirqueira.amber.500"
                  flexShrink={0}
                  mt={0.5}
                />
                <VStack align="flex-start" gap={1}>
                  <Text fontSize="xs" fontWeight="bold" color="cirqueira.amber.500">
                    Restrição de Segurança da API do Google
                  </Text>
                  <Text fontSize="xs" color="fg.subtle" lineHeight="relaxed">
                    Por conformidade com as diretrizes de privacidade do Google, o CirqueiraX
                    utiliza os escopos restritos{' '}
                    <Text as="span" fontFamily="mono" color="fg" fontWeight="medium">
                      photoslibrary.appendonly
                    </Text>{' '}
                    e{' '}
                    <Text as="span" fontFamily="mono" color="fg" fontWeight="medium">
                      photoslibrary.readonly.appcreateddata
                    </Text>
                    . Isso significa que a aplicação só tem permissão para visualizar e gerenciar os
                    álbuns que ela mesma criou. Álbuns antigos ou criados manualmente fora do
                    CirqueiraX permanecem privados e inacessíveis à API.
                  </Text>
                </VStack>
              </HStack>
            </Box>

            <VStack align="flex-start" gap={3}>
              <HStack gap={2}>
                <Icon as={Layers} boxSize={4} color="cirqueira.brand.400" />
                <Text
                  fontSize="xs"
                  fontWeight="bold"
                  textTransform="uppercase"
                  color="fg.subtle"
                  letterSpacing="wider"
                >
                  Passo a Passo para Migração Manual de Fotos
                </Text>
              </HStack>

              <VStack gap={3} w="full" align="stretch">
                <Box
                  p={3.5}
                  borderRadius="xl"
                  bg="bg.subtle"
                  borderWidth="1px"
                  borderColor="border.subtle"
                >
                  <HStack align="flex-start" gap={3}>
                    <Flex
                      w={6}
                      h={6}
                      borderRadius="full"
                      bg="cirqueira.brand.500/20"
                      color="cirqueira.brand.400"
                      fontSize="xs"
                      fontWeight="bold"
                      align="center"
                      justify="center"
                      flexShrink={0}
                    >
                      1
                    </Flex>
                    <VStack align="flex-start" gap={1}>
                      <HStack gap={1.5}>
                        <Icon as={FolderPlus} boxSize={4} color="cirqueira.brand.400" />
                        <Text fontSize="xs" fontWeight="semibold" color="fg">
                          Crie ou Vincule a Categoria no CirqueiraX
                        </Text>
                      </HStack>
                      <Text fontSize="xs" color="fg.subtle">
                        Cadastre a categoria desejada no Dashboard ou na tela de Categorias. O
                        CirqueiraX criará automaticamente o álbum correspondente no Google Fotos com
                        permissões totais de gerenciamento.
                      </Text>
                    </VStack>
                  </HStack>
                </Box>

                <Box
                  p={3.5}
                  borderRadius="xl"
                  bg="bg.subtle"
                  borderWidth="1px"
                  borderColor="border.subtle"
                >
                  <HStack align="flex-start" gap={3}>
                    <Flex
                      w={6}
                      h={6}
                      borderRadius="full"
                      bg="cirqueira.brand.500/20"
                      color="cirqueira.brand.400"
                      fontSize="xs"
                      fontWeight="bold"
                      align="center"
                      justify="center"
                      flexShrink={0}
                    >
                      2
                    </Flex>
                    <VStack align="flex-start" gap={1}>
                      <HStack gap={1.5}>
                        <Icon as={ExternalLink} boxSize={4} color="cirqueira.brand.400" />
                        <Text fontSize="xs" fontWeight="semibold" color="fg">
                          Abra o Google Fotos e Acesse seu Álbum Antigo
                        </Text>
                      </HStack>
                      <Text fontSize="xs" color="fg.subtle">
                        Acesse sua biblioteca no Google Fotos web ou celular, abra o álbum antigo
                        que você deseja migrar e selecione todas as fotos e vídeos.
                      </Text>
                      <Link
                        href="https://photos.google.com"
                        target="_blank"
                        rel="noreferrer"
                        fontSize="xs"
                        color="cirqueira.brand.400"
                        display="inline-flex"
                        alignItems="center"
                        gap={1}
                        mt={1}
                      >
                        Abrir Google Fotos <ExternalLink size={12} />
                      </Link>
                    </VStack>
                  </HStack>
                </Box>

                <Box
                  p={3.5}
                  borderRadius="xl"
                  bg="bg.subtle"
                  borderWidth="1px"
                  borderColor="border.subtle"
                >
                  <HStack align="flex-start" gap={3}>
                    <Flex
                      w={6}
                      h={6}
                      borderRadius="full"
                      bg="cirqueira.brand.500/20"
                      color="cirqueira.brand.400"
                      fontSize="xs"
                      fontWeight="bold"
                      align="center"
                      justify="center"
                      flexShrink={0}
                    >
                      3
                    </Flex>
                    <VStack align="flex-start" gap={1}>
                      <HStack gap={1.5}>
                        <Icon as={CheckCircle2} boxSize={4} color="cirqueira.green.400" />
                        <Text fontSize="xs" fontWeight="semibold" color="fg">
                          Adicione as Fotos ao Álbum Gerenciado pelo CirqueiraX
                        </Text>
                      </HStack>
                      <Text fontSize="xs" color="fg.subtle">
                        Clique no ícone "+" (Adicionar a) no Google Fotos, selecione o novo álbum
                        criado pelo CirqueiraX e confirme. Pronto! As mídias agora farão parte do
                        álbum sincronizado.
                      </Text>
                    </VStack>
                  </HStack>
                </Box>
              </VStack>
            </VStack>

            <HStack
              p={3}
              borderRadius="lg"
              bg="bg.muted"
              justify="space-between"
              align="center"
              fontSize="xs"
              color="fg.subtle"
            >
              <HStack gap={2}>
                <Icon as={Info} boxSize={4} color="cirqueira.teal.500" />
                <Text>
                  Novos downloads e uploads realizados pelo CirqueiraX são enviados e catalogados
                  automaticamente.
                </Text>
              </HStack>
              <HStack gap={1} color="cirqueira.teal.500" fontWeight="medium">
                <Icon as={ArrowRight} boxSize={3.5} />
                <Text as="span">Automação 100% ativa</Text>
              </HStack>
            </HStack>
          </VStack>
        </Card.Body>
      )}
    </Card.Root>
  )
})
