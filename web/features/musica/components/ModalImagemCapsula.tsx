import { useMediaQuery } from '@/shared/hooks/useMediaQuery'
import {
  Box,
  Button,
  Center,
  Dialog,
  Grid,
  HStack,
  Image,
  Input,
  Menu,
  Portal,
  SimpleGrid,
  Spinner,
  Switch,
  Text,
  VStack,
} from '@chakra-ui/react'
import { useMutation } from '@tanstack/react-query'
import {
  CalendarDays,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Download,
  ImageIcon,
  RotateCcw,
  Share2,
  X,
} from 'lucide-react'
import { type ReactNode, memo, useDeferredValue, useState } from 'react'
import { useCapsulasMusica, useFonteMusica, usePreviaImagemCapsula } from '../hooks'
import type { FonteMusica } from '../types'
import {
  type CoresPersonalizadasCapsula,
  FONTES_IMAGEM_CAPSULA,
  FORMATOS_IMAGEM_CAPSULA,
  MODELOS_IMAGEM_CAPSULA,
  OPCOES_CANTOS_IMAGEM_CAPSULA,
  OPCOES_FUNDO_IMAGEM_CAPSULA,
  OPCOES_TIPOGRAFIA_IMAGEM_CAPSULA,
  type OpcoesImagemCapsula,
  TAMANHO_MAXIMO_TITULO_CAPSULA,
  TEMAS_IMAGEM_CAPSULA,
  atribuicaoFonteMusica,
  baixarImagem,
  buscarFormatoImagemCapsula,
  compartilharImagem,
  montarTemaPersonalizado,
  nomeArquivoImagemCapsula,
  opcoesPadraoImagemCapsula,
} from '../utils'

const LARGURA_DESKTOP = '(min-width: 768px)'
const CHAVE_PREFERENCIAS = 'cirqueirax:musica:imagem-capsula'
const NOMES_CORES: { chave: keyof CoresPersonalizadasCapsula; rotulo: string }[] = [
  { chave: 'fundo', rotulo: 'Fundo' },
  { chave: 'fundoDois', rotulo: 'Fundo 2' },
  { chave: 'destaque', rotulo: 'Destaque' },
  { chave: 'texto', rotulo: 'Texto' },
]
const OPCOES_QUALIDADE: { id: 1 | 2; nome: string }[] = [
  { id: 1, nome: 'Normal' },
  { id: 2, nome: 'Alta (2×)' },
]

function carregarPreferencias(fonte: FonteMusica): OpcoesImagemCapsula {
  const padrao = opcoesPadraoImagemCapsula(fonte)
  try {
    const salvo = JSON.parse(window.localStorage.getItem(CHAVE_PREFERENCIAS) ?? '{}')
    const mesclado: OpcoesImagemCapsula = {
      ...padrao,
      ...salvo,
      fonte,
      cores: { ...padrao.cores, ...(salvo.cores ?? {}) },
    }
    const modeloValido = MODELOS_IMAGEM_CAPSULA.some((modelo) => modelo.id === mesclado.modelo)
    return {
      ...mesclado,
      modelo: modeloValido ? mesclado.modelo : padrao.modelo,
      qualidade: mesclado.qualidade === 2 ? 2 : 1,
      titulo: typeof mesclado.titulo === 'string' ? mesclado.titulo : padrao.titulo,
    }
  } catch {
    return padrao
  }
}

function salvarPreferencias(opcoes: OpcoesImagemCapsula) {
  try {
    const { fonte: _fonte, ...resto } = opcoes
    window.localStorage.setItem(CHAVE_PREFERENCIAS, JSON.stringify(resto))
  } catch {
    return
  }
}

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

function ModalImagemCapsula({
  ano: anoInicial,
  mes: mesInicial,
  onFechar,
}: ModalImagemCapsulaProps) {
  const { fonte } = useFonteMusica()
  const [periodo, setPeriodo] = useState({ ano: anoInicial, mes: mesInicial })
  const [opcoes, setOpcoes] = useState<OpcoesImagemCapsula>(() => carregarPreferencias(fonte))
  const opcoesAdiadas = useDeferredValue(opcoes)
  const isDesktop = useMediaQuery(LARGURA_DESKTOP)
  const { ano, mes } = periodo
  const { previa, gerando, erro, semDados } = usePreviaImagemCapsula(ano, mes, opcoesAdiadas, true)
  const nomeArquivo = nomeArquivoImagemCapsula(ano, mes, opcoes)
  const formato = buscarFormatoImagemCapsula(opcoes.formato)
  const temaPersonalizado = montarTemaPersonalizado(opcoes.cores)

  function alterar(parcial: Partial<OpcoesImagemCapsula>) {
    setOpcoes((anteriores) => {
      const novas = { ...anteriores, ...parcial }
      salvarPreferencias(novas)
      return novas
    })
  }

  function alterarCor(chave: keyof CoresPersonalizadasCapsula, valor: string) {
    alterar({ tema: 'personalizado', cores: { ...opcoes.cores, [chave]: valor } })
  }

  function restaurarPadrao() {
    const padrao = opcoesPadraoImagemCapsula(opcoes.fonte)
    salvarPreferencias(padrao)
    setOpcoes(padrao)
  }

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
            maxW={{ base: 'full', md: '1040px' }}
            maxH={{ base: '100dvh', md: '92vh' }}
            fontFamily="inter"
          >
            <Dialog.Header px={{ base: 4, md: 6 }} pt={{ base: 4, md: 5 }} pb={3}>
              <HStack justify="space-between" w="full" gap={3} align="flex-start">
                <VStack align="flex-start" gap={2} minW={0}>
                  <Dialog.Title fontSize="md" fontWeight="bold">
                    Sua Cápsula em imagem
                  </Dialog.Title>
                  <SeletorMesImagem
                    ano={ano}
                    mes={mes}
                    onEscolher={(novoAno, novoMes) => setPeriodo({ ano: novoAno, mes: novoMes })}
                  />
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
              <Grid templateColumns={{ base: '1fr', md: 'minmax(0, 1fr) 380px' }} gap={6}>
                <VStack
                  gap={3}
                  align="stretch"
                  position={{ md: 'sticky' }}
                  top={0}
                  alignSelf="start"
                >
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
                        transition="opacity 0.2s ease"
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
                      Nada tocou nessa fonte neste mês. Escolha outra fonte ou outro mês.
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
                    {formato.descricao}
                    {opcoes.qualidade === 2 ? ' · exportada em alta (2×)' : ''}. As capas aparecem
                    inteiras e a imagem leva a atribuição da fonte (
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
                  <GrupoOpcoes titulo="Tamanho">
                    <SimpleGrid columns={{ base: 2, sm: 3 }} gap={1.5}>
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
                    <OpcoesCurtas
                      opcoes={OPCOES_QUALIDADE}
                      ativo={opcoes.qualidade}
                      aoEscolher={(qualidade) => alterar({ qualidade })}
                    />
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
                    <SimpleGrid columns={{ base: 5, sm: 6 }} gap={2}>
                      {[...TEMAS_IMAGEM_CAPSULA, temaPersonalizado].map((tema) => (
                        <VStack
                          key={tema.id}
                          as="button"
                          gap={1}
                          onClick={() => alterar({ tema: tema.id })}
                          cursor="pointer"
                          aria-label={`Tema ${tema.nome}`}
                        >
                          <Center
                            boxSize="40px"
                            borderRadius="full"
                            border="2px solid"
                            borderColor={
                              opcoes.tema === tema.id
                                ? 'cirqueira.musica.verde'
                                : 'cirqueira.musica.cartaoElevado'
                            }
                            transition="border-color 0.2s ease, transform 0.2s ease"
                            _hover={{ transform: 'scale(1.06)' }}
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
                    {opcoes.tema === 'personalizado' && (
                      <SimpleGrid columns={4} gap={2} pt={1}>
                        {NOMES_CORES.map((cor) => (
                          <VStack key={cor.chave} gap={1}>
                            <Box
                              as="label"
                              boxSize="40px"
                              borderRadius="10px"
                              border="1px solid"
                              borderColor="cirqueira.musica.cartaoElevado"
                              bg={opcoes.cores[cor.chave]}
                              cursor="pointer"
                              overflow="hidden"
                              position="relative"
                            >
                              <input
                                type="color"
                                value={opcoes.cores[cor.chave]}
                                onChange={(evento) => alterarCor(cor.chave, evento.target.value)}
                                aria-label={`Cor: ${cor.rotulo}`}
                                style={{
                                  position: 'absolute',
                                  inset: 0,
                                  opacity: 0,
                                  cursor: 'pointer',
                                }}
                              />
                            </Box>
                            <Text fontSize="2xs" color="cirqueira.musica.textoSecundario">
                              {cor.rotulo}
                            </Text>
                          </VStack>
                        ))}
                      </SimpleGrid>
                    )}
                  </GrupoOpcoes>
                  <GrupoOpcoes titulo="Fundo">
                    <SimpleGrid columns={3} gap={1.5}>
                      {OPCOES_FUNDO_IMAGEM_CAPSULA.map((opcao) => (
                        <OpcaoDescrita
                          key={opcao.id}
                          titulo={opcao.nome}
                          descricao={opcao.descricao}
                          ativo={opcoes.fundo === opcao.id}
                          aoEscolher={() => alterar({ fundo: opcao.id })}
                        />
                      ))}
                    </SimpleGrid>
                    <HStack gap={5} wrap="wrap" pt={1}>
                      <Interruptor
                        rotulo="Brilho"
                        ligado={opcoes.brilho}
                        aoAlternar={() => alterar({ brilho: !opcoes.brilho })}
                      />
                      <Interruptor
                        rotulo="Textura granulada"
                        ligado={opcoes.granulado}
                        aoAlternar={() => alterar({ granulado: !opcoes.granulado })}
                      />
                    </HStack>
                  </GrupoOpcoes>
                  <GrupoOpcoes titulo="Letras">
                    <OpcoesCurtas
                      opcoes={OPCOES_TIPOGRAFIA_IMAGEM_CAPSULA}
                      ativo={opcoes.tipografia}
                      aoEscolher={(tipografia) => alterar({ tipografia })}
                    />
                    <Input
                      size="sm"
                      borderRadius="8px"
                      bg="cirqueira.musica.fundo"
                      borderColor="cirqueira.musica.cartaoElevado"
                      color="cirqueira.musica.textoPrincipal"
                      placeholder="Título (ex.: MEU MÊS EM MÚSICA)"
                      maxLength={TAMANHO_MAXIMO_TITULO_CAPSULA}
                      value={opcoes.titulo}
                      onChange={(evento) => alterar({ titulo: evento.target.value })}
                      aria-label="Título da imagem"
                    />
                  </GrupoOpcoes>
                  <GrupoOpcoes titulo="Capas e fotos">
                    <OpcoesCurtas
                      opcoes={OPCOES_CANTOS_IMAGEM_CAPSULA}
                      ativo={opcoes.cantos}
                      aoEscolher={(cantos) => alterar({ cantos })}
                    />
                  </GrupoOpcoes>
                  <GrupoOpcoes titulo="Rodapé">
                    <Interruptor
                      rotulo="Mostrar assinatura CirqueiraX"
                      ligado={opcoes.assinatura}
                      aoAlternar={() => alterar({ assinatura: !opcoes.assinatura })}
                    />
                  </GrupoOpcoes>
                  <Button
                    size="xs"
                    variant="ghost"
                    alignSelf="flex-start"
                    color="cirqueira.musica.textoSecundario"
                    onClick={restaurarPadrao}
                  >
                    <RotateCcw size={12} /> Restaurar padrão
                  </Button>
                </VStack>
              </Grid>
            </Dialog.Body>
          </Dialog.Content>
        </Dialog.Positioner>
      </Portal>
    </Dialog.Root>
  )
}

interface SeletorMesImagemProps {
  ano: number
  mes: number
  onEscolher: (ano: number, mes: number) => void
}

function SeletorMesImagem({ ano, mes, onEscolher }: SeletorMesImagemProps) {
  const capsulas = useCapsulasMusica()
  const meses = capsulas.data ?? []
  const indice = meses.findIndex((item) => item.ano === ano && item.mes === mes)
  const atual = meses[indice]
  const rotulo = atual?.rotulo ?? `${String(mes).padStart(2, '0')}/${ano}`
  const anterior = indice >= 0 ? meses[indice + 1] : undefined
  const proximo = indice > 0 ? meses[indice - 1] : undefined

  return (
    <HStack gap={1}>
      <Button
        size="xs"
        variant="ghost"
        borderRadius="full"
        color="cirqueira.musica.textoSecundario"
        disabled={!anterior}
        aria-label="Mês anterior"
        onClick={() => anterior && onEscolher(anterior.ano, anterior.mes)}
      >
        <ChevronLeft size={14} />
      </Button>
      <Menu.Root
        positioning={{ placement: 'bottom-start' }}
        onSelect={(detalhes) => {
          const escolhido = meses.find((item) => `${item.ano}-${item.mes}` === detalhes.value)
          if (escolhido) onEscolher(escolhido.ano, escolhido.mes)
        }}
      >
        <Menu.Trigger asChild>
          <Button
            size="sm"
            h="34px"
            px={3.5}
            borderRadius="full"
            bg="cirqueira.musica.fundo"
            border="1px solid"
            borderColor="cirqueira.musica.cartaoElevado"
            color="cirqueira.musica.textoPrincipal"
            fontSize="xs"
            fontWeight="bold"
            _hover={{ borderColor: 'cirqueira.musica.verde' }}
            _expanded={{ borderColor: 'cirqueira.musica.verde' }}
            aria-label={`Mês da imagem: ${rotulo}`}
          >
            <CalendarDays size={14} color="var(--chakra-colors-cirqueira-musica-verde)" />
            <Text as="span" truncate>
              {rotulo}
            </Text>
            <ChevronDown size={14} />
          </Button>
        </Menu.Trigger>
        <Portal>
          <Menu.Positioner>
            <Menu.Content
              data-theme="dark"
              minW="240px"
              maxH="320px"
              overflowY="auto"
              p={1.5}
              bg="cirqueira.musica.cartao"
              border="1px solid"
              borderColor="cirqueira.musica.cartaoElevado"
              borderRadius="10px"
              boxShadow="lg"
              fontFamily="inter"
            >
              {meses.map((item) => {
                const escolhido = item.ano === ano && item.mes === mes
                return (
                  <Menu.Item
                    key={`${item.ano}-${item.mes}`}
                    value={`${item.ano}-${item.mes}`}
                    fontSize="sm"
                    color="cirqueira.musica.textoPrincipal"
                    borderRadius="6px"
                    cursor="pointer"
                    _highlighted={{ bg: 'cirqueira.musica.cartaoElevado' }}
                  >
                    <VStack align="flex-start" gap={0} flex={1} minW={0}>
                      <Text>
                        {item.rotulo}
                        {item.isEmAndamento ? ' · em andamento' : ''}
                      </Text>
                      <Text fontSize="2xs" color="cirqueira.musica.textoSecundario" truncate>
                        {item.totalStreams.toLocaleString('pt-BR')} plays
                        {item.musicaMaisOuvida ? ` · ${item.musicaMaisOuvida}` : ''}
                      </Text>
                    </VStack>
                    {escolhido && (
                      <Check size={14} color="var(--chakra-colors-cirqueira-musica-verde)" />
                    )}
                  </Menu.Item>
                )
              })}
            </Menu.Content>
          </Menu.Positioner>
        </Portal>
      </Menu.Root>
      <Button
        size="xs"
        variant="ghost"
        borderRadius="full"
        color="cirqueira.musica.textoSecundario"
        disabled={!proximo}
        aria-label="Próximo mês"
        onClick={() => proximo && onEscolher(proximo.ano, proximo.mes)}
      >
        <ChevronRight size={14} />
      </Button>
    </HStack>
  )
}

function OpcoesCurtas<T extends string | number>({
  opcoes,
  ativo,
  aoEscolher,
}: {
  opcoes: { id: T; nome: string }[]
  ativo: T
  aoEscolher: (id: T) => void
}) {
  return (
    <HStack gap={1.5} wrap="wrap">
      {opcoes.map((opcao) => (
        <Button
          key={String(opcao.id)}
          size="xs"
          borderRadius="full"
          px={3}
          fontSize="2xs"
          fontWeight="semibold"
          bg={opcao.id === ativo ? 'cirqueira.musica.cartaoElevado' : 'transparent'}
          color={
            opcao.id === ativo
              ? 'cirqueira.musica.textoPrincipal'
              : 'cirqueira.musica.textoSecundario'
          }
          border="1px solid"
          borderColor={
            opcao.id === ativo ? 'cirqueira.musica.verde' : 'cirqueira.musica.cartaoElevado'
          }
          _hover={{ color: 'cirqueira.musica.textoPrincipal' }}
          onClick={() => aoEscolher(opcao.id)}
        >
          {opcao.nome}
        </Button>
      ))}
    </HStack>
  )
}

function Interruptor({
  rotulo,
  ligado,
  aoAlternar,
}: {
  rotulo: string
  ligado: boolean
  aoAlternar: () => void
}) {
  return (
    <Switch.Root checked={ligado} onCheckedChange={aoAlternar} colorPalette="green" size="sm">
      <Switch.HiddenInput />
      <Switch.Control />
      <Switch.Label fontSize="xs" color="cirqueira.musica.textoSecundario">
        {rotulo}
      </Switch.Label>
    </Switch.Root>
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
