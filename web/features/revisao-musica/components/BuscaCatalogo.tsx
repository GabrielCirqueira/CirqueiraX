import { Box, Button, Input, Skeleton, Text, VStack } from '@chakra-ui/react'
import { Check } from 'lucide-react'
import { memo, useState } from 'react'
import { useBuscaArtistasCatalogo, useBuscaMusicasCatalogo } from '../hooks'
import type { ArtistaCatalogo, MusicaCatalogo } from '../types'
import { buscaValida, nomesArtistasCatalogo } from '../utils'

interface ResultadoBuscaProps<T> {
  termo: string
  carregando: boolean
  itens: T[] | undefined
  chave: (item: T) => string
  titulo: (item: T) => string
  detalhe: (item: T) => string
  selecionado: string | null
  ignorar?: string | null
  onEscolher: (item: T) => void
}

function ResultadoBusca<T>({
  termo,
  carregando,
  itens,
  chave,
  titulo,
  detalhe,
  selecionado,
  ignorar,
  onEscolher,
}: ResultadoBuscaProps<T>) {
  if (!buscaValida(termo)) {
    return (
      <Text fontSize="xs" color="cirqueira.musica.textoDesabilitado">
        Digite pelo menos 2 letras.
      </Text>
    )
  }

  if (carregando) {
    return (
      <VStack align="stretch" gap={1.5}>
        <Skeleton h="44px" borderRadius="6px" />
        <Skeleton h="44px" borderRadius="6px" />
      </VStack>
    )
  }

  const visiveis = (itens ?? []).filter((item) => chave(item) !== ignorar)

  if (visiveis.length === 0) {
    return (
      <Text fontSize="xs" color="cirqueira.musica.textoSecundario">
        Nada encontrado no seu catálogo.
      </Text>
    )
  }

  return (
    <VStack align="stretch" gap={1.5} role="listbox" aria-label="Resultados da busca">
      {visiveis.map((item) => {
        const ativo = chave(item) === selecionado
        return (
          <Button
            key={chave(item)}
            role="option"
            aria-selected={ativo}
            variant="ghost"
            h="auto"
            py={2}
            px={3}
            justifyContent="space-between"
            borderRadius="6px"
            bg={ativo ? 'cirqueira.musica.cartaoElevado' : 'transparent'}
            border="1px solid"
            borderColor={ativo ? 'cirqueira.musica.verde' : 'cirqueira.musica.cartaoElevado'}
            _hover={{ bg: 'cirqueira.musica.cartaoElevado' }}
            onClick={() => onEscolher(item)}
          >
            <VStack align="start" gap={0} minW={0} flex={1}>
              <Text
                fontSize="sm"
                fontWeight="semibold"
                color="cirqueira.musica.textoPrincipal"
                truncate
                maxW="full"
              >
                {titulo(item)}
              </Text>
              <Text fontSize="2xs" color="cirqueira.musica.textoSecundario" truncate maxW="full">
                {detalhe(item)}
              </Text>
            </VStack>
            {ativo && (
              <Box color="cirqueira.musica.verde" flexShrink={0}>
                <Check size={16} />
              </Box>
            )}
          </Button>
        )
      })}
    </VStack>
  )
}

export interface BuscaMusicaCatalogoProps {
  selecionada: MusicaCatalogo | null
  ignorarUuid?: string | null
  ignorarUuids?: string[]
  termoInicial?: string
  onEscolher: (musica: MusicaCatalogo) => void
}

export const BuscaMusicaCatalogo = memo(function BuscaMusicaCatalogo({
  selecionada,
  ignorarUuid = null,
  ignorarUuids = [],
  termoInicial = '',
  onEscolher,
}: BuscaMusicaCatalogoProps) {
  const [termo, setTermo] = useState(termoInicial)
  const { data, isFetching } = useBuscaMusicasCatalogo(termo)

  return (
    <VStack align="stretch" gap={3}>
      <Input
        autoFocus
        value={termo}
        onChange={(evento) => setTermo(evento.target.value)}
        placeholder="Buscar por título ou artista"
        aria-label="Buscar música no catálogo"
        bg="cirqueira.musica.fundo"
        borderColor="cirqueira.musica.cartaoElevado"
      />
      <ResultadoBusca
        termo={termo}
        carregando={isFetching && !data}
        itens={data?.filter((musica) => !ignorarUuids.includes(musica.uuid))}
        chave={(musica) => musica.uuid}
        titulo={(musica) => musica.titulo}
        detalhe={(musica) => nomesArtistasCatalogo(musica) || 'Sem artista'}
        selecionado={selecionada?.uuid ?? null}
        ignorar={ignorarUuid}
        onEscolher={onEscolher}
      />
    </VStack>
  )
})

export interface BuscaArtistaCatalogoProps {
  selecionado: ArtistaCatalogo | null
  ignorarUuid?: string | null
  onEscolher: (artista: ArtistaCatalogo) => void
}

export const BuscaArtistaCatalogo = memo(function BuscaArtistaCatalogo({
  selecionado,
  ignorarUuid = null,
  onEscolher,
}: BuscaArtistaCatalogoProps) {
  const [termo, setTermo] = useState('')
  const { data, isFetching } = useBuscaArtistasCatalogo(termo)

  return (
    <VStack align="stretch" gap={3}>
      <Input
        autoFocus
        value={termo}
        onChange={(evento) => setTermo(evento.target.value)}
        placeholder="Buscar artista"
        aria-label="Buscar artista no catálogo"
        bg="cirqueira.musica.fundo"
        borderColor="cirqueira.musica.cartaoElevado"
      />
      <ResultadoBusca
        termo={termo}
        carregando={isFetching && !data}
        itens={data}
        chave={(artista) => artista.uuid}
        titulo={(artista) => artista.nome}
        detalhe={() => 'Artista do catálogo'}
        selecionado={selecionado?.uuid ?? null}
        ignorar={ignorarUuid}
        onEscolher={onEscolher}
      />
    </VStack>
  )
})
