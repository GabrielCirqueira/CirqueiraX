import { useMediaQuery } from '@/shared/hooks/useMediaQuery'
import {
  Button,
  Center,
  Dialog,
  Grid,
  HStack,
  Image,
  Portal,
  SimpleGrid,
  Spinner,
  Text,
  VStack,
} from '@chakra-ui/react'
import { useMutation } from '@tanstack/react-query'
import { Check, Download, ImageIcon, Share2, X } from 'lucide-react'
import { type ReactNode, memo, useState } from 'react'
import { useFonteMusica, usePreviaImagemCapsula } from '../hooks'
import {
  FONTES_IMAGEM_CAPSULA,
  FORMATOS_IMAGEM_CAPSULA,
  MODELOS_IMAGEM_CAPSULA,
  type OpcoesImagemCapsula,
  TEMAS_IMAGEM_CAPSULA,
  atribuicaoFonteMusica,
  baixarImagem,
  buscarFormatoImagemCapsula,
  compartilharImagem,
  nomeArquivoImagemCapsula,
  opcoesPadraoImagemCapsula,
} from '../utils'

const LARGURA_DESKTOP = '(min-width: 768px)'

export interface BotaoImagemCapsulaProps {
  ano: number | null
  mes: number | null
}

export const BotaoImagemCapsula = memo(function BotaoImagemCapsula({
  ano,
  mes,
}: BotaoImagemCapsulaProps) {
  const [aberto, setAberto] = useState(false)

  return (
    <>
      <Button
        size="sm"
        h="36px"
        px={3}
        borderRadius="full"
        bg="cirqueira.musica.verde"
        color="cirqueira.musica.fundo"
        _hover={{ opacity: 0.9 }}
        onClick={() => setAberto(true)}
        disabled={ano === null || mes === null}
      >
        <ImageIcon size={14} />
        <Text as="span" fontSize="xs" fontWeight="bold">
          Gerar imagem
        </Text>
      </Button>
      {aberto && ano !== null && mes !== null && (
        <ModalImagemCapsula ano={ano} mes={mes} onFechar={() => setAberto(false)} />
      )}
    </>
  )
})

interface ModalImagemCapsulaProps {
  ano: number
  mes: number
  onFechar: () => void
}

function ModalImagemCapsula({ ano, mes, onFechar }: ModalImagemCapsulaProps) {
  const { fonte } = useFonteMusica()
  const [opcoes, setOpcoes] = useState<OpcoesImagemCapsula>(() => opcoesPadraoImagemCapsula(fonte))
  const isDesktop = useMediaQuery(LARGURA_DESKTOP)
  const { previa, gerando, erro, semDados } = usePreviaImagemCapsula(ano, mes, opcoes, true)
  const nomeArquivo = nomeArquivoImagemCapsula(ano, mes, opcoes)
  const formato = buscarFormatoImagemCapsula(opcoes.formato)
  const alterar = (parcial: Partial<OpcoesImagemCapsula>) =>
    setOpcoes((anteriores) => ({ ...anteriores, ...parcial }))

  const compartilhar = useMutation({
    mutationFn: async () => (previa ? compartilharImagem(previa.blob, nomeArquivo) : false),
    onSuccess: (compartilhou) => {
      if (!compartilhou && previa) baixarImagem(previa.url, nomeArquivo)
    },
  })

  return (
    <Dialog.Root
      open
      onOpenChange={(detalhes) => !detalhes.open && onFechar()}
      placement="center"
      scrollBehavior="inside"
      size={isDesktop ? 'xl' : 'full'}
    >
      <Portal>
        <Dialog.Backdrop bg="blackAlpha.800" backdropFilter="blur(4px)" />
        <Dialog.Positioner p={{ base: 0, md: 4 }}>
          <Dialog.Content
            data-theme="dark"
            bg="cirqueira.musica.cartao"
            color="cirqueira.musica.textoPrincipal"
            border="1px solid"
            borderColor="cirqueira.musica.cartaoElevado"
            borderRadius={{ base: 0, md: '12px' }}
            maxW={{ base: 'full', md: '980px' }}
            maxH={{ base: '100dvh', md: '92vh' }}
            fontFamily="inter"
          >
            <Dialog.Header px={{ base: 4, md: 6 }} pt={{ base: 4, md: 5 }} pb={3}>
              <HStack justify="space-between" w="full">
                <VStack align="flex-start" gap={0}>
                  <Dialog.Title fontSize="md" fontWeight="bold">
                    Sua Cápsula em imagem
                  </Dialog.Title>
                  <Text fontSize="xs" color="cirqueira.musica.textoSecundario">
                    Escolha os dados, o modelo, o tema e o formato.
                  </Text>
                </VStack>
                <Button
                  size="xs"
                  variant="ghost"
                  borderRadius="full"
                  color="cirqueira.musica.textoSecundario"
                  aria-label="Fechar"
                  onClick={onFechar}
                >
                  <X size={16} />
                </Button>
              </HStack>
            </Dialog.Header>
            <Dialog.Body px={{ base: 4, md: 6 }} pb={{ base: 4, md: 6 }} overflowY="auto">
              <Grid templateColumns={{ base: '1fr', md: 'minmax(0, 1fr) 360px' }} gap={6}>
                <VStack gap={3} align="stretch">
                  <Center
                    position="relative"
                    bg="cirqueira.musica.fundo"
                    borderRadius="8px"
                    p={3}
                    minH={{ base: '320px', md: '480px' }}
                  >
                    {previa ? (
                      <Image
                        src={previa.url}
                        alt="Prévia da Cápsula Sonora"
                        maxW="full"
                        maxH={{ base: '55dvh', md: '68vh' }}
                        aspectRatio={`${formato.largura} / ${formato.altura}`}
                        borderRadius="6px"
                        opacity={gerando ? 0.5 : 1}
                        transition="opacity 0.15s ease"
                      />
                    ) : (
                      <MensagemPrevia erro={erro} />
                    )}
                    {gerando && (
                      <Center position="absolute" inset={0}>
                        <Spinner color="cirqueira.musica.verde" />
                      </Center>
                    )}
                  </Center>
                  {semDados && (
                    <Text fontSize="xs" color="cirqueira.musica.amarelo">
                      Nada tocou nessa fonte neste mês. Escolha outra fonte de dados.
                    </Text>
                  )}
                  <HStack gap={2}>
                    <Button
                      flex={1}
                      size="sm"
                      borderRadius="full"
                      variant="outline"
                      borderColor="cirqueira.musica.cartaoElevado"
                      color="cirqueira.musica.textoPrincipal"
                      disabled={!previa || gerando}
                      onClick={() => previa && baixarImagem(previa.url, nomeArquivo)}
                    >
                      <Download size={14} /> Baixar PNG
                    </Button>
                    <Button
                      flex={1}
                      size="sm"
                      borderRadius="full"
                      bg="cirqueira.musica.verde"
                      color="cirqueira.musica.fundo"
                      disabled={!previa || gerando}
                      onClick={() => compartilhar.mutate()}
                      loading={compartilhar.isPending}
                    >
                      <Share2 size={14} /> Compartilhar
                    </Button>
                  </HStack>
                  <Text fontSize="2xs" color="cirqueira.musica.textoSecundario">
                    As capas aparecem inteiras e a imagem leva a atribuição da fonte (
                    {atribuicaoFonteMusica(opcoes.fonte)}), como pedem as regras das marcas.
                  </Text>
                </VStack>

                <VStack gap={5} align="stretch">
                  <GrupoOpcoes titulo="Dados">
                    <VStack gap={1.5} align="stretch">
                      {FONTES_IMAGEM_CAPSULA.map((opcao) => (
                        <OpcaoDescrita
                          key={opcao.id}
                          titulo={opcao.nome}
                          descricao={opcao.descricao}
                          ativo={opcoes.fonte === opcao.id}
                          aoEscolher={() => alterar({ fonte: opcao.id })}
                        />
                      ))}
                    </VStack>
                  </GrupoOpcoes>
                  <GrupoOpcoes titulo="Formato">
                    <SimpleGrid columns={3} gap={1.5}>
                      {FORMATOS_IMAGEM_CAPSULA.map((opcao) => (
                        <OpcaoDescrita
                          key={opcao.id}
                          titulo={opcao.nome}
                          descricao={opcao.descricao}
                          ativo={opcoes.formato === opcao.id}
                          aoEscolher={() => alterar({ formato: opcao.id })}
                        />
                      ))}
                    </SimpleGrid>
                  </GrupoOpcoes>
                  <GrupoOpcoes titulo="Modelo">
                    <SimpleGrid columns={2} gap={1.5}>
                      {MODELOS_IMAGEM_CAPSULA.map((modelo) => (
                        <OpcaoDescrita
                          key={modelo.id}
                          titulo={modelo.nome}
                          descricao={modelo.descricao}
                          ativo={opcoes.modelo === modelo.id}
                          aoEscolher={() => alterar({ modelo: modelo.id })}
                        />
                      ))}
                    </SimpleGrid>
                  </GrupoOpcoes>
                  <GrupoOpcoes titulo="Tema">
                    <SimpleGrid columns={5} gap={2}>
                      {TEMAS_IMAGEM_CAPSULA.map((tema) => (
                        <VStack
                          key={tema.id}
                          as="button"
                          gap={1}
                          onClick={() => alterar({ tema: tema.id })}
                          cursor="pointer"
                          aria-label={`Tema ${tema.nome}`}
                        >
                          <Center
                            boxSize="44px"
                            borderRadius="full"
                            border="2px solid"
                            borderColor={
                              opcoes.tema === tema.id
                                ? 'cirqueira.musica.verde'
                                : 'cirqueira.musica.cartaoElevado'
                            }
                            bgImage={`linear-gradient(135deg, ${tema.fundo[0]} 0%, ${tema.fundo[tema.fundo.length - 1]} 55%, ${tema.destaque} 55%, ${tema.destaqueDois} 100%)`}
                          >
                            {opcoes.tema === tema.id && <Check size={16} color={tema.texto} />}
                          </Center>
                          <Text
                            fontSize="2xs"
                            color={
                              opcoes.tema === tema.id
                                ? 'cirqueira.musica.textoPrincipal'
                                : 'cirqueira.musica.textoSecundario'
                            }
                            lineClamp={1}
                          >
                            {tema.nome}
                          </Text>
                        </VStack>
                      ))}
                    </SimpleGrid>
                  </GrupoOpcoes>
                </VStack>
              </Grid>
            </Dialog.Body>
          </Dialog.Content>
        </Dialog.Positioner>
      </Portal>
    </Dialog.Root>
  )
}

function MensagemPrevia({ erro }: { erro: boolean }) {
  return (
    <Text fontSize="sm" color="cirqueira.musica.textoSecundario" textAlign="center">
      {erro ? 'Não foi possível gerar a imagem desta cápsula.' : 'Montando a imagem…'}
    </Text>
  )
}

function GrupoOpcoes({ titulo, children }: { titulo: string; children: ReactNode }) {
  return (
    <VStack gap={2} align="stretch">
      <Text
        fontSize="2xs"
        fontWeight="bold"
        textTransform="uppercase"
        letterSpacing="wide"
        color="cirqueira.musica.textoSecundario"
      >
        {titulo}
      </Text>
      {children}
    </VStack>
  )
}

interface OpcaoDescritaProps {
  titulo: string
  descricao: string
  ativo: boolean
  aoEscolher: () => void
}

function OpcaoDescrita({ titulo, descricao, ativo, aoEscolher }: OpcaoDescritaProps) {
  return (
    <VStack
      as="button"
      align="flex-start"
      gap={0}
      px={3}
      py={2}
      borderRadius="8px"
      border="1px solid"
      borderColor={ativo ? 'cirqueira.musica.verde' : 'cirqueira.musica.cartaoElevado'}
      bg={ativo ? 'cirqueira.musica.cartaoElevado' : 'transparent'}
      _hover={{ bg: 'cirqueira.musica.cartaoElevado' }}
      cursor="pointer"
      textAlign="left"
      onClick={aoEscolher}
      minW={0}
    >
      <Text fontSize="xs" fontWeight="bold" color="cirqueira.musica.textoPrincipal">
        {titulo}
      </Text>
      <Text fontSize="2xs" color="cirqueira.musica.textoSecundario" lineClamp={2}>
        {descricao}
      </Text>
    </VStack>
  )
}
