import { Button, HStack, IconButton, Input, Text, VStack } from '@chakra-ui/react'
import { Plus, Trash2 } from 'lucide-react'
import { memo } from 'react'
import { type ComponenteRascunho, LIMITE_COMPONENTES_MASHUP } from '../utils'

const MINIMO_COMPONENTES = 2

export interface EditorComponentesMashupProps {
  componentes: ComponenteRascunho[]
  onAlterar: (componentes: ComponenteRascunho[]) => void
}

export const EditorComponentesMashup = memo(function EditorComponentesMashup({
  componentes,
  onAlterar,
}: EditorComponentesMashupProps) {
  function alterar(indice: number, parcial: Partial<ComponenteRascunho>) {
    onAlterar(componentes.map((item, i) => (i === indice ? { ...item, ...parcial } : item)))
  }

  return (
    <VStack align="stretch" gap={3}>
      <Text fontSize="xs" color="cirqueira.musica.textoSecundario">
        Informe cada música que aparece no mashup, com título e artistas.
      </Text>
      {componentes.map((componente, indice) => (
        <HStack
          key={`componente-${indice}`}
          gap={2}
          align="end"
          p={2}
          borderRadius="6px"
          bg="cirqueira.musica.cartaoElevado"
          flexWrap={{ base: 'wrap', sm: 'nowrap' }}
        >
          <Input
            flex={2}
            minW="160px"
            size="sm"
            value={componente.titulo}
            onChange={(evento) => alterar(indice, { titulo: evento.target.value })}
            placeholder={`Música ${indice + 1}`}
            aria-label={`Título da música ${indice + 1}`}
            bg="cirqueira.musica.fundo"
            borderColor="cirqueira.musica.cartaoElevado"
          />
          <Input
            flex={2}
            minW="160px"
            size="sm"
            value={componente.artistas}
            onChange={(evento) => alterar(indice, { artistas: evento.target.value })}
            placeholder="Artistas, separados por vírgula"
            aria-label={`Artistas da música ${indice + 1}`}
            bg="cirqueira.musica.fundo"
            borderColor="cirqueira.musica.cartaoElevado"
          />
          <IconButton
            size="sm"
            variant="ghost"
            aria-label={`Remover música ${indice + 1}`}
            color="cirqueira.musica.textoSecundario"
            disabled={componentes.length <= MINIMO_COMPONENTES}
            onClick={() => onAlterar(componentes.filter((_, i) => i !== indice))}
          >
            <Trash2 size={14} />
          </IconButton>
        </HStack>
      ))}
      <Button
        alignSelf="start"
        size="xs"
        variant="ghost"
        color="cirqueira.musica.verde"
        disabled={componentes.length >= LIMITE_COMPONENTES_MASHUP}
        onClick={() => onAlterar([...componentes, { titulo: '', artistas: '' }])}
      >
        <Plus size={14} /> Adicionar música
      </Button>
    </VStack>
  )
})
