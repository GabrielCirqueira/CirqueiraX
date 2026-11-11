import { Box, HStack, Text } from '@chakra-ui/react'
import { ClipboardCheck, Wrench } from 'lucide-react'
import { memo } from 'react'
import { Link as LinkRouter } from 'react-router-dom'
import { useResumoIdentificacao } from '../hooks'
import { formatarNumero } from '../utils'

const ROTA_REVISAO = '/musica/revisao'

export const SeloRevisaoMusica = memo(function SeloRevisaoMusica() {
  const { data: resumo } = useResumoIdentificacao()
  const total = resumo?.emRevisao ?? 0

  if (total <= 0) return null

  return (
    <LinkRouter to={ROTA_REVISAO}>
      <Box
        as="span"
        display="inline-flex"
        px={3}
        py={1.5}
        borderRadius="full"
        borderWidth="1px"
        borderColor="cirqueira.musica.amarelo"
        color="cirqueira.musica.amarelo"
        _hover={{ bg: 'cirqueira.musica.cartaoElevado' }}
      >
        <HStack gap={1.5} fontSize="xs" fontWeight="bold">
          <ClipboardCheck size={14} />
          <Text as="span">
            {formatarNumero(total)} {total === 1 ? 'item para revisar' : 'itens para revisar'}
          </Text>
        </HStack>
      </Box>
    </LinkRouter>
  )
})

export const LinkRevisaoMusica = memo(function LinkRevisaoMusica() {
  return (
    <LinkRouter to={ROTA_REVISAO}>
      <Box
        as="span"
        display="inline-flex"
        px={3}
        py={1.5}
        borderRadius="full"
        borderWidth="1px"
        borderColor="cirqueira.musica.cartaoElevado"
        color="cirqueira.musica.textoSecundario"
        _hover={{ bg: 'cirqueira.musica.cartaoElevado', color: 'cirqueira.musica.textoPrincipal' }}
      >
        <HStack gap={1.5} fontSize="xs" fontWeight="bold">
          <Wrench size={14} />
          <Text as="span">Revisão e correções</Text>
        </HStack>
      </Box>
    </LinkRouter>
  )
})
