import {
  Badge,
  Box,
  Button,
  Checkbox,
  Flex,
  HStack,
  Image,
  Link,
  Text,
  VStack,
} from '@chakra-ui/react'
import { Ban, Check, ExternalLink, Layers, ListMusic, Search, Tv } from 'lucide-react'
import { memo } from 'react'
import type { ClassificacaoCanal, CorrecaoVideoPayload, TipoRevisao, VideoRevisao } from '../types'
import {
  alternativasSugeridas,
  confiancaVideo,
  descreverLeitura,
  formatarDuracaoVideo,
  leiturasSugeridas,
  payloadDaLeitura,
  payloadDaSugestao,
  urlVideoYoutube,
} from '../utils'

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

const PROPS_BOTAO_ACAO = {
  size: 'xs',
  variant: 'outline',
  borderRadius: 'full',
  borderColor: 'cirqueira.musica.cartaoElevado',
  color: 'cirqueira.musica.textoPrincipal',
  _hover: { bg: 'cirqueira.musica.cartaoElevado' },
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
  const sugestao = payloadDaSugestao(video)
  const leituras = leiturasSugeridas(video)
  const alternativas = alternativasSugeridas(video)
  const confianca = confiancaVideo(video)
  const versao = video.sugestaoIa?.versao ?? video.tipoVersao

  return (
    <VStack
      align="stretch"
      gap={3}
      p={{ base: 3, sm: 4 }}
      borderRadius="8px"
      bg="cirqueira.musica.cartao"
      border="1px solid"
      borderColor={selecionado ? 'cirqueira.musica.verde' : 'cirqueira.musica.cartaoElevado'}
      opacity={ocupado ? 0.6 : 1}
      aria-busy={ocupado}
    >
      <Flex gap={3} align="start">
        <Checkbox.Root
          checked={selecionado}
          onCheckedChange={() => onAlternarSelecao(video.uuid)}
          colorPalette="green"
          mt={1}
          aria-label={`Selecionar ${video.titulo}`}
        >
          <Checkbox.HiddenInput />
          <Checkbox.Control />
        </Checkbox.Root>
        <Box
          w={{ base: '96px', sm: '128px' }}
          flexShrink={0}
          borderRadius="6px"
          overflow="hidden"
          bg="cirqueira.musica.cartaoElevado"
          aspectRatio={16 / 9}
        >
          <Image src={video.miniatura} alt="" w="full" h="full" objectFit="cover" loading="lazy" />
        </Box>
        <VStack align="start" gap={1} minW={0} flex={1}>
          <Text
            fontSize="sm"
            fontWeight="semibold"
            color="cirqueira.musica.textoPrincipal"
            lineClamp={2}
          >
            {video.titulo}
          </Text>
          <HStack gap={2} fontSize="2xs" color="cirqueira.musica.textoSecundario" wrap="wrap">
            <Text>{video.canal || 'Canal desconhecido'}</Text>
            <Text>· {formatarDuracaoVideo(video.duracaoMs)}</Text>
            {!video.disponivel && (
              <Badge size="xs" bg="cirqueira.musica.cartaoElevado" color="cirqueira.musica.amarelo">
                Indisponível
              </Badge>
            )}
          </HStack>
          <Link
            href={urlVideoYoutube(video.videoId)}
            target="_blank"
            rel="noopener noreferrer"
            fontSize="2xs"
            color="cirqueira.musica.textoSecundario"
            _hover={{ color: 'cirqueira.musica.textoPrincipal' }}
          >
            <ExternalLink size={11} /> Abrir no YouTube
          </Link>
        </VStack>
      </Flex>

      {(leituras.length > 0 || video.musica) && (
        <VStack
          align="stretch"
          gap={1}
          p={2.5}
          borderRadius="6px"
          bg="cirqueira.musica.cartaoElevado"
        >
          <HStack justify="space-between" gap={2}>
            <Text
              fontSize="2xs"
              fontWeight="bold"
              textTransform="uppercase"
              color="cirqueira.musica.textoSecundario"
            >
              Sugestão
            </Text>
            {confianca !== null && (
              <Text fontSize="2xs" color="cirqueira.musica.textoSecundario">
                Confiança {confianca}%
              </Text>
            )}
          </HStack>
          {video.musica ? (
            <Text fontSize="sm" color="cirqueira.musica.textoPrincipal">
              {video.musica.titulo} —{' '}
              {video.musica.artistas.map((artista) => artista.nome).join(', ')}
            </Text>
          ) : (
            leituras.map((leitura) => (
              <Text
                key={descreverLeitura(leitura)}
                fontSize="sm"
                color="cirqueira.musica.textoPrincipal"
              >
                {descreverLeitura(leitura)}
              </Text>
            ))
          )}
        </VStack>
      )}

      {alternativas.length > 0 && (
        <VStack align="stretch" gap={1.5}>
          <Text
            fontSize="2xs"
            fontWeight="bold"
            textTransform="uppercase"
            color="cirqueira.musica.textoSecundario"
          >
            Outras leituras
          </Text>
          <HStack gap={2} wrap="wrap">
            {alternativas.map((alternativa) => (
              <Button
                key={descreverLeitura(alternativa)}
                {...PROPS_BOTAO_ACAO}
                disabled={ocupado || alternativa.artistas.length === 0}
                onClick={() => onCorrigir(video, payloadDaLeitura(alternativa, versao))}
              >
                {descreverLeitura(alternativa)}
              </Button>
            ))}
          </HStack>
        </VStack>
      )}

      <HStack gap={2} wrap="wrap">
        {sugestao && (
          <Button
            size="xs"
            borderRadius="full"
            bg="cirqueira.musica.verde"
            color="cirqueira.musica.fundo"
            _hover={{ bg: 'cirqueira.musica.verdeHover' }}
            disabled={ocupado}
            onClick={() => onCorrigir(video, sugestao)}
          >
            <Check size={12} /> Confirmar sugestão
          </Button>
        )}
        <Button {...PROPS_BOTAO_ACAO} disabled={ocupado} onClick={() => onEscolherMusica(video)}>
          <Search size={12} /> {tipo === 'compilacao' ? 'Informar artistas' : 'Escolher música'}
        </Button>
        <Button {...PROPS_BOTAO_ACAO} disabled={ocupado} onClick={() => onMarcarMashup(video)}>
          <Layers size={12} /> Marcar como mashup
        </Button>
        {tipo === 'compilacao' && (
          <Button
            {...PROPS_BOTAO_ACAO}
            disabled={ocupado}
            onClick={() => onCorrigir(video, { acao: 'manter_compilacao' })}
          >
            <ListMusic size={12} /> Manter como compilação
          </Button>
        )}
        <Button
          {...PROPS_BOTAO_ACAO}
          disabled={ocupado}
          onClick={() => onCorrigir(video, { acao: 'nao_musica' })}
        >
          <Ban size={12} /> Não é música
        </Button>
      </HStack>

      {video.canal && (
        <HStack
          gap={2}
          wrap="wrap"
          pt={1}
          borderTop="1px solid"
          borderColor="cirqueira.musica.cartaoElevado"
        >
          <Tv size={12} color="var(--chakra-colors-cirqueira-musica-textoSecundario)" />
          <Text fontSize="2xs" color="cirqueira.musica.textoSecundario">
            Este canal
          </Text>
          <Button
            size="2xs"
            variant="ghost"
            color="cirqueira.musica.verde"
            disabled={ocupado}
            onClick={() => onClassificarCanal(video.canal, 'musica')}
          >
            é sempre música
          </Button>
          <Button
            size="2xs"
            variant="ghost"
            color="cirqueira.musica.textoSecundario"
            disabled={ocupado}
            onClick={() => onClassificarCanal(video.canal, 'nao_musica')}
          >
            nunca é música
          </Button>
        </HStack>
      )}
    </VStack>
  )
})
