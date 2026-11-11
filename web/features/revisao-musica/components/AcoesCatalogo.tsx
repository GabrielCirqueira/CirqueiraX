import { gerarRotaArtista, gerarRotaMusica } from '@/features/musica/utils'
import { Button, HStack, Text, VStack } from '@chakra-ui/react'
import { Merge, Scissors } from 'lucide-react'
import { memo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useSepararVideo, useUnirArtistas, useUnirMusicas } from '../hooks'
import type { ArtistaCatalogo, MusicaCatalogo } from '../types'
import { nomesArtistasCatalogo } from '../utils'
import { BuscaArtistaCatalogo, BuscaMusicaCatalogo } from './BuscaCatalogo'
import { JanelaRevisaoMusica } from './JanelaRevisaoMusica'

const PROPS_BOTAO = {
  size: 'xs',
  variant: 'outline',
  borderRadius: 'full',
  borderColor: 'cirqueira.musica.cartaoElevado',
  color: 'cirqueira.musica.textoSecundario',
  _hover: { bg: 'cirqueira.musica.cartaoElevado', color: 'cirqueira.musica.textoPrincipal' },
} as const

interface RodapeUniaoProps {
  salvando: boolean
  habilitado: boolean
  onCancelar: () => void
  onConfirmar: () => void
}

function RodapeUniao({ salvando, habilitado, onCancelar, onConfirmar }: RodapeUniaoProps) {
  return (
    <HStack gap={3} justify="flex-end" w="full">
      <Button variant="ghost" borderRadius="full" onClick={onCancelar} disabled={salvando}>
        Cancelar
      </Button>
      <Button
        borderRadius="full"
        bg="cirqueira.musica.verde"
        color="cirqueira.musica.fundo"
        _hover={{ bg: 'cirqueira.musica.verdeHover' }}
        disabled={!habilitado}
        loading={salvando}
        onClick={onConfirmar}
      >
        Unir
      </Button>
    </HStack>
  )
}

export interface BotaoUnirMusicaProps {
  musicaUuid: string
  titulo: string
}

export const BotaoUnirMusica = memo(function BotaoUnirMusica({
  musicaUuid,
  titulo,
}: BotaoUnirMusicaProps) {
  const [aberto, setAberto] = useState(false)
  const [destino, setDestino] = useState<MusicaCatalogo | null>(null)
  const unir = useUnirMusicas()
  const navegar = useNavigate()

  function fechar() {
    setAberto(false)
    setDestino(null)
  }

  function confirmar() {
    if (!destino) return
    unir.mutate(
      { origemUuid: musicaUuid, destinoUuid: destino.uuid },
      {
        onSuccess: (musica) => {
          fechar()
          navegar(gerarRotaMusica(musica.titulo, nomesArtistasCatalogo(musica), musica.uuid))
        },
      }
    )
  }

  return (
    <>
      <Button {...PROPS_BOTAO} onClick={() => setAberto(true)}>
        <Merge size={12} /> Unir com outra música…
      </Button>
      {aberto && (
        <JanelaRevisaoMusica
          aberto
          titulo="Unir com outra música"
          onFechar={fechar}
          rodape={
            <RodapeUniao
              salvando={unir.isPending}
              habilitado={destino !== null}
              onCancelar={fechar}
              onConfirmar={confirmar}
            />
          }
        >
          <VStack align="stretch" gap={3}>
            <Text fontSize="xs" color="cirqueira.musica.textoSecundario">
              As reproduções de “{titulo}” passam a contar para a música escolhida. Dá para separar
              depois.
            </Text>
            <BuscaMusicaCatalogo
              selecionada={destino}
              ignorarUuid={musicaUuid}
              onEscolher={setDestino}
            />
          </VStack>
        </JanelaRevisaoMusica>
      )}
    </>
  )
})

export interface BotaoUnirArtistaProps {
  artistaUuid: string
  nome: string
}

export const BotaoUnirArtista = memo(function BotaoUnirArtista({
  artistaUuid,
  nome,
}: BotaoUnirArtistaProps) {
  const [aberto, setAberto] = useState(false)
  const [destino, setDestino] = useState<ArtistaCatalogo | null>(null)
  const unir = useUnirArtistas()
  const navegar = useNavigate()

  function fechar() {
    setAberto(false)
    setDestino(null)
  }

  function confirmar() {
    if (!destino) return
    unir.mutate(
      { origemUuid: artistaUuid, destinoUuid: destino.uuid },
      {
        onSuccess: (artista) => {
          fechar()
          navegar(gerarRotaArtista(artista.nome, artista.uuid))
        },
      }
    )
  }

  return (
    <>
      <Button {...PROPS_BOTAO} onClick={() => setAberto(true)}>
        <Merge size={12} /> Unir com outro artista
      </Button>
      {aberto && (
        <JanelaRevisaoMusica
          aberto
          titulo="Unir com outro artista"
          onFechar={fechar}
          rodape={
            <RodapeUniao
              salvando={unir.isPending}
              habilitado={destino !== null}
              onCancelar={fechar}
              onConfirmar={confirmar}
            />
          }
        >
          <VStack align="stretch" gap={3}>
            <Text fontSize="xs" color="cirqueira.musica.textoSecundario">
              “{nome}” vira um apelido do artista escolhido e as reproduções passam a contar para
              ele.
            </Text>
            <BuscaArtistaCatalogo
              selecionado={destino}
              ignorarUuid={artistaUuid}
              onEscolher={setDestino}
            />
          </VStack>
        </JanelaRevisaoMusica>
      )}
    </>
  )
})

export interface BotaoSepararVersaoProps {
  videoUuid: string
}

export const BotaoSepararVersao = memo(function BotaoSepararVersao({
  videoUuid,
}: BotaoSepararVersaoProps) {
  const separar = useSepararVideo()

  return (
    <Button
      size="2xs"
      variant="ghost"
      color="cirqueira.musica.textoSecundario"
      _hover={{ color: 'cirqueira.musica.textoPrincipal' }}
      loading={separar.isPending}
      disabled={separar.isSuccess}
      onClick={() => separar.mutate(videoUuid)}
    >
      <Scissors size={11} /> Separar esta versão
    </Button>
  )
})
