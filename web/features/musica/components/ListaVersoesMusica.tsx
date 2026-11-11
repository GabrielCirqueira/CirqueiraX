import { Badge, HStack, Link, Text, VStack } from '@chakra-ui/react'
import { ExternalLink } from 'lucide-react'
import { type ReactNode, memo } from 'react'
import type { ComponenteMashup, VarianteMusica } from '../types'
import { formatarNumeroPtBr, gerarRotaMusica, rotuloTipoVersao } from '../utils'
import { IconeFonteMusica } from './IconeFonteMusica'
import { LinkMusica } from './LinkMusica'
import { MinutosMusica } from './MinutosMusica'

export interface ListaVersoesMusicaProps {
  variantes: VarianteMusica[]
  acaoVariante?: (variante: VarianteMusica) => ReactNode
}

export const ListaVersoesMusica = memo(function ListaVersoesMusica({
  variantes,
  acaoVariante,
}: ListaVersoesMusicaProps) {
  if (variantes.length === 0) {
    return (
      <Text fontSize="xs" color="cirqueira.musica.textoDesabilitado">
        Nenhuma versão neste período.
      </Text>
    )
  }

  return (
    <VStack align="stretch" gap={1.5}>
      {variantes.map((variante) => (
        <HStack
          key={`${variante.fonte}-${variante.codigo ?? variante.titulo}-${variante.canal}`}
          gap={2}
          p={2}
          borderRadius="6px"
          bg="cirqueira.musica.cartaoElevado"
          align="center"
        >
          <IconeFonteMusica fonte={variante.fonte} />
          <VStack align="start" gap={0} flex={1} minW={0}>
            <Text
              fontSize="xs"
              fontWeight="semibold"
              color="cirqueira.musica.textoPrincipal"
              truncate
              maxW="full"
            >
              {variante.titulo}
            </Text>
            <HStack gap={1.5} minW={0} maxW="full">
              <Badge size="xs" variant="subtle" colorPalette="gray" flexShrink={0}>
                {rotuloTipoVersao(variante.tipoVersao)}
              </Badge>
              <Text fontSize="2xs" color="cirqueira.musica.textoSecundario" truncate>
                {variante.canal}
              </Text>
              {acaoVariante?.(variante)}
            </HStack>
          </VStack>
          <VStack
            align="end"
            gap={0}
            flexShrink={0}
            fontSize="2xs"
            color="cirqueira.musica.textoSecundario"
          >
            <Text fontWeight="bold" color="cirqueira.musica.verde">
              {formatarNumeroPtBr(variante.streams)}x
            </Text>
            <MinutosMusica
              minutos={variante.minutos}
              estimado={variante.fonte === 'youtube_music'}
            />
          </VStack>
          {variante.url && (
            <Link
              href={variante.url}
              target="_blank"
              rel="noopener noreferrer"
              color="cirqueira.musica.textoSecundario"
              _hover={{ color: 'cirqueira.musica.verde' }}
              aria-label={
                variante.fonte === 'youtube_music' ? 'Abrir no YouTube Music' : 'Abrir no Spotify'
              }
              flexShrink={0}
            >
              <ExternalLink size={14} />
            </Link>
          )}
        </HStack>
      ))}
    </VStack>
  )
})

export interface ListaComponentesMashupProps {
  componentes: ComponenteMashup[]
  artistas: string[]
}

export const ListaComponentesMashup = memo(function ListaComponentesMashup({
  componentes,
  artistas,
}: ListaComponentesMashupProps) {
  return (
    <VStack align="stretch" gap={1.5}>
      {componentes.map((componente) => (
        <HStack
          key={componente.texto}
          gap={2}
          fontSize="xs"
          color="cirqueira.musica.textoPrincipal"
        >
          <Text color="cirqueira.musica.textoDesabilitado">•</Text>
          {componente.musicaUuid ? (
            <Link asChild color="cirqueira.musica.textoPrincipal" fontWeight="semibold">
              <LinkMusica
                to={gerarRotaMusica(
                  componente.titulo ?? componente.texto,
                  '',
                  componente.musicaUuid
                )}
              >
                {componente.titulo ?? componente.texto}
              </LinkMusica>
            </Link>
          ) : (
            <Text>{componente.texto}</Text>
          )}
        </HStack>
      ))}
      {artistas.length > 0 && (
        <Text fontSize="2xs" color="cirqueira.musica.textoSecundario">
          Artistas creditados: {artistas.join(', ')}
        </Text>
      )}
    </VStack>
  )
})
