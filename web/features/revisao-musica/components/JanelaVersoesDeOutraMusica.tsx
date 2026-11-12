import { CapaMusica } from '@/features/musica/components/CapaMusica'
import { Button, HStack, Text, VStack } from '@chakra-ui/react'
import { GitBranch } from 'lucide-react'
import { memo, useState } from 'react'
import type { MusicaCatalogo, MusicaDuplicata } from '../types'
import { capaMusicaDuplicata, nomesArtistasCatalogo, tituloBaseVersoes } from '../utils'
import { BuscaMusicaCatalogo } from './BuscaCatalogo'
import { JanelaRevisaoMusica } from './JanelaRevisaoMusica'

export interface JanelaVersoesDeOutraMusicaProps {
  musicas: MusicaDuplicata[] | null
  ocupado: boolean
  onFechar: () => void
  onConfirmar: (origemUuids: string[], destinoUuid: string) => void
}

export const JanelaVersoesDeOutraMusica = memo(function JanelaVersoesDeOutraMusica({
  musicas,
  ocupado,
  onFechar,
  onConfirmar,
}: JanelaVersoesDeOutraMusicaProps) {
  const [destino, setDestino] = useState<MusicaCatalogo | null>(null)
  const lista = musicas ?? []
  const origens = lista.map((musica) => musica.uuid)

  const fechar = () => {
    setDestino(null)
    onFechar()
  }

  const confirmar = () => {
    if (!destino) return
    onConfirmar(origens, destino.uuid)
    setDestino(null)
  }

  return (
    <JanelaRevisaoMusica
      aberto={musicas !== null}
      titulo="São versões de outra música"
      onFechar={fechar}
      rodape={
        <HStack w="full" justify="end" gap={2}>
          <Button size="sm" variant="ghost" onClick={fechar}>
            Cancelar
          </Button>
          <Button
            size="sm"
            borderRadius="full"
            bg="cirqueira.musica.verde"
            color="cirqueira.musica.fundo"
            disabled={!destino || ocupado}
            onClick={confirmar}
          >
            <GitBranch size={14} /> Ligar como versões
          </Button>
        </HStack>
      }
    >
      <VStack align="stretch" gap={4}>
        <Text fontSize="sm" color="cirqueira.musica.textoSecundario">
          Escolha a música oficial. As duas abaixo passam a aparecer como versões dela, e as
          reproduções somam. Dá para separar depois nos detalhes da música.
        </Text>
        <VStack as="ul" align="stretch" gap={2} m={0} p={0}>
          {lista.map((musica) => (
            <HStack
              as="li"
              key={musica.uuid}
              listStyleType="none"
              gap={3}
              p={2}
              borderRadius="8px"
              bg="cirqueira.musica.cartaoElevado"
              minW={0}
            >
              <CapaMusica url={capaMusicaDuplicata(musica)} alt={musica.titulo} w="40px" h="40px" />
              <VStack align="start" gap={0} minW={0} flex={1}>
                <Text fontSize="sm" fontWeight="semibold" truncate maxW="full">
                  {musica.titulo}
                </Text>
                <Text fontSize="xs" color="cirqueira.musica.textoSecundario" truncate maxW="full">
                  {nomesArtistasCatalogo(musica) || 'Sem artista'}
                </Text>
              </VStack>
            </HStack>
          ))}
        </VStack>
        <Text
          fontSize="xs"
          fontWeight="bold"
          textTransform="uppercase"
          letterSpacing="wide"
          color="cirqueira.musica.textoSecundario"
        >
          Música oficial
        </Text>
        {musicas && (
          <BuscaMusicaCatalogo
            key={origens.join('-')}
            selecionada={destino}
            ignorarUuids={origens}
            termoInicial={tituloBaseVersoes(lista.map((musica) => musica.titulo))}
            onEscolher={setDestino}
          />
        )}
      </VStack>
    </JanelaRevisaoMusica>
  )
})
