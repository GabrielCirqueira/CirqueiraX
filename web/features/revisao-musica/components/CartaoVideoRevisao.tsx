import {
  Badge,
  Box,
  Button,
  Checkbox,
  Flex,
  HStack,
  Heading,
  SimpleGrid,
  Text,
  VStack,
} from '@chakra-ui/react'
import { Ban, Layers, ListMusic, Search, Tv } from 'lucide-react'
import { memo } from 'react'
import type { ClassificacaoCanal, CorrecaoVideoPayload, TipoRevisao, VideoRevisao } from '../types'
import {
  aceitaLote,
  confiancaVideo,
  formatarDuracaoVideo,
  nivelConfianca,
  opcoesLeituraVideo,
  rotuloVersao,
} from '../utils'
import { AtalhosVideoRevisao } from './AtalhosVideoRevisao'
import { MiniaturaVideoRevisao } from './MiniaturaVideoRevisao'
import { OpcaoSugestaoRevisao } from './OpcaoSugestaoRevisao'

export interface CartaoVideoRevisaoProps {
  video: VideoRevisao
  tipo: TipoRevisao
  selecionado: boolean
  ocupado: boolean
  onAlternarSelecao: (uuid: string) => void
  onCorrigir: (video: VideoRevisao, payload: CorrecaoVideoPayload) => void
  onEscolherMusica: (video: VideoRevisao) => void
  onMarcarMashup: (video: VideoRevisao) => void
  onClassificarCanal: (canal: string, classificacao: ClassificacaoCanal) => void
}

const PROPS_BOTAO_SECUNDARIO = {
  size: 'sm',
  variant: 'outline',
  borderRadius: 'full',
  borderColor: 'cirqueira.musica.textoDesabilitado',
  color: 'cirqueira.musica.textoPrincipal',
  justifyContent: 'center',
  _hover: { bg: 'cirqueira.musica.cartaoElevado' },
} as const

const PROPS_ROTULO_SECAO = {
  fontSize: '2xs',
  fontWeight: 'bold',
  textTransform: 'uppercase',
  letterSpacing: 'wide',
  color: 'cirqueira.musica.textoSecundario',
} as const

export const CartaoVideoRevisao = memo(function CartaoVideoRevisao({
  video,
  tipo,
  selecionado,
  ocupado,
  onAlternarSelecao,
  onCorrigir,
  onEscolherMusica,
  onMarcarMashup,
  onClassificarCanal,
}: CartaoVideoRevisaoProps) {
  const opcoes = opcoesLeituraVideo(video)
  const confianca = nivelConfianca(confiancaVideo(video))
  const versao = rotuloVersao(video.sugestaoIa?.versao ?? video.tipoVersao)
  const compilacao = tipo === 'compilacao'

  return (
    <VStack
      as="article"
      align="stretch"
      gap={4}
      p={{ base: 3, sm: 4 }}
      borderRadius="12px"
      bg="cirqueira.musica.cartao"
      border="1px solid"
      borderColor={selecionado ? 'cirqueira.musica.verde' : 'cirqueira.musica.cartaoElevado'}
      opacity={ocupado ? 0.6 : 1}
      aria-busy={ocupado}
      minW={0}
    >
      <Flex gap={3} align="start" minW={0}>
        <MiniaturaVideoRevisao
          imagem={video.miniatura}
          videoId={video.videoId}
          titulo={video.titulo}
        />
        <VStack align="stretch" gap={1.5} minW={0} flex={1}>
          <Heading
            as="h3"
            fontSize="sm"
            fontWeight="semibold"
            color="cirqueira.musica.textoPrincipal"
            lineClamp={2}
            wordBreak="break-word"
          >
            {video.titulo}
          </Heading>
          <Text fontSize="xs" color="cirqueira.musica.textoSecundario" truncate>
            {video.canal || 'Canal desconhecido'} · {formatarDuracaoVideo(video.duracaoMs)}
          </Text>
          <HStack gap={2} wrap="wrap">
            {versao && (
              <Badge size="sm" bg="cirqueira.musica.cartaoElevado" color="cirqueira.musica.azul">
                {versao}
              </Badge>
            )}
            {!video.disponivel && (
              <Badge size="sm" bg="cirqueira.musica.cartaoElevado" color="cirqueira.musica.amarelo">
                Indisponível
              </Badge>
            )}
          </HStack>
        </VStack>
        {aceitaLote(tipo) && (
          <Checkbox.Root
            checked={selecionado}
            onCheckedChange={() => onAlternarSelecao(video.uuid)}
            colorPalette="green"
            size="sm"
            flexShrink={0}
            aria-label={`Selecionar ${video.titulo} para resolver junto com outros`}
          >
            <Checkbox.HiddenInput />
            <Checkbox.Control borderColor="cirqueira.musica.textoSecundario" />
          </Checkbox.Root>
        )}
      </Flex>

      <AtalhosVideoRevisao videoId={video.videoId} canal={video.canal} canalId={video.canalId} />

      <VStack align="stretch" gap={2}>
        <HStack justify="space-between" gap={2} wrap="wrap">
          <Text {...PROPS_ROTULO_SECAO}>
            {opcoes.length > 0 ? 'Qual música é esta?' : 'Não encontrei uma música provável'}
          </Text>
          {confianca && opcoes.length > 0 && (
            <Text fontSize="2xs" fontWeight="semibold" color={confianca.cor}>
              {confianca.rotulo}
            </Text>
          )}
        </HStack>

        {opcoes.length === 0 && (
          <Text fontSize="xs" color="cirqueira.musica.textoSecundario">
            Use “Buscar ou criar música” para dizer qual é, ou “Não é música” se for outra coisa
            (podcast, vídeo, ruído).
          </Text>
        )}

        {opcoes.length > 0 && (
          <VStack as="ul" align="stretch" gap={2} m={0} p={0}>
            {opcoes.map((opcao) => (
              <OpcaoSugestaoRevisao
                key={opcao.chave}
                opcao={opcao}
                ocupado={ocupado}
                onConfirmar={() => onCorrigir(video, opcao.payload)}
              />
            ))}
          </VStack>
        )}
      </VStack>

      <VStack align="stretch" gap={2}>
        <Text {...PROPS_ROTULO_SECAO}>{opcoes.length > 0 ? 'Nenhuma delas?' : 'O que fazer'}</Text>
        <SimpleGrid columns={{ base: 1, sm: compilacao ? 2 : 3 }} gap={2}>
          <Button
            {...PROPS_BOTAO_SECUNDARIO}
            disabled={ocupado}
            onClick={() => onEscolherMusica(video)}
          >
            <Search size={14} /> {compilacao ? 'Informar artistas' : 'Buscar ou criar música'}
          </Button>
          <Button
            {...PROPS_BOTAO_SECUNDARIO}
            disabled={ocupado}
            onClick={() => onMarcarMashup(video)}
          >
            <Layers size={14} /> É um mashup
          </Button>
          {compilacao && (
            <Button
              {...PROPS_BOTAO_SECUNDARIO}
              disabled={ocupado}
              onClick={() => onCorrigir(video, { acao: 'manter_compilacao' })}
            >
              <ListMusic size={14} /> Manter como compilação
            </Button>
          )}
          <Button
            {...PROPS_BOTAO_SECUNDARIO}
            color="cirqueira.musica.textoSecundario"
            disabled={ocupado}
            onClick={() => onCorrigir(video, { acao: 'nao_musica' })}
          >
            <Ban size={14} /> Não é música
          </Button>
        </SimpleGrid>
      </VStack>

      {video.canal && (
        <Flex
          gap={2}
          pt={3}
          borderTop="1px solid"
          borderColor="cirqueira.musica.cartaoElevado"
          direction={{ base: 'column', sm: 'row' }}
          align={{ base: 'stretch', sm: 'center' }}
          justify="space-between"
        >
          <HStack gap={2} align="start" minW={0}>
            <Box color="cirqueira.musica.textoSecundario" pt={0.5} flexShrink={0}>
              <Tv size={14} />
            </Box>
            <Text fontSize="xs" color="cirqueira.musica.textoSecundario" minW={0}>
              Atalho: decidir para todos os vídeos de{' '}
              <Text as="strong" color="cirqueira.musica.textoPrincipal" wordBreak="break-word">
                {video.canal}
              </Text>
            </Text>
          </HStack>
          <HStack gap={2} flexShrink={0}>
            <Button
              size="xs"
              variant="outline"
              borderRadius="full"
              borderColor="cirqueira.musica.cartaoElevado"
              color="cirqueira.musica.verde"
              flex={{ base: 1, sm: 'none' }}
              disabled={ocupado}
              onClick={() => onClassificarCanal(video.canal, 'musica')}
            >
              Sempre música
            </Button>
            <Button
              size="xs"
              variant="outline"
              borderRadius="full"
              borderColor="cirqueira.musica.cartaoElevado"
              color="cirqueira.musica.textoSecundario"
              flex={{ base: 1, sm: 'none' }}
              disabled={ocupado}
              onClick={() => onClassificarCanal(video.canal, 'nao_musica')}
            >
              Nunca música
            </Button>
          </HStack>
        </Flex>
      )}
    </VStack>
  )
})
