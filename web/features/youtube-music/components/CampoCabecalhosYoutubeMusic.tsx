import { Box, Button, HStack, Text, Textarea, VStack } from '@chakra-ui/react'
import { ShieldAlert } from 'lucide-react'
import { type FormEvent, memo, useState } from 'react'
import { useConectarYoutubeMusic } from '../hooks'
import { AVISO_CABECALHOS, PASSOS_OBTER_CABECALHOS } from '../utils'

export interface CampoCabecalhosYoutubeMusicProps {
  rotuloBotao: string
}

export const CampoCabecalhosYoutubeMusic = memo(function CampoCabecalhosYoutubeMusic({
  rotuloBotao,
}: CampoCabecalhosYoutubeMusicProps) {
  const [cabecalhos, setCabecalhos] = useState('')
  const conectar = useConectarYoutubeMusic()

  function handleEnviar(evento: FormEvent) {
    evento.preventDefault()
    const texto = cabecalhos.trim()
    if (texto.length === 0) return
    setCabecalhos('')
    conectar.mutate(texto)
  }

  return (
    <Box as="form" onSubmit={handleEnviar} w="full">
      <VStack align="stretch" gap={3}>
        <VStack as="ol" align="stretch" gap={1.5} pl={4} fontSize="xs">
          {PASSOS_OBTER_CABECALHOS.map((passo) => (
            <Text
              as="li"
              key={passo}
              color="cirqueira.musica.textoSecundario"
              listStyleType="decimal"
            >
              {passo}
            </Text>
          ))}
        </VStack>

        <Textarea
          value={cabecalhos}
          onChange={(evento) => setCabecalhos(evento.target.value)}
          placeholder="Cole aqui os cabeçalhos da requisição"
          aria-label="Cabeçalhos da requisição do YouTube Music"
          autoComplete="off"
          spellCheck={false}
          rows={5}
          fontFamily="mono"
          fontSize="xs"
          bg="cirqueira.musica.fundo"
          borderColor="cirqueira.musica.cartaoElevado"
          color="cirqueira.musica.textoPrincipal"
          resize="vertical"
        />

        <HStack
          gap={2}
          align="start"
          px={3}
          py={2}
          borderRadius="8px"
          borderWidth="1px"
          borderColor="cirqueira.musica.amarelo"
          color="cirqueira.musica.amarelo"
          fontSize="xs"
        >
          <ShieldAlert size={14} />
          <Text>{AVISO_CABECALHOS}</Text>
        </HStack>

        <Button
          type="submit"
          alignSelf="flex-start"
          size="sm"
          borderRadius="full"
          fontWeight="bold"
          bg="cirqueira.musica.verde"
          color="cirqueira.grey.950"
          _hover={{ bg: 'cirqueira.musica.verdeHover' }}
          loading={conectar.isPending}
          disabled={cabecalhos.trim().length === 0}
        >
          {rotuloBotao}
        </Button>
      </VStack>
    </Box>
  )
})
