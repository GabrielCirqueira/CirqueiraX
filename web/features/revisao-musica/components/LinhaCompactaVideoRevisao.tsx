import { Badge, Box, Button, Checkbox, Flex, HStack, Link, Text, VStack } from '@chakra-ui/react'
import { Ban, Check, ExternalLink, Search } from 'lucide-react'
import { memo } from 'react'
import type { CorrecaoVideoPayload, VideoRevisao } from '../types'
import {
  confiancaVideo,
  formatarDuracaoVideo,
  nivelConfianca,
  opcoesLeituraVideo,
  payloadAceitarSugestao,
  rotuloVersao,
  sugereNaoMusica,
  tratarTecladoRevisao,
  urlVideoYoutube,
} from '../utils'
import { MiniaturaVideoRevisao } from './MiniaturaVideoRevisao'

const LARGURA_MINIATURA = { base: '64px', sm: '88px' }

export interface LinhaCompactaVideoRevisaoProps {
  video: VideoRevisao
  selecionado: boolean
  ocupado: boolean
  onAlternarSelecao: (uuid: string) => void
  onCorrigir: (video: VideoRevisao, payload: CorrecaoVideoPayload) => void
  onEscolherMusica: (video: VideoRevisao) => void
}

export const LinhaCompactaVideoRevisao = memo(function LinhaCompactaVideoRevisao({
  video,
  selecionado,
  ocupado,
  onAlternarSelecao,
  onCorrigir,
  onEscolherMusica,
}: LinhaCompactaVideoRevisaoProps) {
  const [sugerida] = opcoesLeituraVideo(video)
  const aceitar = payloadAceitarSugestao(video)
  const naoMusica = sugereNaoMusica(video)
  const confianca = nivelConfianca(confiancaVideo(video))
  const versao = rotuloVersao(video.sugestaoIa?.versao ?? video.tipoVersao)

  return (
    <Flex
      as="article"
      tabIndex={0}
      gap={3}
      align="center"
      p={2.5}
      borderRadius="10px"
      bg="cirqueira.musica.cartao"
      border="1px solid"
      borderColor={selecionado ? 'cirqueira.musica.verde' : 'cirqueira.musica.cartaoElevado'}
      opacity={ocupado ? 0.6 : 1}
      aria-busy={ocupado}
      minW={0}
      outline="none"
      _focusVisible={{
        borderColor: 'cirqueira.musica.azul',
        boxShadow: '0 0 0 1px var(--chakra-colors-cirqueira-musica-azul)',
      }}
      onKeyDown={(evento) =>
        tratarTecladoRevisao(evento, {
          aceitar: aceitar ? () => onCorrigir(video, aceitar) : undefined,
          naoMusica: () => onCorrigir(video, { acao: 'nao_musica' }),
          buscar: () => onEscolherMusica(video),
          selecionar: () => onAlternarSelecao(video.uuid),
        })
      }
    >
      <Checkbox.Root
        checked={selecionado}
        onCheckedChange={() => onAlternarSelecao(video.uuid)}
        colorPalette="green"
        size="sm"
        flexShrink={0}
        aria-label={`Selecionar ${video.titulo}`}
      >
        <Checkbox.HiddenInput />
        <Checkbox.Control borderColor="cirqueira.musica.textoSecundario" />
      </Checkbox.Root>

      <MiniaturaVideoRevisao
        imagem={video.miniatura}
        videoId={video.videoId}
        titulo={video.titulo}
        largura={LARGURA_MINIATURA}
      />

      <VStack align="stretch" gap={0.5} minW={0} flex={1}>
        <Text fontSize="sm" fontWeight="semibold" color="cirqueira.musica.textoPrincipal" truncate>
          {video.titulo}
        </Text>
        <Text fontSize="2xs" color="cirqueira.musica.textoSecundario" truncate>
          {video.canal || 'Canal desconhecido'} · {formatarDuracaoVideo(video.duracaoMs)}
        </Text>
        <HStack gap={1.5} minW={0}>
          {naoMusica ? (
            <Text fontSize="xs" color="cirqueira.musica.amarelo" truncate>
              IA: não é música
            </Text>
          ) : sugerida ? (
            <Text fontSize="xs" color="cirqueira.musica.verde" truncate minW={0}>
              → {sugerida.titulo}
              {sugerida.detalhe ? ` · ${sugerida.detalhe}` : ''}
            </Text>
          ) : (
            <Text fontSize="xs" color="cirqueira.musica.textoDesabilitado" truncate>
              Sem sugestão
            </Text>
          )}
          {confianca && (aceitar || naoMusica) && (
            <Text fontSize="2xs" fontWeight="semibold" color={confianca.cor} flexShrink={0}>
              {confianca.rotulo}
            </Text>
          )}
          {versao && (
            <Badge
              size="xs"
              bg="cirqueira.musica.cartaoElevado"
              color="cirqueira.musica.azul"
              flexShrink={0}
            >
              {versao}
            </Badge>
          )}
        </HStack>
      </VStack>

      <HStack
        gap={1}
        flexShrink={0}
        wrap={{ base: 'wrap', sm: 'nowrap' }}
        justify="end"
        maxW={{ base: '96px', sm: 'none' }}
      >
        <Button
          size="xs"
          borderRadius="full"
          bg="cirqueira.musica.verde"
          color="cirqueira.musica.fundo"
          _hover={{ bg: 'cirqueira.musica.verdeHover' }}
          disabled={ocupado || !aceitar}
          title="Aceitar sugestão (A)"
          aria-label="Aceitar sugestão"
          onClick={() => aceitar && onCorrigir(video, aceitar)}
        >
          <Check size={12} />
        </Button>
        <Button
          size="xs"
          variant="outline"
          borderRadius="full"
          borderColor="cirqueira.musica.cartaoElevado"
          color="cirqueira.musica.textoPrincipal"
          disabled={ocupado}
          title="Buscar ou criar música (B)"
          aria-label="Buscar ou criar música"
          onClick={() => onEscolherMusica(video)}
        >
          <Search size={12} />
        </Button>
        <Button
          size="xs"
          variant="outline"
          borderRadius="full"
          borderColor="cirqueira.musica.cartaoElevado"
          color="cirqueira.musica.textoSecundario"
          disabled={ocupado}
          title="Não é música (N)"
          aria-label="Não é música"
          onClick={() => onCorrigir(video, { acao: 'nao_musica' })}
        >
          <Ban size={12} />
        </Button>
        {video.videoId && (
          <Box display={{ base: 'none', sm: 'block' }}>
            <Link
              href={urlVideoYoutube(video.videoId)}
              target="_blank"
              rel="noopener noreferrer"
              display="inline-flex"
              p={1.5}
              borderRadius="full"
              color="cirqueira.musica.textoSecundario"
              _hover={{ color: 'cirqueira.musica.verde' }}
              aria-label="Abrir no YouTube"
              title="Abrir no YouTube"
            >
              <ExternalLink size={13} />
            </Link>
          </Box>
        )}
      </HStack>
    </Flex>
  )
})
