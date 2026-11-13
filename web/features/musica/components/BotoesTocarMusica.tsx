import { Button, IconButton, SimpleGrid } from '@chakra-ui/react'
import { Play, Search } from 'lucide-react'
import { memo } from 'react'
import { useExtensaoNoNavegador, useTocarMusica } from '../hooks'
import type { VarianteMusica } from '../types'
import {
  type AlvoTocar,
  CORES_FONTE_REPRODUCAO,
  alvoDaVariante,
  isCodigoTocavel,
  montarAlvosTocar,
  rotuloBotaoTocar,
} from '../utils'
import { IconeFonteMusica } from './IconeFonteMusica'

export interface BotoesTocarMusicaProps {
  titulo: string
  artista: string
  variantes: VarianteMusica[]
  codigoSpotify?: string | null
}

export const BotoesTocarMusica = memo(function BotoesTocarMusica({
  titulo,
  artista,
  variantes,
  codigoSpotify,
}: BotoesTocarMusicaProps) {
  const { data: extensaoPresente = false } = useExtensaoNoNavegador(true)
  const tocar = useTocarMusica(extensaoPresente)
  const alvos = montarAlvosTocar(variantes, titulo, artista, codigoSpotify)

  return (
    <SimpleGrid columns={2} gap={2}>
      {alvos.map((alvo) => (
        <BotaoTocarAlvo
          key={alvo.fonte}
          alvo={alvo}
          rotulo={rotuloBotaoTocar(alvo, extensaoPresente)}
          carregando={tocar.isPending && tocar.variables?.fonte === alvo.fonte}
          aoClicar={() => tocar.mutate(alvo)}
        />
      ))}
    </SimpleGrid>
  )
})

interface BotaoTocarAlvoProps {
  alvo: AlvoTocar
  rotulo: string
  carregando: boolean
  aoClicar: () => void
}

function BotaoTocarAlvo({ alvo, rotulo, carregando, aoClicar }: BotaoTocarAlvoProps) {
  const tocavel = isCodigoTocavel(alvo)

  return (
    <Button
      size={{ base: 'sm', md: 'md' }}
      borderRadius="full"
      variant={tocavel ? 'solid' : 'outline'}
      bg={tocavel ? 'cirqueira.musica.cartaoElevado' : 'transparent'}
      color="cirqueira.musica.textoPrincipal"
      borderColor={CORES_FONTE_REPRODUCAO[alvo.fonte]}
      borderWidth="1px"
      _hover={{ bg: 'cirqueira.musica.fundo' }}
      loading={carregando}
      onClick={aoClicar}
      minW={0}
      px={3}
    >
      <IconeFonteMusica fonte={alvo.fonte} tamanho={16} />
      {rotulo}
      {tocavel ? <Play size={14} /> : <Search size={14} />}
    </Button>
  )
}

export interface BotaoTocarVarianteProps {
  variante: VarianteMusica
  artista: string
}

export const BotaoTocarVariante = memo(function BotaoTocarVariante({
  variante,
  artista,
}: BotaoTocarVarianteProps) {
  const { data: extensaoPresente = false } = useExtensaoNoNavegador(true)
  const tocar = useTocarMusica(extensaoPresente)
  const alvo = alvoDaVariante(variante, artista)

  return (
    <IconButton
      size="xs"
      variant="ghost"
      borderRadius="full"
      color={CORES_FONTE_REPRODUCAO[variante.fonte]}
      _hover={{ bg: 'cirqueira.musica.fundo' }}
      aria-label={rotuloBotaoTocar(alvo, extensaoPresente)}
      title={rotuloBotaoTocar(alvo, extensaoPresente)}
      loading={tocar.isPending}
      onClick={(evento) => {
        evento.stopPropagation()
        tocar.mutate(alvo)
      }}
      flexShrink={0}
    >
      <Play size={14} />
    </IconButton>
  )
})
