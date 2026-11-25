import { Button, HStack, Skeleton, Text, VStack } from '@chakra-ui/react'
import { CheckCircle2 } from 'lucide-react'
import { memo, useState } from 'react'
import {
  useAprovarRelato,
  useRejeitarRelato,
  useRelatosPronuncia,
  useSugerirCorrecao,
} from '../hooks'
import { CartaoRelato } from './CartaoRelato'

export const PainelCorrecoes = memo(function PainelCorrecoes() {
  const [todos, setTodos] = useState(false)
  const relatos = useRelatosPronuncia(todos, true)
  const sugerir = useSugerirCorrecao()
  const aprovar = useAprovarRelato()
  const rejeitar = useRejeitarRelato()
  const lista = relatos.data ?? []
  const salvando = aprovar.isPending || rejeitar.isPending

  return (
    <VStack align="stretch" gap={4}>
      <HStack justify="space-between" flexWrap="wrap" gap={2}>
        <Text fontSize="sm" color="fg.muted">
          Peça uma sugestão à IA, ajuste se precisar e aprove: a correção vira regra e recalcula as
          frases afetadas.
        </Text>
        <HStack gap={1} bg="bg.muted" p={1} borderRadius="10px">
          <Button
            size="xs"
            borderRadius="8px"
            variant={todos ? 'ghost' : 'solid'}
            colorPalette={todos ? 'gray' : 'brand'}
            onClick={() => setTodos(false)}
          >
            Em aberto
          </Button>
          <Button
            size="xs"
            borderRadius="8px"
            variant={todos ? 'solid' : 'ghost'}
            colorPalette={todos ? 'brand' : 'gray'}
            onClick={() => setTodos(true)}
          >
            Todos
          </Button>
        </HStack>
      </HStack>

      {relatos.isLoading &&
        ['a', 'b'].map((chave) => <Skeleton key={chave} h="180px" borderRadius="12px" />)}

      {!relatos.isLoading && lista.length === 0 && (
        <VStack py={14} gap={2} color="fg.subtle">
          <CheckCircle2 size={28} />
          <Text fontSize="sm">Nenhum erro reportado esperando revisão.</Text>
        </VStack>
      )}

      {lista.map((relato) => (
        <CartaoRelato
          key={`${relato.uuid}-${relato.status}-${relato.explicacaoSugestao ?? ''}`}
          relato={relato}
          sugerindo={sugerir.isPending && sugerir.variables === relato.uuid}
          salvando={salvando}
          onSugerir={sugerir.mutate}
          onAprovar={(uuid, payload) => aprovar.mutate({ uuid, payload })}
          onRejeitar={rejeitar.mutate}
        />
      ))}
    </VStack>
  )
})
