import { useSemConexao } from '@/stores/useConexaoStore'
import { HStack, Text } from '@chakra-ui/react'
import { CloudOff } from 'lucide-react'
import { memo } from 'react'
import { usePendenciasOffline } from '../hooks/useSincronizacaoOffline'

interface FaixaConexaoProps {
  compacta?: boolean
}

export const FaixaConexao = memo(function FaixaConexao({ compacta = false }: FaixaConexaoProps) {
  const semConexao = useSemConexao()
  const pendencias = usePendenciasOffline()

  if (!semConexao) return null

  return (
    <HStack
      role="status"
      w="full"
      gap={2}
      px={compacta ? 3 : 4}
      py={compacta ? 1.5 : 2.5}
      bg="cirqueira.yellow.500/12"
      borderBottom={compacta ? '1px solid' : undefined}
      border={compacta ? undefined : '1px solid'}
      borderColor="cirqueira.yellow.500/30"
      borderRadius={compacta ? 0 : 'xl'}
      color="cirqueira.yellow.200"
    >
      <CloudOff size={15} style={{ flexShrink: 0 }} />
      <Text fontSize="xs" lineHeight="short">
        Sem internet. Tocando o que está guardado neste aparelho.
        {pendencias > 0 && ` ${pendencias} alteração(ões) esperando a conexão para enviar.`}
        {!compacta && ' Enviar livro, gerar voz e apagar voltam quando a internet voltar.'}
      </Text>
    </HStack>
  )
})
