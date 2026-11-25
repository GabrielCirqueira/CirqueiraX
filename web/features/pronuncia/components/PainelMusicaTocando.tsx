import { useLocalStorageState } from '@/shared/hooks'
import {
  Badge,
  Box,
  Button,
  Grid,
  HStack,
  IconButton,
  Image,
  Link,
  Skeleton,
  Text,
  VStack,
} from '@chakra-ui/react'
import {
  AlertTriangle,
  ExternalLink,
  Languages,
  Loader2,
  Mic2,
  Minus,
  Music2,
  Pause,
  Plus,
  RefreshCw,
  RotateCcw,
} from 'lucide-react'
import type { ReactNode } from 'react'
import { memo } from 'react'
import { Link as RouterLink } from 'react-router-dom'
import {
  type FalaIngles,
  faixaDoTocando,
  useLetraMusica,
  useTocandoAgoraPronuncia,
  useTraduzirLetra,
} from '../hooks'
import type { ModoPronuncia, TocandoAgoraPronuncia } from '../types'
import {
  LIMITE_AJUSTE_SINCRONIA_MS,
  OPCOES_MODO,
  PASSO_AJUSTE_SINCRONIA_MS,
  PERCENTUAL_LETRA_OUTRO_IDIOMA,
  formatarAjusteSincronia,
} from '../utils'
import { BarraTempoMusica } from './BarraTempoMusica'
import { LetraSincronizada } from './LetraSincronizada'

function horaBrasilia(iso: string): string {
  return new Date(iso).toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'America/Sao_Paulo',
  })
}

function AvisoMusica({
  icone,
  titulo,
  texto,
  acao,
}: { icone: ReactNode; titulo: string; texto: string; acao?: ReactNode }) {
  return (
    <VStack
      bg="bg.panel"
      borderWidth="1px"
      borderColor="border.subtle"
      borderStyle="dashed"
      borderRadius="12px"
      py={14}
      px={6}
      gap={2}
      textAlign="center"
    >
      <Box color="fg.subtle">{icone}</Box>
      <Text fontSize="md" fontWeight="semibold" color="fg">
        {titulo}
      </Text>
      <Text fontSize="sm" color="fg.subtle" maxW="md">
        {texto}
      </Text>
      {acao}
    </VStack>
  )
}

function Alternador({
  ativo,
  rotulo,
  onClick,
}: { ativo: boolean; rotulo: string; onClick: () => void }) {
  return (
    <Button
      size="xs"
      borderRadius="full"
      variant={ativo ? 'subtle' : 'outline'}
      colorPalette={ativo ? 'brand' : 'gray'}
      aria-pressed={ativo}
      onClick={onClick}
    >
      {rotulo}
    </Button>
  )
}

export interface PainelMusicaTocandoProps {
  fala: FalaIngles
  modo: ModoPronuncia
  onMudarModo: (modo: ModoPronuncia) => void
}

export const PainelMusicaTocando = memo(function PainelMusicaTocando({
  fala,
  modo,
  onMudarModo,
}: PainelMusicaTocandoProps) {
  const consulta = useTocandoAgoraPronuncia(true)
  const tocando = consulta.data
  const faixa = faixaDoTocando(tocando)
  const letra = useLetraMusica(faixa)
  const traduzir = useTraduzirLetra()
  const [mostrarPronuncia, setMostrarPronuncia] = useLocalStorageState(
    'pronuncia:musica:pronuncia',
    true
  )
  const [mostrarTraducao, setMostrarTraducao] = useLocalStorageState(
    'pronuncia:musica:traducao',
    false
  )
  const [ajusteMs, setAjusteMs] = useLocalStorageState('pronuncia:musica:ajuste', 0)

  if (consulta.isLoading) return <Skeleton h="420px" borderRadius="12px" />

  if (consulta.isError || !tocando) {
    return (
      <AvisoMusica
        icone={<AlertTriangle size={28} />}
        titulo="Não consegui falar com o servidor"
        texto="Tente de novo em instantes."
        acao={
          <Button
            size="sm"
            variant="outline"
            borderRadius="full"
            onClick={() => consulta.refetch()}
          >
            Tentar de novo
          </Button>
        }
      />
    )
  }

  if (!tocando.conectado) {
    return (
      <AvisoMusica
        icone={<Music2 size={28} />}
        titulo="Conecte seu Spotify"
        texto="A aba usa a música que está tocando na sua conta do Spotify. Conecte a conta na página Música."
        acao={
          <Button asChild size="sm" colorPalette="brand" borderRadius="full">
            <RouterLink to="/musica">Ir para Música</RouterLink>
          </Button>
        }
      />
    )
  }

  if (tocando.bloqueadoAte) {
    return (
      <AvisoMusica
        icone={<AlertTriangle size={28} />}
        titulo="O Spotify pausou as consultas do app"
        texto={`O Spotify bloqueou o app por excesso de consultas até ${horaBrasilia(tocando.bloqueadoAte)} (horário de Brasília). Depois disso a letra volta a aparecer sozinha.`}
      />
    )
  }

  if (!tocando.temItem) {
    return (
      <AvisoMusica
        icone={<Music2 size={28} />}
        titulo="Nada tocando no Spotify agora"
        texto="Dê play em uma música e ela aparece aqui em alguns segundos, com a letra e a pronúncia."
      />
    )
  }

  return (
    <Grid templateColumns={{ base: '1fr', lg: '300px minmax(0, 1fr)' }} gap={5} alignItems="start">
      <CartaoMusica
        tocando={tocando}
        modo={modo}
        onMudarModo={onMudarModo}
        mostrarPronuncia={mostrarPronuncia}
        mostrarTraducao={mostrarTraducao}
        ajusteMs={ajusteMs}
        sincronizada={letra.data?.situacao === 'sincronizada'}
        temLetra={(letra.data?.linhas.length ?? 0) > 0}
        traduzindo={traduzir.isPending}
        onAlternarPronuncia={() => setMostrarPronuncia((valor) => !valor)}
        onAlternarTraducao={() => {
          if (letra.data && !letra.data.traduzida && !mostrarTraducao)
            traduzir.mutate(letra.data.uuid)
          setMostrarTraducao((valor) => !valor)
        }}
        atualizando={consulta.isFetching}
        onAtualizar={() => consulta.refetch()}
        onAjustar={(passo) =>
          setAjusteMs((valor) =>
            Math.max(
              -LIMITE_AJUSTE_SINCRONIA_MS,
              Math.min(LIMITE_AJUSTE_SINCRONIA_MS, passo === 0 ? 0 : valor + passo)
            )
          )
        }
      />

      <Box minW={0}>
        {!faixa && (
          <AvisoMusica
            icone={<Mic2 size={28} />}
            titulo="Isso não é uma música"
            texto="Podcasts e outros conteúdos não têm letra. Toque uma música para ver a pronúncia."
          />
        )}
        {faixa && letra.isLoading && (
          <VStack align="stretch" gap={3} py={6}>
            {['a', 'b', 'c', 'd', 'e'].map((chave) => (
              <Skeleton key={chave} h="44px" borderRadius="10px" />
            ))}
            <Text fontSize="xs" color="fg.subtle" textAlign="center">
              Buscando a letra…
            </Text>
          </VStack>
        )}
        {faixa && letra.isError && (
          <AvisoMusica
            icone={<AlertTriangle size={28} />}
            titulo="Não consegui buscar a letra"
            texto="O serviço de letras não respondeu. Tente de novo em instantes."
            acao={
              <Button
                size="sm"
                variant="outline"
                borderRadius="full"
                onClick={() => letra.refetch()}
              >
                Tentar de novo
              </Button>
            }
          />
        )}
        {letra.data?.situacao === 'nao_encontrada' && (
          <AvisoMusica
            icone={<Music2 size={28} />}
            titulo="Não achei a letra desta música"
            texto="A letra vem do LRCLIB, um acervo aberto. Músicas pouco conhecidas às vezes não estão lá; vou procurar de novo daqui a alguns dias."
          />
        )}
        {letra.data?.situacao === 'instrumental' && (
          <AvisoMusica
            icone={<Music2 size={28} />}
            titulo="Música instrumental"
            texto="Esta música não tem letra. Aproveite o som!"
          />
        )}
        {letra.data && letra.data.linhas.length > 0 && faixa && (
          <VStack align="stretch" gap={3}>
            {letra.data.percentualAproximado > PERCENTUAL_LETRA_OUTRO_IDIOMA && (
              <HStack
                gap={2}
                p={3}
                borderRadius="10px"
                bg="cirqueira.orange.500/10"
                color="cirqueira.orange.300"
                fontSize="sm"
                align="flex-start"
              >
                <Box pt="2px" flexShrink={0}>
                  <AlertTriangle size={14} />
                </Box>
                <Text>
                  Parece que esta letra não está em inglês. A pronúncia foi feita para inglês e pode
                  não fazer sentido aqui.
                </Text>
              </HStack>
            )}
            {letra.data.situacao === 'simples' && (
              <Text fontSize="xs" color="fg.subtle" textAlign="center">
                Esta letra não tem marcação de tempo: ela não acompanha a música sozinha, role para
                seguir.
              </Text>
            )}
            <LetraSincronizada
              key={faixa.codigoFaixa}
              letra={letra.data}
              tocando={tocando}
              ajusteMs={ajusteMs}
              modo={modo}
              mostrarPronuncia={mostrarPronuncia}
              mostrarTraducao={mostrarTraducao && letra.data.traduzida}
              fala={fala}
            />
          </VStack>
        )}
      </Box>
    </Grid>
  )
})

interface CartaoMusicaProps {
  tocando: TocandoAgoraPronuncia
  modo: ModoPronuncia
  mostrarPronuncia: boolean
  mostrarTraducao: boolean
  ajusteMs: number
  sincronizada: boolean
  temLetra: boolean
  traduzindo: boolean
  atualizando: boolean
  onAtualizar: () => void
  onMudarModo: (modo: ModoPronuncia) => void
  onAlternarPronuncia: () => void
  onAlternarTraducao: () => void
  onAjustar: (passo: number) => void
}

const CartaoMusica = memo(function CartaoMusica({
  tocando,
  modo,
  mostrarPronuncia,
  mostrarTraducao,
  ajusteMs,
  sincronizada,
  temLetra,
  traduzindo,
  atualizando,
  onAtualizar,
  onMudarModo,
  onAlternarPronuncia,
  onAlternarTraducao,
  onAjustar,
}: CartaoMusicaProps) {
  return (
    <Box
      bg="bg.panel"
      borderWidth="1px"
      borderColor="border.subtle"
      borderRadius="12px"
      shadow="xs"
      overflow="hidden"
      position={{ base: 'static', lg: 'sticky' }}
      top={{ lg: 20 }}
    >
      <HStack p={4} gap={3} align="center" display={{ base: 'flex', lg: 'block' }}>
        {tocando.capaUrl && (
          <Image
            src={tocando.capaUrl}
            alt={tocando.album ?? tocando.nome ?? 'Capa'}
            w={{ base: '72px', lg: 'full' }}
            aspectRatio="1"
            objectFit="cover"
            borderRadius="10px"
            flexShrink={0}
            mb={{ lg: 3 }}
            shadow="md"
          />
        )}
        <VStack align="stretch" gap={0.5} minW={0} flex="1">
          <HStack gap={2}>
            <Text fontSize="md" fontWeight="bold" color="fg" lineClamp={2} flex="1">
              {tocando.nome}
            </Text>
            <IconButton
              size="2xs"
              variant="ghost"
              borderRadius="full"
              aria-label="Atualizar música agora"
              title="Trocou de música? Atualize agora"
              disabled={atualizando}
              onClick={onAtualizar}
            >
              <RefreshCw
                size={13}
                style={atualizando ? { animation: 'spin 1s linear infinite' } : undefined}
              />
            </IconButton>
            {!tocando.emReproducao && (
              <Badge size="xs" variant="subtle" borderRadius="full" flexShrink={0}>
                <Pause size={10} />
                Pausada
              </Badge>
            )}
          </HStack>
          <Text fontSize="sm" color="fg.muted" lineClamp={1}>
            {tocando.artistas.join(', ')}
          </Text>
          <Box mt={2}>
            <BarraTempoMusica tocando={tocando} />
          </Box>
        </VStack>
      </HStack>

      <VStack align="stretch" gap={3} px={4} pb={4} pt={1}>
        <VStack align="stretch" gap={1.5}>
          <Text
            fontSize="2xs"
            fontWeight="bold"
            color="fg.subtle"
            textTransform="uppercase"
            letterSpacing="0.06em"
          >
            Mostrar
          </Text>
          <HStack gap={1.5} flexWrap="wrap">
            <Alternador ativo={mostrarPronuncia} rotulo="Pronúncia" onClick={onAlternarPronuncia} />
            <Button
              size="xs"
              borderRadius="full"
              variant={mostrarTraducao ? 'subtle' : 'outline'}
              colorPalette={mostrarTraducao ? 'brand' : 'gray'}
              aria-pressed={mostrarTraducao}
              disabled={!temLetra || traduzindo}
              onClick={onAlternarTraducao}
            >
              {traduzindo ? (
                <Loader2 size={12} style={{ animation: 'spin 1s linear infinite' }} />
              ) : (
                <Languages size={12} />
              )}
              {traduzindo ? 'Traduzindo…' : 'Tradução'}
            </Button>
          </HStack>
        </VStack>

        {mostrarPronuncia && (
          <VStack align="stretch" gap={1.5}>
            <Text
              fontSize="2xs"
              fontWeight="bold"
              color="fg.subtle"
              textTransform="uppercase"
              letterSpacing="0.06em"
            >
              Pronúncia
            </Text>
            <HStack gap={1} bg="bg.muted" p={0.5} borderRadius="8px">
              {OPCOES_MODO.map((opcao) => (
                <Button
                  key={opcao.valor}
                  flex="1"
                  size="2xs"
                  borderRadius="6px"
                  variant={opcao.valor === modo ? 'solid' : 'ghost'}
                  colorPalette={opcao.valor === modo ? 'brand' : 'gray'}
                  aria-pressed={opcao.valor === modo}
                  title={opcao.descricao}
                  onClick={() => onMudarModo(opcao.valor)}
                >
                  {opcao.rotulo}
                </Button>
              ))}
            </HStack>
          </VStack>
        )}

        {sincronizada && (
          <VStack align="stretch" gap={1.5}>
            <Text
              fontSize="2xs"
              fontWeight="bold"
              color="fg.subtle"
              textTransform="uppercase"
              letterSpacing="0.06em"
            >
              Letra fora do tempo?
            </Text>
            <HStack gap={1}>
              <IconButton
                size="xs"
                variant="outline"
                borderRadius="full"
                aria-label="Atrasar a letra"
                title="Atrasar a letra meio segundo"
                onClick={() => onAjustar(-PASSO_AJUSTE_SINCRONIA_MS)}
              >
                <Minus size={12} />
              </IconButton>
              <Text fontSize="xs" color="fg.muted" flex="1" textAlign="center">
                {formatarAjusteSincronia(ajusteMs)}
              </Text>
              <IconButton
                size="xs"
                variant="outline"
                borderRadius="full"
                aria-label="Adiantar a letra"
                title="Adiantar a letra meio segundo"
                onClick={() => onAjustar(PASSO_AJUSTE_SINCRONIA_MS)}
              >
                <Plus size={12} />
              </IconButton>
              {ajusteMs !== 0 && (
                <IconButton
                  size="xs"
                  variant="ghost"
                  borderRadius="full"
                  aria-label="Voltar ao tempo original"
                  onClick={() => onAjustar(0)}
                >
                  <RotateCcw size={12} />
                </IconButton>
              )}
            </HStack>
          </VStack>
        )}

        {tocando.urlSpotify && (
          <Link
            href={tocando.urlSpotify}
            target="_blank"
            rel="noopener noreferrer"
            fontSize="xs"
            color="fg.subtle"
            display="inline-flex"
            alignItems="center"
            gap={1}
            _hover={{ color: 'cirqueira.musica.verde' }}
          >
            <ExternalLink size={12} />
            Abrir no Spotify
          </Link>
        )}
      </VStack>
    </Box>
  )
})
