import { CapaMusica } from '@/features/musica/components/CapaMusica'
import { LinkMusica } from '@/features/musica/components/LinkMusica'
import { Button, Flex, HStack, Link, Text, VStack } from '@chakra-ui/react'
import { Check, Info, Music2, Play, Sparkles } from 'lucide-react'
import { memo } from 'react'
import type { OpcaoLeituraVideo } from '../utils'

export interface OpcaoSugestaoRevisaoProps {
  opcao: OpcaoLeituraVideo
  ocupado: boolean
  onConfirmar: () => void
}

const PROPS_PILULA = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 1,
  px: 2,
  py: 0.5,
  borderRadius: 'full',
  fontSize: '2xs',
  fontWeight: 'semibold',
  bg: 'cirqueira.musica.fundo',
  color: 'cirqueira.musica.textoSecundario',
  textDecoration: 'none',
  _hover: { color: 'cirqueira.musica.verde' },
} as const

const PROPS_LINK = { ...PROPS_PILULA, target: '_blank', rel: 'noopener noreferrer' } as const

export const OpcaoSugestaoRevisao = memo(function OpcaoSugestaoRevisao({
  opcao,
  ocupado,
  onConfirmar,
}: OpcaoSugestaoRevisaoProps) {
  return (
    <Flex
      as="li"
      listStyleType="none"
      gap={3}
      align="center"
      wrap="wrap"
      px={3}
      py={2.5}
      borderRadius="8px"
      bg="cirqueira.musica.cartaoElevado"
      border="1px solid"
      borderColor={opcao.sugerida ? 'cirqueira.musica.verde' : 'cirqueira.musica.cartaoElevado'}
      minW={0}
    >
      <CapaMusica url={opcao.urlCapa} alt={opcao.titulo} tipo="faixa" w="48px" h="48px" />
      <VStack align="start" gap={1} flex="1 1 160px" minW={0}>
        <Text
          fontSize="sm"
          fontWeight="semibold"
          color="cirqueira.musica.textoPrincipal"
          lineClamp={2}
          wordBreak="break-word"
        >
          {opcao.titulo}
        </Text>
        <Text fontSize="xs" color="cirqueira.musica.textoSecundario" lineClamp={1}>
          {opcao.detalhe}
        </Text>
        <HStack gap={1.5} wrap="wrap">
          {opcao.sugerida && (
            <HStack gap={0.5} fontSize="2xs" fontWeight="bold" color="cirqueira.musica.verde">
              <Sparkles size={11} />
              <Text>Sugerida</Text>
            </HStack>
          )}
          <Link
            href={opcao.urlYoutube}
            {...PROPS_LINK}
            aria-label={`Ouvir ${opcao.titulo} no YouTube`}
          >
            <Play size={11} /> YouTube
          </Link>
          <Link
            href={opcao.urlSpotify}
            {...PROPS_LINK}
            aria-label={`Ver ${opcao.titulo} no Spotify`}
          >
            <Music2 size={11} /> Spotify
          </Link>
          {opcao.rotaMusica && (
            <LinkMusica to={opcao.rotaMusica}>
              <HStack as="span" {...PROPS_PILULA}>
                <Info size={11} /> Ver música
              </HStack>
            </LinkMusica>
          )}
        </HStack>
      </VStack>
      <Button
        size="xs"
        flexShrink={0}
        w={{ base: 'full', sm: 'auto' }}
        borderRadius="full"
        fontWeight="bold"
        disabled={ocupado}
        onClick={onConfirmar}
        bg={opcao.sugerida ? 'cirqueira.musica.verde' : 'transparent'}
        color={opcao.sugerida ? 'cirqueira.musica.fundo' : 'cirqueira.musica.textoPrincipal'}
        border="1px solid"
        borderColor={
          opcao.sugerida ? 'cirqueira.musica.verde' : 'cirqueira.musica.textoDesabilitado'
        }
        _hover={{ borderColor: 'cirqueira.musica.verde' }}
        aria-label={`Confirmar: ${opcao.titulo} — ${opcao.detalhe}`}
      >
        <Check size={12} /> É esta
      </Button>
    </Flex>
  )
})
