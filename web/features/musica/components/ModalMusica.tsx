import { useMediaQuery } from '@/shared/hooks/useMediaQuery'
import {
  Button,
  Dialog,
  Drawer,
  HStack,
  Link,
  Portal,
  Skeleton,
  Text,
  VStack,
} from '@chakra-ui/react'
import { ArrowRight, X } from 'lucide-react'
import { type ReactNode, memo } from 'react'
import type { PeriodoMusicasItem } from '../api'
import { useVersoesParaTocar } from '../hooks'
import type { ItemRankingMusica } from '../types'
import { formatarNumeroPtBr, gerarRotaMusica } from '../utils'
import { BotaoTocarVariante, BotoesTocarMusica } from './BotoesTocarMusica'
import { CapaMusica } from './CapaMusica'
import { DivisaoFontesMusica } from './DivisaoFontesMusica'
import { LinkMusica } from './LinkMusica'
import { ListaVersoesMusica } from './ListaVersoesMusica'
import { MinutosMusica } from './MinutosMusica'

const LARGURA_DESKTOP = '(min-width: 768px)'

export interface ModalMusicaProps {
  aberto: boolean
  onFechar: () => void
  item: ItemRankingMusica
  imagemUrl: string | null | undefined
  periodo: PeriodoMusicasItem | null
}

export const ModalMusica = memo(function ModalMusica({
  aberto,
  onFechar,
  item,
  imagemUrl,
  periodo,
}: ModalMusicaProps) {
  const isDesktop = useMediaQuery(LARGURA_DESKTOP)
  const conteudo = <ConteudoModalMusica item={item} periodo={periodo} aberto={aberto} />
  const cabecalho = <CabecalhoModalMusica item={item} imagemUrl={imagemUrl} />

  if (!isDesktop) {
    return (
      <Drawer.Root
        open={aberto}
        onOpenChange={(detalhes) => !detalhes.open && onFechar()}
        placement="bottom"
      >
        <Portal>
          <Drawer.Backdrop bg="blackAlpha.800" backdropFilter="blur(4px)" />
          <Drawer.Positioner>
            <Drawer.Content
              data-theme="dark"
              bg="cirqueira.musica.cartao"
              borderTop="1px solid"
              borderColor="cirqueira.musica.cartaoElevado"
              borderTopRadius="16px"
              p={4}
              maxH="90dvh"
              display="flex"
              flexDirection="column"
              color="cirqueira.musica.textoPrincipal"
            >
              <Drawer.Header p={0} mb={3}>
                <BarraTitulo fechar={<BotaoFechar onFechar={onFechar} />}>{cabecalho}</BarraTitulo>
              </Drawer.Header>
              <Drawer.Body p={0} overflowY="auto">
                {conteudo}
              </Drawer.Body>
            </Drawer.Content>
          </Drawer.Positioner>
        </Portal>
      </Drawer.Root>
    )
  }

  return (
    <Dialog.Root
      open={aberto}
      onOpenChange={(evento) => !evento.open && onFechar()}
      scrollBehavior="inside"
      placement="center"
      size="lg"
    >
      <Portal>
        <Dialog.Backdrop bg="blackAlpha.800" backdropFilter="blur(4px)" />
        <Dialog.Positioner>
          <Dialog.Content
            data-theme="dark"
            bg="cirqueira.musica.cartao"
            border="1px solid"
            borderColor="cirqueira.musica.cartaoElevado"
            borderRadius="8px"
            color="cirqueira.musica.textoPrincipal"
            fontFamily="inter"
            maxW="lg"
            maxH="80vh"
            my="auto"
          >
            <Dialog.Header px={6} pt={6} pb={3}>
              <BarraTitulo fechar={<BotaoFechar onFechar={onFechar} />}>{cabecalho}</BarraTitulo>
            </Dialog.Header>
            <Dialog.Body px={6} pb={6} overflowY="auto" flex="1" minH={0}>
              {conteudo}
            </Dialog.Body>
          </Dialog.Content>
        </Dialog.Positioner>
      </Portal>
    </Dialog.Root>
  )
})

function BarraTitulo({ children, fechar }: { children: ReactNode; fechar: ReactNode }) {
  return (
    <HStack align="flex-start" justify="space-between" gap={3} w="full">
      {children}
      {fechar}
    </HStack>
  )
}

function BotaoFechar({ onFechar }: { onFechar: () => void }) {
  return (
    <Button
      size="xs"
      variant="ghost"
      borderRadius="full"
      color="cirqueira.musica.textoSecundario"
      _hover={{ color: 'cirqueira.musica.textoPrincipal', bg: 'cirqueira.musica.cartaoElevado' }}
      aria-label="Fechar"
      onClick={onFechar}
      flexShrink={0}
    >
      <X size={16} />
    </Button>
  )
}

function CabecalhoModalMusica({
  item,
  imagemUrl,
}: {
  item: ItemRankingMusica
  imagemUrl: string | null | undefined
}) {
  return (
    <HStack gap={3} minW={0} flex={1} align="center">
      <CapaMusica url={imagemUrl} alt={item.nomeFaixa} boxSize="64px" borderRadius="6px" />
      <VStack align="flex-start" gap={0.5} minW={0} flex={1}>
        <Text fontSize="lg" fontWeight="bold" truncate maxW="full">
          {item.nomeFaixa}
        </Text>
        <Text fontSize="xs" color="cirqueira.musica.textoSecundario" truncate maxW="full">
          {(item.artistas ?? [item.artistaPrincipal]).join(', ')}
          {item.album ? ` • ${item.album}` : ''}
        </Text>
      </VStack>
    </HStack>
  )
}

interface ConteudoModalMusicaProps {
  item: ItemRankingMusica
  periodo: PeriodoMusicasItem | null
  aberto: boolean
}

function ConteudoModalMusica({ item, periodo, aberto }: ConteudoModalMusicaProps) {
  const { data, isLoading, isError } = useVersoesParaTocar(item.musicaUuid, periodo, aberto)
  const variantes = data?.variantes ?? []

  return (
    <VStack align="stretch" gap={4}>
      <VStack align="flex-start" gap={1}>
        <Text fontSize="sm" color="cirqueira.musica.textoSecundario">
          Neste período:{' '}
          <Text as="span" fontWeight="bold" color="cirqueira.musica.verde">
            {formatarNumeroPtBr(item.totalStreams)} {item.totalStreams === 1 ? 'stream' : 'streams'}
          </Text>
          {' · '}
          <MinutosMusica
            minutos={item.totalMinutos}
            porFonte={item.porFonte}
            estimado={item.estimado}
          />
        </Text>
        <DivisaoFontesMusica porFonte={item.porFonte} />
      </VStack>

      {isLoading ? (
        <Skeleton h="40px" borderRadius="full" />
      ) : (
        <BotoesTocarMusica
          titulo={item.nomeFaixa}
          artista={item.artistaPrincipal}
          variantes={variantes}
          codigoSpotify={item.codigoFaixa}
        />
      )}

      {item.musicaUuid && (
        <VStack align="stretch" gap={1.5}>
          <Text
            fontSize="2xs"
            fontWeight="bold"
            textTransform="uppercase"
            letterSpacing="wide"
            color="cirqueira.musica.textoSecundario"
          >
            Versões que você ouviu neste período
          </Text>
          {isLoading ? (
            <VStack gap={1.5} align="stretch">
              <Skeleton h="56px" borderRadius="6px" />
              <Skeleton h="56px" borderRadius="6px" />
            </VStack>
          ) : isError ? (
            <Text fontSize="xs" color="cirqueira.musica.textoSecundario">
              Não foi possível carregar as versões.
            </Text>
          ) : (
            <ListaVersoesMusica
              variantes={variantes}
              acaoFinal={(variante) =>
                variante.codigo ? (
                  <BotaoTocarVariante variante={variante} artista={item.artistaPrincipal} />
                ) : null
              }
            />
          )}
        </VStack>
      )}

      <Link
        asChild
        alignSelf="flex-start"
        fontSize="sm"
        fontWeight="semibold"
        color="cirqueira.musica.verde"
        _hover={{ color: 'cirqueira.musica.verdeHover' }}
      >
        <LinkMusica to={gerarRotaMusica(item.nomeFaixa, item.artistaPrincipal, item.musicaUuid)}>
          <HStack as="span" gap={1}>
            Ver detalhes completos
            <ArrowRight size={14} />
          </HStack>
        </LinkMusica>
      </Link>
    </VStack>
  )
}
