import { useMediaQuery } from '@/shared/hooks/useMediaQuery'
import {
  Box,
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
import { ExternalLink, History, X } from 'lucide-react'
import { memo, useState, type ReactNode } from 'react'
import type { ItemHistoricoRecente } from '../types'
import {
  formatarDataHoraPtBr,
  gerarRotaArtista,
  gerarRotaMusica,
} from '../utils'
import { CapaMusica } from './CapaMusica'
import { LinkMusica } from './LinkMusica'

const LARGURA_DESKTOP = '(min-width: 768px)'

export interface ModalHistoricoRecenteProps {
  aberto: boolean
  onFechar: () => void
  itens: ItemHistoricoRecente[]
  carregando: boolean
  erro: boolean
  corDestaque: string
  rotuloExterno: string
}

export const ModalHistoricoRecente = memo(function ModalHistoricoRecente({
  aberto,
  onFechar,
  itens,
  carregando,
  erro,
  corDestaque,
  rotuloExterno,
}: ModalHistoricoRecenteProps) {
  const isDesktop = useMediaQuery(LARGURA_DESKTOP)
  const cabecalho = (
    <HStack gap={2} minW={0}>
      <Box color={corDestaque} display="inline-flex">
        <History size={16} />
      </Box>
      <Text fontSize="md" fontWeight="bold" truncate>
        Últimas ouvidas
      </Text>
    </HStack>
  )
  const conteudo = (
    <ConteudoHistorico
      itens={itens}
      carregando={carregando}
      erro={erro}
      corDestaque={corDestaque}
      rotuloExterno={rotuloExterno}
    />
  )

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
      size="md"
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
            maxH="80dvh"
          >
            <Dialog.Header px={5} pt={4} pb={2}>
              <BarraTitulo fechar={<BotaoFechar onFechar={onFechar} />}>{cabecalho}</BarraTitulo>
            </Dialog.Header>
            <Dialog.Body px={5} pb={5} pt={2} overflowY="auto">
              {conteudo}
            </Dialog.Body>
          </Dialog.Content>
        </Dialog.Positioner>
      </Portal>
    </Dialog.Root>
  )
})

function ConteudoHistorico({
  itens,
  carregando,
  erro,
  corDestaque,
  rotuloExterno,
}: {
  itens: ItemHistoricoRecente[]
  carregando: boolean
  erro: boolean
  corDestaque: string
  rotuloExterno: string
}) {
  if (carregando) {
    return (
      <VStack align="stretch" gap={3}>
        {Array.from({ length: 5 }, (_, i) => (
          <HStack key={i} gap={3}>
            <Skeleton boxSize="48px" borderRadius="4px" />
            <VStack align="stretch" gap={1} flex={1}>
              <Skeleton h="14px" w="70%" />
              <Skeleton h="12px" w="45%" />
            </VStack>
          </HStack>
        ))}
      </VStack>
    )
  }

  if (erro) {
    return (
      <Text fontSize="sm" color="cirqueira.musica.textoSecundario">
        Não foi possível carregar o histórico recente.
      </Text>
    )
  }

  if (itens.length === 0) {
    return (
      <Text fontSize="sm" color="cirqueira.musica.textoSecundario">
        Ainda não há músicas anteriores no histórico.
      </Text>
    )
  }

  return (
    <VStack align="stretch" gap={0}>
      {itens.map((item, indice) => (
        <Box
          key={`${item.tocadaEm}-${item.codigoFaixa ?? item.videoId ?? indice}`}
          borderBottom={indice < itens.length - 1 ? '1px solid' : undefined}
          borderColor="cirqueira.musica.cartaoElevado"
        >
          <ItemHistorico
            item={item}
            corDestaque={corDestaque}
            rotuloExterno={rotuloExterno}
          />
        </Box>
      ))}
    </VStack>
  )
}

function ItemHistorico({
  item,
  corDestaque,
  rotuloExterno,
}: {
  item: ItemHistoricoRecente
  corDestaque: string
  rotuloExterno: string
}) {
  const artistaPrincipal = item.artistas[0] ?? ''
  const linkInterno = artistaPrincipal ? gerarRotaMusica(item.titulo, artistaPrincipal) : null
  const linkavel = item.identificada !== false && Boolean(artistaPrincipal)

  return (
    <HStack gap={3} py={2.5} align="center" minW={0}>
      <CapaMusica url={item.urlCapa} alt={item.titulo} boxSize="48px" borderRadius="4px" />
      <VStack align="flex-start" gap={0.5} minW={0} flex={1}>
        {linkavel && linkInterno ? (
          <Link
            asChild
            fontSize="sm"
            fontWeight="semibold"
            color="cirqueira.musica.textoPrincipal"
            lineClamp={1}
            _hover={{ textDecoration: 'underline' }}
          >
            <LinkMusica to={linkInterno}>{item.titulo}</LinkMusica>
          </Link>
        ) : (
          <Text fontSize="sm" fontWeight="semibold" lineClamp={1}>
            {item.titulo}
          </Text>
        )}
        <Text fontSize="xs" color="cirqueira.musica.textoSecundario" lineClamp={1}>
          {artistaPrincipal && linkavel ? (
            <Link asChild color="inherit" _hover={{ color: 'cirqueira.musica.textoPrincipal' }}>
              <LinkMusica to={gerarRotaArtista(artistaPrincipal)}>{artistaPrincipal}</LinkMusica>
            </Link>
          ) : (
            artistaPrincipal
          )}
          {item.artistas.length > 1 ? `, ${item.artistas.slice(1).join(', ')}` : ''}
        </Text>
        <Text fontSize="2xs" color="cirqueira.musica.textoSecundario">
          {formatarDataHoraPtBr(item.tocadaEm)}
        </Text>
      </VStack>
      {item.urlExterna && (
        <Button
          asChild
          size="2xs"
          variant="ghost"
          color="cirqueira.musica.textoSecundario"
          _hover={{ color: corDestaque, bg: 'transparent' }}
          flexShrink={0}
        >
          <Link href={item.urlExterna} target="_blank" rel="noopener noreferrer" title={rotuloExterno}>
            <ExternalLink size={14} />
          </Link>
        </Button>
      )}
    </HStack>
  )
}

function BarraTitulo({ children, fechar }: { children: ReactNode; fechar: ReactNode }) {
  return (
    <HStack justify="space-between" align="center" gap={3} w="full">
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
      onClick={onFechar}
      color="cirqueira.musica.textoSecundario"
      _hover={{ color: 'cirqueira.musica.textoPrincipal', bg: 'transparent' }}
      aria-label="Fechar"
    >
      <X size={16} />
    </Button>
  )
}

export interface BotaoHistoricoRecenteProps {
  corDestaque: string
  rotuloExterno: string
  excluirCodigo?: string | null
  excluirVideoId?: string | null
  buscar: (params: {
    excluirCodigo?: string | null
    excluirVideoId?: string | null
  }) => Promise<ItemHistoricoRecente[]>
}

export const BotaoHistoricoRecente = memo(function BotaoHistoricoRecente({
  corDestaque,
  rotuloExterno,
  excluirCodigo,
  excluirVideoId,
  buscar,
}: BotaoHistoricoRecenteProps) {
  const [aberto, setAberto] = useState(false)
  const [itens, setItens] = useState<ItemHistoricoRecente[]>([])
  const [carregando, setCarregando] = useState(false)
  const [erro, setErro] = useState(false)

  async function abrir() {
    setAberto(true)
    setCarregando(true)
    setErro(false)
    try {
      const lista = await buscar({ excluirCodigo, excluirVideoId })
      setItens(lista)
    } catch {
      setErro(true)
      setItens([])
    } finally {
      setCarregando(false)
    }
  }

  return (
    <>
      <Button
        size="2xs"
        variant="ghost"
        color="cirqueira.musica.textoSecundario"
        _hover={{ color: corDestaque, bg: 'transparent' }}
        onClick={() => void abrir()}
        aria-label="Ver últimas ouvidas"
        title="Últimas ouvidas"
      >
        <History size={14} />
      </Button>
      <ModalHistoricoRecente
        aberto={aberto}
        onFechar={() => setAberto(false)}
        itens={itens}
        carregando={carregando}
        erro={erro}
        corDestaque={corDestaque}
        rotuloExterno={rotuloExterno}
      />
    </>
  )
})
