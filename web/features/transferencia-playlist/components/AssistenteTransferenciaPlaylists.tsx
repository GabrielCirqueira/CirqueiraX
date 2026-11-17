import { IconeFonteMusica } from '@/features/musica/components/IconeFonteMusica'
import { CHAVE_RETORNO_APOS_CONEXAO } from '@/features/spotify/components/SpotifyCallback'
import { useObterUrlAutorizacaoSpotify, useStatusSpotify } from '@/features/spotify/hooks'
import { useMediaQuery } from '@/shared/hooks/useMediaQuery'
import {
  Box,
  Button,
  Checkbox,
  CloseButton,
  Dialog,
  Drawer,
  HStack,
  Heading,
  Image,
  Input,
  Portal,
  Progress,
  RadioGroup,
  Spinner,
  Text,
  VStack,
} from '@chakra-ui/react'
import { ArrowRight, CheckCircle2, Music2 } from 'lucide-react'
import { type ReactNode, memo, useEffect, useState } from 'react'
import {
  useConfirmarPrevia,
  useDetalheTransferencia,
  useDetectarPares,
  useExecutarTransferencia,
  useIniciarTransferencia,
  useListarPlaylistsServico,
  useObterUrlYoutubeOAuth,
  useStatusYoutubeOAuth,
} from '../hooks'
import type { DecisaoPlaylistDestino, ParPlaylist, ServicoPlaylist } from '../types'
import {
  OPCOES_DECISAO,
  ROTA_RETORNO_GERENCIAR,
  agruparItensPrevia,
  descreverDecisao,
  montarPayloadConfirmacaoPrevia,
  destinoOposto,
  encontrarParOrientado,
  filtrarPlaylistsPorBusca,
  formatarDecisao,
  formatarNumero,
  idsComParNoDestino,
  labelServico,
  montarPlaylistsInicio,
  rotuloDirecao,
  salvarRetornoYoutubeOAuth,
  totalFaixasSelecionadas,
} from '../utils'

export interface AssistenteTransferenciaPlaylistsProps {
  aberto: boolean
  onFechar: () => void
  uuidRetomar?: string | null
}

type PassoAssistente = 1 | 2 | 3 | 4 | 5 | 6

export const AssistenteTransferenciaPlaylists = memo(function AssistenteTransferenciaPlaylists({
  aberto,
  onFechar,
  uuidRetomar = null,
}: AssistenteTransferenciaPlaylistsProps) {
  const isDesktop = useMediaQuery('(min-width: 768px)')
  const [passo, setPasso] = useState<PassoAssistente>(1)
  const [origem, setOrigem] = useState<ServicoPlaylist | null>(null)
  const [busca, setBusca] = useState('')
  const [buscaVinculos, setBuscaVinculos] = useState('')
  const [filtroSoComPar, setFiltroSoComPar] = useState(false)
  const [idsSelecionados, setIdsSelecionados] = useState<Set<string>>(new Set())
  const [decisoes, setDecisoes] = useState<Record<string, DecisaoPlaylistDestino>>({})
  const [uuidTransferencia, setUuidTransferencia] = useState<string | null>(null)
  const [ignorados, setIgnorados] = useState<Set<string>>(new Set())

  const { data: statusSpotify, isLoading: carregandoSpotify } = useStatusSpotify()
  const { data: statusYoutube, isLoading: carregandoYoutube } = useStatusYoutubeOAuth()
  const obterUrlSpotify = useObterUrlAutorizacaoSpotify()
  const obterUrlYoutube = useObterUrlYoutubeOAuth()

  const destino = origem ? destinoOposto(origem) : null
  const spotifyConectado = Boolean(statusSpotify?.conectada && statusSpotify.status === 'conectada')
  const spotifyPlaylistsOk = Boolean(statusSpotify?.podeLerPlaylists)
  const spotifyOk = spotifyConectado && spotifyPlaylistsOk
  const youtubeOk = Boolean(statusYoutube?.conectada)
  const conexoesOk = spotifyOk && youtubeOk

  const listarPlaylists = useListarPlaylistsServico(origem, aberto && passo >= 3 && Boolean(origem))
  const detectarPares = useDetectarPares(aberto && passo >= 3 && conexoesOk)
  const iniciar = useIniciarTransferencia()
  const { data: detalhe } = useDetalheTransferencia(uuidTransferencia)
  const confirmarPrevia = useConfirmarPrevia()
  const executar = useExecutarTransferencia()

  useEffect(() => {
    if (!aberto || !uuidRetomar) return
    setUuidTransferencia(uuidRetomar)
    setPasso(5)
  }, [aberto, uuidRetomar])

  useEffect(() => {
    if (!detalhe || !uuidTransferencia) return
    if (detalhe.uuid !== uuidTransferencia) return
    setOrigem(detalhe.origem)
    if (detalhe.status === 'executando' || detalhe.status === 'concluida' || detalhe.status === 'pausada_cota') {
      setPasso(6)
    } else if (
      detalhe.status === 'casando' ||
      detalhe.status === 'previa' ||
      detalhe.status === 'falha'
    ) {
      setPasso(5)
    }
  }, [detalhe, uuidTransferencia])

  function reiniciarEstado() {
    setPasso(1)
    setOrigem(null)
    setBusca('')
    setBuscaVinculos('')
    setFiltroSoComPar(false)
    setIdsSelecionados(new Set())
    setDecisoes({})
    setUuidTransferencia(null)
    setIgnorados(new Set())
  }

  function aplicarDecisaoEmMassa(
    decisao: DecisaoPlaylistDestino,
    idsAlvo: string[],
    pares: ParPlaylist[]
  ) {
    if (!origem) return
    setDecisoes((atual) => {
      const proximo = { ...atual }
      for (const id of idsAlvo) {
        const par = encontrarParOrientado(id, origem, pares)
        if (!par?.destino && decisao !== 'criar_nova') continue
        proximo[id] = decisao
      }
      return proximo
    })
  }

  function handleFechar() {
    reiniciarEstado()
    onFechar()
  }

  function escolherDirecao(servicoOrigem: ServicoPlaylist) {
    setOrigem(servicoOrigem)
    setPasso(2)
  }

  function handleConectarSpotify() {
    try {
      sessionStorage.setItem(CHAVE_RETORNO_APOS_CONEXAO, ROTA_RETORNO_GERENCIAR)
    } catch {}
    obterUrlSpotify.mutate(undefined, {
      onSuccess: ({ url }) => {
        window.location.href = url
      },
    })
  }

  function handleConectarYoutube() {
    salvarRetornoYoutubeOAuth(ROTA_RETORNO_GERENCIAR)
    obterUrlYoutube.mutate(undefined, {
      onSuccess: ({ url }) => {
        window.location.href = url
      },
    })
  }

  function alternarPlaylist(id: string) {
    setIdsSelecionados((atual) => {
      const proximo = new Set(atual)
      if (proximo.has(id)) proximo.delete(id)
      else proximo.add(id)
      return proximo
    })
  }

  function selecionarTodas(ids: string[]) {
    setIdsSelecionados(new Set(ids))
  }

  function limparSelecao() {
    setIdsSelecionados(new Set())
  }

  function irParaDecisoes() {
    const iniciais: Record<string, DecisaoPlaylistDestino> = {}
    for (const id of idsSelecionados) {
      iniciais[id] = 'criar_nova'
    }
    setDecisoes(iniciais)
    setPasso(4)
  }

  function handleIniciar() {
    if (!origem || !destino) return
    const payload = {
      origem,
      destino,
      playlists: montarPlaylistsInicio(
        Array.from(idsSelecionados),
        decisoes,
        detectarPares.data ?? [],
        origem
      ),
    }
    iniciar.mutate(payload, {
      onSuccess: (resumo) => {
        setUuidTransferencia(resumo.uuid)
        setPasso(5)
      },
    })
  }

  function alternarIgnorado(uuid: string) {
    setIgnorados((atual) => {
      const proximo = new Set(atual)
      if (proximo.has(uuid)) proximo.delete(uuid)
      else proximo.add(uuid)
      return proximo
    })
  }

  function handleConfirmarETransferir() {
    if (!uuidTransferencia || !detalhe) return
    const temOQueTransferir =
      (detalhe.totalCasadas ?? 0) + (detalhe.totalDuvidosas ?? 0) > 0 ||
      detalhe.itens.some((item) => item.status === 'casada' || item.status === 'duvidosa')
    if (!temOQueTransferir) return
    const payload = montarPayloadConfirmacaoPrevia(detalhe, ignorados)
    confirmarPrevia.mutate(
      { uuid: uuidTransferencia, payload },
      {
        onSuccess: () => {
          executar.mutate(uuidTransferencia, {
            onSuccess: () => setPasso(6),
          })
        },
      }
    )
  }

  const playlists = listarPlaylists.data?.itens ?? []
  const playlistsFiltradas = filtrarPlaylistsPorBusca(playlists, busca)
  const totalSelecionado = idsSelecionados.size
  const totalFaixas = totalFaixasSelecionadas(playlists, idsSelecionados)
  const grupos = detalhe ? agruparItensPrevia(detalhe.itens) : null

  const titulo = 'Transferência de playlists'

  let conteudo: ReactNode = null

  if (passo === 1) {
    conteudo = (
      <VStack align="stretch" gap={4}>
        <Text fontSize="sm" color="cirqueira.musica.textoSecundario">
          Escolha a direção da transferência.
        </Text>
        <VStack align="stretch" gap={3}>
          <Button
            h="auto"
            py={5}
            px={4}
            borderRadius="8px"
            bg="cirqueira.musica.cartaoElevado"
            border="1px solid"
            borderColor="cirqueira.musica.cartaoElevado"
            _hover={{ borderColor: 'cirqueira.musica.verde' }}
            onClick={() => escolherDirecao('spotify')}
          >
            <HStack w="full" justify="space-between" gap={3}>
              <HStack gap={3}>
                <IconeFonteMusica fonte="spotify" tamanho={28} />
                <VStack align="start" gap={0}>
                  <Text fontWeight="bold" color="cirqueira.musica.textoPrincipal">
                    Spotify → YouTube Music
                  </Text>
                  <Text fontSize="xs" color="cirqueira.musica.textoSecundario">
                    Origem Spotify, destino YouTube Music
                  </Text>
                </VStack>
              </HStack>
              <ArrowRight
                size={18}
                color="var(--chakra-colors-cirqueira-musica-texto-secundario)"
              />
            </HStack>
          </Button>
          <Button
            h="auto"
            py={5}
            px={4}
            borderRadius="8px"
            bg="cirqueira.musica.cartaoElevado"
            border="1px solid"
            borderColor="cirqueira.musica.cartaoElevado"
            _hover={{ borderColor: 'cirqueira.musica.verde' }}
            onClick={() => escolherDirecao('youtube')}
          >
            <HStack w="full" justify="space-between" gap={3}>
              <HStack gap={3}>
                <IconeFonteMusica fonte="youtube_music" tamanho={28} />
                <VStack align="start" gap={0}>
                  <Text fontWeight="bold" color="cirqueira.musica.textoPrincipal">
                    YouTube Music → Spotify
                  </Text>
                  <Text fontSize="xs" color="cirqueira.musica.textoSecundario">
                    Origem YouTube Music, destino Spotify
                  </Text>
                </VStack>
              </HStack>
              <ArrowRight
                size={18}
                color="var(--chakra-colors-cirqueira-musica-texto-secundario)"
              />
            </HStack>
          </Button>
        </VStack>
      </VStack>
    )
  } else if (passo === 2) {
    conteudo = (
      <VStack align="stretch" gap={4}>
        <Text fontSize="sm" color="cirqueira.musica.textoSecundario">
          Confirme as conexões necessárias para {rotuloDirecao(origem, destino)}.
        </Text>

        <VStack align="stretch" gap={3}>
          <Box p={4} borderRadius="8px" bg="cirqueira.musica.cartaoElevado">
            <HStack justify="space-between" gap={3} wrap="wrap">
              <HStack gap={3}>
                <IconeFonteMusica fonte="spotify" tamanho={24} />
                <VStack align="start" gap={0}>
                  <Text fontWeight="semibold">Spotify</Text>
                  <Text fontSize="xs" color="cirqueira.musica.textoSecundario">
                    {carregandoSpotify
                      ? 'Verificando...'
                      : spotifyOk
                        ? (statusSpotify?.nomeExibicao ?? 'Conectado')
                        : spotifyConectado
                          ? 'Conectado, mas falta autorizar playlists'
                          : 'Não conectado'}
                  </Text>
                </VStack>
              </HStack>
              {!spotifyOk && (
                <Button
                  size="sm"
                  borderRadius="full"
                  bg="cirqueira.musica.verde"
                  color="cirqueira.grey.950"
                  fontWeight="bold"
                  loading={obterUrlSpotify.isPending}
                  onClick={handleConectarSpotify}
                >
                  {spotifyConectado ? 'Reconectar Spotify' : 'Conectar Spotify'}
                </Button>
              )}
              {spotifyOk && (
                <HStack gap={1} color="cirqueira.musica.verde">
                  <CheckCircle2 size={16} />
                  <Text fontSize="xs" fontWeight="semibold">
                    Pronto
                  </Text>
                </HStack>
              )}
            </HStack>
            {spotifyConectado && !spotifyPlaylistsOk && (
              <Text fontSize="xs" color="cirqueira.musica.textoSecundario" mt={2}>
                É preciso reconectar o Spotify uma vez para liberar leitura e alteração de
                playlists.
              </Text>
            )}
          </Box>

          <Box p={4} borderRadius="8px" bg="cirqueira.musica.cartaoElevado">
            <HStack justify="space-between" gap={3} wrap="wrap">
              <HStack gap={3}>
                <IconeFonteMusica fonte="youtube_music" tamanho={24} />
                <VStack align="start" gap={0}>
                  <Text fontWeight="semibold">Conta Google (playlists)</Text>
                  <Text fontSize="xs" color="cirqueira.musica.textoSecundario">
                    {carregandoYoutube
                      ? 'Verificando...'
                      : youtubeOk
                        ? (statusYoutube?.email ?? statusYoutube?.nomeCanal ?? 'Conectada')
                        : 'Não conectada'}
                  </Text>
                </VStack>
              </HStack>
              {!youtubeOk && (
                <Button
                  size="sm"
                  borderRadius="full"
                  bg="cirqueira.musica.verde"
                  color="cirqueira.grey.950"
                  fontWeight="bold"
                  loading={obterUrlYoutube.isPending}
                  onClick={handleConectarYoutube}
                >
                  Conectar conta Google
                </Button>
              )}
              {youtubeOk && (
                <HStack gap={1} color="cirqueira.musica.verde">
                  <CheckCircle2 size={16} />
                  <Text fontSize="xs" fontWeight="semibold">
                    Pronto
                  </Text>
                </HStack>
              )}
            </HStack>
          </Box>
        </VStack>

        <HStack justify="space-between" pt={2}>
          <Button variant="ghost" borderRadius="full" onClick={() => setPasso(1)}>
            Voltar
          </Button>
          <Button
            borderRadius="full"
            fontWeight="bold"
            bg="cirqueira.musica.verde"
            color="cirqueira.grey.950"
            _hover={{ bg: 'cirqueira.musica.verdeHover' }}
            disabled={!conexoesOk}
            onClick={() => setPasso(3)}
          >
            Continuar
          </Button>
        </HStack>
      </VStack>
    )
  } else if (passo === 3) {
    conteudo = (
      <VStack align="stretch" gap={4}>
        <Text fontSize="sm" color="cirqueira.musica.textoSecundario">
          Selecione as playlists de {origem ? labelServico(origem) : 'origem'} para transferir.
        </Text>
        <Input
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          placeholder="Buscar playlist..."
          bg="cirqueira.musica.cartaoElevado"
          borderColor="cirqueira.musica.cartaoElevado"
          color="cirqueira.musica.textoPrincipal"
          _placeholder={{ color: 'cirqueira.musica.textoDesabilitado' }}
        />
        <HStack gap={2} wrap="wrap">
          <Button
            size="xs"
            variant="outline"
            borderRadius="full"
            borderColor="cirqueira.musica.cartaoElevado"
            color="cirqueira.musica.textoPrincipal"
            onClick={() => selecionarTodas(playlistsFiltradas.map((p) => p.id))}
          >
            Todas (filtro)
          </Button>
          <Button
            size="xs"
            variant="outline"
            borderRadius="full"
            borderColor="cirqueira.musica.cartaoElevado"
            color="cirqueira.musica.textoPrincipal"
            disabled={!origem || detectarPares.isLoading}
            onClick={() => {
              if (!origem) return
              selecionarTodas(
                idsComParNoDestino(playlistsFiltradas, origem, detectarPares.data ?? [])
              )
            }}
          >
            Só com par no destino
          </Button>
          <Button
            size="xs"
            variant="outline"
            borderRadius="full"
            borderColor="cirqueira.musica.cartaoElevado"
            color="cirqueira.musica.textoPrincipal"
            onClick={() => {
              const idsVisiveis = playlistsFiltradas.map((p) => p.id)
              setIdsSelecionados((atual) => {
                const proximo = new Set(atual)
                for (const id of idsVisiveis) {
                  if (proximo.has(id)) proximo.delete(id)
                  else proximo.add(id)
                }
                return proximo
              })
            }}
          >
            Inverter filtro
          </Button>
          <Button
            size="xs"
            variant="ghost"
            borderRadius="full"
            color="cirqueira.musica.textoSecundario"
            onClick={limparSelecao}
          >
            Limpar
          </Button>
        </HStack>

        {listarPlaylists.isLoading ? (
          <HStack gap={2}>
            <Spinner size="sm" color="cirqueira.musica.verde" />
            <Text fontSize="sm" color="cirqueira.musica.textoSecundario">
              Carregando playlists...
            </Text>
          </HStack>
        ) : playlistsFiltradas.length === 0 ? (
          <Text fontSize="sm" color="cirqueira.musica.textoDesabilitado">
            Nenhuma playlist encontrada.
          </Text>
        ) : (
          <VStack align="stretch" gap={2} maxH="40vh" overflowY="auto">
            {playlistsFiltradas.map((playlist) => {
              const marcada = idsSelecionados.has(playlist.id)
              return (
                <HStack
                  key={playlist.id}
                  as="label"
                  gap={3}
                  p={2}
                  borderRadius="8px"
                  bg="cirqueira.musica.cartaoElevado"
                  cursor="pointer"
                  border="1px solid"
                  borderColor={marcada ? 'cirqueira.musica.verde' : 'transparent'}
                >
                  <Checkbox.Root
                    checked={marcada}
                    onCheckedChange={() => alternarPlaylist(playlist.id)}
                    colorPalette="green"
                    size="sm"
                  >
                    <Checkbox.HiddenInput />
                    <Checkbox.Control borderColor="cirqueira.musica.textoSecundario" />
                  </Checkbox.Root>
                  {playlist.urlCapa ? (
                    <Image
                      src={playlist.urlCapa}
                      alt=""
                      boxSize="40px"
                      borderRadius="4px"
                      objectFit="cover"
                      flexShrink={0}
                    />
                  ) : (
                    <Box
                      boxSize="40px"
                      borderRadius="4px"
                      bg="cirqueira.musica.cartao"
                      display="flex"
                      alignItems="center"
                      justifyContent="center"
                      flexShrink={0}
                    >
                      <Music2
                        size={18}
                        color="var(--chakra-colors-cirqueira-musica-texto-desabilitado)"
                      />
                    </Box>
                  )}
                  <VStack align="start" gap={0} minW={0} flex={1}>
                    <Text fontSize="sm" fontWeight="semibold" truncate maxW="full">
                      {playlist.nome}
                    </Text>
                    <Text fontSize="2xs" color="cirqueira.musica.textoSecundario">
                      {formatarNumero(playlist.totalFaixas)} faixas
                    </Text>
                  </VStack>
                </HStack>
              )
            })}
          </VStack>
        )}

        <HStack
          justify="space-between"
          align="center"
          pt={2}
          borderTop="1px solid"
          borderColor="cirqueira.musica.cartaoElevado"
          wrap="wrap"
          gap={2}
        >
          <VStack align="start" gap={0}>
            <Text fontSize="xs" color="cirqueira.musica.textoSecundario">
              {formatarNumero(totalSelecionado)} playlists · {formatarNumero(totalFaixas)} faixas
            </Text>
          </VStack>
          <HStack gap={2}>
            <Button variant="ghost" borderRadius="full" onClick={() => setPasso(2)}>
              Voltar
            </Button>
            <Button
              borderRadius="full"
              fontWeight="bold"
              bg="cirqueira.musica.verde"
              color="cirqueira.grey.950"
              _hover={{ bg: 'cirqueira.musica.verdeHover' }}
              disabled={totalSelecionado === 0}
              onClick={irParaDecisoes}
            >
              Continuar
            </Button>
          </HStack>
        </HStack>
      </VStack>
    )
  } else if (passo === 4) {
    const pares = detectarPares.data ?? []
    const selecionadas = playlists.filter((p) => idsSelecionados.has(p.id))
    const selecionadasFiltradas = filtrarPlaylistsPorBusca(selecionadas, buscaVinculos).filter(
      (playlist) => {
        if (!filtroSoComPar || !origem) return true
        return Boolean(encontrarParOrientado(playlist.id, origem, pares)?.destino)
      }
    )
    const idsComPar = origem ? idsComParNoDestino(selecionadas, origem, pares) : ([] as string[])
    const idsVisiveisComPar = origem
      ? idsComParNoDestino(selecionadasFiltradas, origem, pares)
      : ([] as string[])

    conteudo = (
      <VStack align="stretch" gap={4}>
        <VStack align="start" gap={1}>
          <Text fontSize="sm" color="cirqueira.musica.textoPrincipal" fontWeight="semibold">
            Como tratar playlists que já existem no destino
          </Text>
          <Text fontSize="xs" color="cirqueira.musica.textoSecundario">
            Se o nome bater (ex.: DREARY nos dois lados), escolha se cria outra, espelha um lado no
            outro ou só liga as duas sem mudar faixas agora.
          </Text>
        </VStack>

        <Input
          value={buscaVinculos}
          onChange={(e) => setBuscaVinculos(e.target.value)}
          placeholder="Buscar entre as selecionadas..."
          bg="cirqueira.musica.cartaoElevado"
          borderColor="cirqueira.musica.cartaoElevado"
          color="cirqueira.musica.textoPrincipal"
          _placeholder={{ color: 'cirqueira.musica.textoDesabilitado' }}
        />

        <HStack gap={2} wrap="wrap">
          <Button
            size="xs"
            variant={filtroSoComPar ? 'solid' : 'outline'}
            borderRadius="full"
            bg={filtroSoComPar ? 'cirqueira.musica.verde' : undefined}
            color={filtroSoComPar ? 'cirqueira.grey.950' : 'cirqueira.musica.textoPrincipal'}
            borderColor="cirqueira.musica.cartaoElevado"
            onClick={() => setFiltroSoComPar((atual) => !atual)}
          >
            Só com par ({formatarNumero(idsComPar.length)})
          </Button>
          <Button
            size="xs"
            variant="outline"
            borderRadius="full"
            borderColor="cirqueira.musica.cartaoElevado"
            color="cirqueira.musica.textoPrincipal"
            disabled={idsVisiveisComPar.length === 0}
            onClick={() =>
              aplicarDecisaoEmMassa('atualizar_origem_para_destino', idsVisiveisComPar, pares)
            }
          >
            Todas: {formatarDecisao('atualizar_origem_para_destino', origem, destino)}
          </Button>
          <Button
            size="xs"
            variant="outline"
            borderRadius="full"
            borderColor="cirqueira.musica.cartaoElevado"
            color="cirqueira.musica.textoPrincipal"
            disabled={idsVisiveisComPar.length === 0}
            onClick={() => aplicarDecisaoEmMassa('criar_nova', idsVisiveisComPar, pares)}
          >
            Todas: criar nova
          </Button>
          <Button
            size="xs"
            variant="outline"
            borderRadius="full"
            borderColor="cirqueira.musica.cartaoElevado"
            color="cirqueira.musica.textoPrincipal"
            disabled={idsVisiveisComPar.length === 0}
            onClick={() => aplicarDecisaoEmMassa('so_vincular', idsVisiveisComPar, pares)}
          >
            Todas: só vincular
          </Button>
          <Button
            size="xs"
            variant="ghost"
            borderRadius="full"
            color="cirqueira.musica.textoSecundario"
            onClick={() => {
              const idsRemover = new Set(selecionadasFiltradas.map((playlist) => playlist.id))
              setIdsSelecionados((atual) => {
                const proximo = new Set(atual)
                for (const id of idsRemover) proximo.delete(id)
                return proximo
              })
            }}
          >
            Remover do lote (filtro)
          </Button>
        </HStack>

        {detectarPares.isLoading ? (
          <HStack gap={2}>
            <Spinner size="sm" color="cirqueira.musica.verde" />
            <Text fontSize="sm" color="cirqueira.musica.textoSecundario">
              Detectando pares...
            </Text>
          </HStack>
        ) : selecionadasFiltradas.length === 0 ? (
          <Text fontSize="sm" color="cirqueira.musica.textoDesabilitado">
            Nenhuma playlist neste filtro.
          </Text>
        ) : (
          <VStack align="stretch" gap={3} maxH="45vh" overflowY="auto">
            {selecionadasFiltradas.map((playlist) => {
              const par = origem ? encontrarParOrientado(playlist.id, origem, pares) : undefined
              const decisaoAtual = decisoes[playlist.id] ?? 'criar_nova'
              const temPar = Boolean(par?.destino)
              return (
                <Box key={playlist.id} p={3} borderRadius="8px" bg="cirqueira.musica.cartaoElevado">
                  <VStack align="stretch" gap={3}>
                    <HStack justify="space-between" align="start" gap={3}>
                      <VStack align="start" gap={0.5} minW={0} flex={1}>
                        <Text fontSize="sm" fontWeight="semibold" truncate maxW="full">
                          {playlist.nome}
                        </Text>
                        <Text fontSize="2xs" color="cirqueira.musica.textoSecundario">
                          {formatarNumero(playlist.totalFaixas)} faixas
                          {origem ? ` no ${labelServico(origem)}` : ''}
                        </Text>
                        {temPar ? (
                          <Text fontSize="xs" color="cirqueira.musica.textoSecundario">
                            Já existe no {destino ? labelServico(destino) : 'destino'}:{' '}
                            <Text
                              as="span"
                              fontWeight="semibold"
                              color="cirqueira.musica.textoPrincipal"
                            >
                              {par?.destino?.nome}
                            </Text>{' '}
                            ({Math.round(par?.similaridade ?? 0)}% similar,{' '}
                            {formatarNumero(par?.destino?.totalFaixas ?? 0)} faixas)
                          </Text>
                        ) : (
                          <Text fontSize="xs" color="cirqueira.musica.textoDesabilitado">
                            Sem playlist parecida no destino — vai criar uma nova.
                          </Text>
                        )}
                      </VStack>
                      <Button
                        size="xs"
                        variant="ghost"
                        color="cirqueira.musica.textoSecundario"
                        onClick={() =>
                          setIdsSelecionados((atual) => {
                            const proximo = new Set(atual)
                            proximo.delete(playlist.id)
                            return proximo
                          })
                        }
                      >
                        Tirar
                      </Button>
                    </HStack>

                    {temPar ? (
                      <RadioGroup.Root
                        value={decisaoAtual}
                        onValueChange={(detalhes) => {
                          const valor = detalhes.value as DecisaoPlaylistDestino
                          setDecisoes((atual) => ({ ...atual, [playlist.id]: valor }))
                        }}
                        colorPalette="green"
                      >
                        <VStack align="stretch" gap={2}>
                          {OPCOES_DECISAO.map((opcao) => (
                            <RadioGroup.Item
                              key={opcao}
                              value={opcao}
                              p={2}
                              borderRadius="lg"
                              border="1px solid"
                              borderColor={
                                decisaoAtual === opcao
                                  ? 'cirqueira.musica.verde'
                                  : 'cirqueira.musica.cartao'
                              }
                              bg={
                                decisaoAtual === opcao ? 'cirqueira.musica.cartao' : 'transparent'
                              }
                            >
                              <HStack gap={3} align="start" w="full">
                                <RadioGroup.ItemHiddenInput />
                                <RadioGroup.ItemIndicator mt={0.5} />
                                <VStack align="start" gap={0.5} flex={1}>
                                  <RadioGroup.ItemText
                                    fontSize="xs"
                                    fontWeight="semibold"
                                    color="cirqueira.musica.textoPrincipal"
                                  >
                                    {formatarDecisao(opcao, origem, destino)}
                                  </RadioGroup.ItemText>
                                  <Text fontSize="2xs" color="cirqueira.musica.textoSecundario">
                                    {descreverDecisao(opcao, origem, destino, par?.destino?.nome)}
                                  </Text>
                                </VStack>
                              </HStack>
                            </RadioGroup.Item>
                          ))}
                        </VStack>
                      </RadioGroup.Root>
                    ) : null}
                  </VStack>
                </Box>
              )
            })}
          </VStack>
        )}
        <HStack justify="space-between" pt={2} wrap="wrap" gap={2}>
          <Button variant="ghost" borderRadius="full" onClick={() => setPasso(3)}>
            Voltar
          </Button>
          <Button
            borderRadius="full"
            fontWeight="bold"
            bg="cirqueira.musica.verde"
            color="cirqueira.grey.950"
            _hover={{ bg: 'cirqueira.musica.verdeHover' }}
            loading={iniciar.isPending}
            disabled={idsSelecionados.size === 0}
            onClick={handleIniciar}
          >
            Iniciar casamento ({formatarNumero(idsSelecionados.size)})
          </Button>
        </HStack>
      </VStack>
    )
  } else if (passo === 5) {
    const emCasamento = !detalhe || detalhe.status === 'casando' || detalhe.status === 'rascunho'
    const falhou = detalhe?.status === 'falha'
    const previaPronta = detalhe?.status === 'previa'

    conteudo = (
      <VStack align="stretch" gap={4}>
        {emCasamento && (
          <VStack align="stretch" gap={3}>
            <HStack gap={3}>
              <Spinner size="sm" color="cirqueira.musica.verde" />
              <Text fontSize="sm" color="cirqueira.musica.textoSecundario">
                Casando faixas...
              </Text>
            </HStack>
            {detalhe && (
              <VStack align="stretch" gap={1}>
                <Text fontSize="xs" color="cirqueira.musica.textoSecundario">
                  {formatarNumero(detalhe.totalCasadas)} casadas ·{' '}
                  {formatarNumero(detalhe.totalDuvidosas)} duvidosas ·{' '}
                  {formatarNumero(detalhe.totalNaoEncontradas)} não encontradas de{' '}
                  {formatarNumero(detalhe.totalFaixas)}
                </Text>
                <Progress.Root
                  value={
                    detalhe.totalFaixas > 0
                      ? Math.round(
                          ((detalhe.totalCasadas +
                            detalhe.totalDuvidosas +
                            detalhe.totalNaoEncontradas) /
                            detalhe.totalFaixas) *
                            100
                        )
                      : 0
                  }
                  colorPalette="green"
                  size="sm"
                >
                  <Progress.Track bg="cirqueira.musica.cartaoElevado">
                    <Progress.Range />
                  </Progress.Track>
                </Progress.Root>
              </VStack>
            )}
          </VStack>
        )}

        {falhou && (
          <Text fontSize="sm" color="cirqueira.red.300" role="alert">
            {detalhe?.mensagemErro ?? 'Falha ao casar as faixas.'}
          </Text>
        )}

        {previaPronta && grupos && (
          <VStack align="stretch" gap={4} maxH="50vh" overflowY="auto">
            <Text fontSize="sm" color="cirqueira.musica.textoSecundario">
              Relatório do casamento. As casadas seguem prontas; revise só as duvidosas / não
              encontradas e ignore o que não quiser transferir.
            </Text>
            <Box p={3} borderRadius="8px" bg="cirqueira.musica.cartaoElevado">
              <Text fontSize="sm" fontWeight="semibold">
                {formatarNumero(detalhe?.totalCasadas ?? 0)} casadas ·{' '}
                {formatarNumero(detalhe?.totalDuvidosas ?? 0)} duvidosas ·{' '}
                {formatarNumero(detalhe?.totalNaoEncontradas ?? 0)} não encontradas
              </Text>
              <Text fontSize="2xs" color="cirqueira.musica.textoSecundario" mt={1}>
                {formatarNumero(detalhe?.playlists?.length ?? 0)} playlists ·{' '}
                {formatarNumero(detalhe?.totalFaixas ?? 0)} faixas no total
                {detalhe?.itensResumo
                  ? ' · lista abaixo só com duvidosas/não encontradas'
                  : ''}
              </Text>
            </Box>
            {(detalhe?.totalCasadas ?? 0) > 0 && grupos.casadas.length === 0 && (
              <Text fontSize="xs" color="cirqueira.musica.verde">
                {formatarNumero(detalhe?.totalCasadas ?? 0)} faixas casadas prontas para transferir
                (ocultas na lista para caber tudo).
              </Text>
            )}
            {grupos.duvidosas.length + grupos.naoEncontradas.length === 0 &&
            grupos.casadas.length === 0 ? (
              <Text fontSize="sm" color="cirqueira.musica.textoDesabilitado">
                Nenhuma faixa problemática. Pode confirmar e transferir as casadas.
              </Text>
            ) : (
              (
                [
                  { rotulo: 'Duvidosas', itens: grupos.duvidosas },
                  { rotulo: 'Não encontradas', itens: grupos.naoEncontradas },
                  ...(detalhe?.itensResumo
                    ? []
                    : [{ rotulo: 'Casadas', itens: grupos.casadas }]),
                ] as { rotulo: string; itens: typeof grupos.duvidosas }[]
              ).map(({ rotulo, itens }) =>
                itens.length === 0 ? null : (
                  <VStack key={rotulo} align="stretch" gap={2}>
                    <Heading as="h3" fontSize="xs" color="cirqueira.musica.amarelo">
                      {rotulo} ({formatarNumero(itens.length)})
                    </Heading>
                    {itens.map((item) => {
                      const ignorado = ignorados.has(item.uuid)
                      return (
                        <HStack
                          key={item.uuid}
                          gap={3}
                          p={2}
                          borderRadius="8px"
                          bg="cirqueira.musica.cartaoElevado"
                          opacity={ignorado ? 0.55 : 1}
                        >
                          <VStack align="start" gap={0} flex={1} minW={0}>
                            <Text fontSize="sm" fontWeight="semibold" truncate maxW="full">
                              {item.tituloOrigem}
                            </Text>
                            <Text
                              fontSize="2xs"
                              color="cirqueira.musica.textoSecundario"
                              truncate
                              maxW="full"
                            >
                              {item.artistasOrigem}
                              {item.tituloDestino
                                ? ` → ${item.tituloDestino}${item.artistasDestino ? ` · ${item.artistasDestino}` : ''}`
                                : ''}
                            </Text>
                          </VStack>
                          <Button
                            size="xs"
                            variant="ghost"
                            color={
                              ignorado
                                ? 'cirqueira.musica.verde'
                                : 'cirqueira.musica.textoSecundario'
                            }
                            onClick={() => alternarIgnorado(item.uuid)}
                          >
                            {ignorado ? 'Restaurar' : 'Ignorar'}
                          </Button>
                        </HStack>
                      )
                    })}
                  </VStack>
                )
              )
            )}
          </VStack>
        )}

        <HStack justify="space-between" pt={2}>
          <Button
            variant="ghost"
            borderRadius="full"
            onClick={falhou ? () => setPasso(4) : handleFechar}
          >
            {falhou ? 'Voltar' : 'Fechar'}
          </Button>
          {previaPronta && (
            <Button
              borderRadius="full"
              fontWeight="bold"
              bg="cirqueira.musica.verde"
              color="cirqueira.grey.950"
              _hover={{ bg: 'cirqueira.musica.verdeHover' }}
              loading={confirmarPrevia.isPending || executar.isPending}
              disabled={(detalhe?.totalCasadas ?? 0) + (detalhe?.totalDuvidosas ?? 0) === 0}
              onClick={handleConfirmarETransferir}
            >
              Confirmar e transferir
            </Button>
          )}
        </HStack>
      </VStack>
    )
  } else {
    const emExecucao =
      !detalhe ||
      detalhe.status === 'executando' ||
      (detalhe.status !== 'concluida' &&
        detalhe.status !== 'falha' &&
        detalhe.status !== 'pausada_cota')

    conteudo = (
      <VStack align="stretch" gap={4}>
        {emExecucao && detalhe?.status !== 'pausada_cota' && (
          <HStack gap={3}>
            <Spinner size="sm" color="cirqueira.musica.verde" />
            <Text fontSize="sm" color="cirqueira.musica.textoSecundario">
              Transferindo faixas...
            </Text>
          </HStack>
        )}

        {detalhe && (
          <VStack
            align="stretch"
            gap={2}
            p={4}
            borderRadius="8px"
            bg="cirqueira.musica.cartaoElevado"
          >
            <Text fontSize="sm" fontWeight="semibold">
              {detalhe.statusDescricao}
            </Text>
            <Text fontSize="xs" color="cirqueira.musica.textoSecundario">
              {formatarNumero(detalhe.totalTransferidas)} transferidas ·{' '}
              {formatarNumero(detalhe.totalFalhas)} falhas de {formatarNumero(detalhe.totalFaixas)}
              {detalhe.totalFaixas > 0
                ? ` (${Math.min(100, Math.round(((detalhe.totalTransferidas + detalhe.totalFalhas) / detalhe.totalFaixas) * 100))}%)`
                : ''}
            </Text>
            {detalhe.status === 'executando' && detalhe.totalFaixas > 0 && (
              <Progress.Root
                value={Math.min(
                  100,
                  Math.round(
                    ((detalhe.totalTransferidas + detalhe.totalFalhas) / detalhe.totalFaixas) * 100
                  )
                )}
                size="sm"
                mt={1}
              >
                <Progress.Track bg="cirqueira.musica.cartao" borderRadius="full">
                  <Progress.Range bg="cirqueira.musica.verde" borderRadius="full" />
                </Progress.Track>
              </Progress.Root>
            )}
            {detalhe.status === 'pausada_cota' && (
              <Text fontSize="xs" color="cirqueira.musica.amarelo">
                Pausada por cota da API. Você pode tentar novamente mais tarde.
              </Text>
            )}
            {detalhe.status === 'falha' && detalhe.mensagemErro && (
              <Text fontSize="xs" color="cirqueira.red.300" role="alert">
                {detalhe.mensagemErro}
              </Text>
            )}
            {detalhe.status === 'concluida' && (
              <HStack gap={2} color="cirqueira.musica.verde" pt={1}>
                <CheckCircle2 size={16} />
                <Text fontSize="sm" fontWeight="semibold">
                  Transferência concluída
                </Text>
              </HStack>
            )}
          </VStack>
        )}

        <Button alignSelf="flex-end" borderRadius="full" onClick={handleFechar}>
          Fechar
        </Button>
      </VStack>
    )
  }

  if (!isDesktop) {
    return (
      <Drawer.Root open={aberto} onOpenChange={(d) => !d.open && handleFechar()} placement="bottom">
        <Portal>
          <Drawer.Backdrop />
          <Drawer.Positioner>
            <Drawer.Content
              bg="cirqueira.musica.cartao"
              color="cirqueira.musica.textoPrincipal"
              borderTopRadius="16px"
              maxH="92vh"
            >
              <Drawer.Header>
                <Drawer.Title>
                  {titulo}
                  <Text as="span" fontSize="xs" color="cirqueira.musica.textoSecundario" ml={2}>
                    Passo {passo}/6
                  </Text>
                </Drawer.Title>
              </Drawer.Header>
              <Drawer.Body pb={8} overflowY="auto">
                {conteudo}
              </Drawer.Body>
              <Drawer.CloseTrigger asChild>
                <CloseButton size="sm" color="cirqueira.musica.textoSecundario" />
              </Drawer.CloseTrigger>
            </Drawer.Content>
          </Drawer.Positioner>
        </Portal>
      </Drawer.Root>
    )
  }

  return (
    <Dialog.Root open={aberto} onOpenChange={(d) => !d.open && handleFechar()} size="xl">
      <Portal>
        <Dialog.Backdrop bg="rgba(0, 0, 0, 0.8)" />
        <Dialog.Positioner>
          <Dialog.Content
            bg="cirqueira.musica.cartao"
            color="cirqueira.musica.textoPrincipal"
            borderRadius="8px"
            border="1px solid"
            borderColor="cirqueira.musica.cartaoElevado"
            maxH="90vh"
          >
            <Dialog.Header>
              <Dialog.Title>
                {titulo}
                <Text as="span" fontSize="xs" color="cirqueira.musica.textoSecundario" ml={2}>
                  Passo {passo}/6
                </Text>
              </Dialog.Title>
            </Dialog.Header>
            <Dialog.Body pb={6} overflowY="auto">
              {conteudo}
            </Dialog.Body>
            <Dialog.CloseTrigger asChild>
              <CloseButton size="sm" color="cirqueira.musica.textoSecundario" />
            </Dialog.CloseTrigger>
          </Dialog.Content>
        </Dialog.Positioner>
      </Portal>
    </Dialog.Root>
  )
})
