import { useResumoIdentificacao } from '@/features/youtube-music/hooks'
import { Box, Button, HStack, Heading, Text, VStack } from '@chakra-ui/react'
import { ClipboardCheck, Wrench } from 'lucide-react'
import { memo } from 'react'
import { Link as LinkRouter } from 'react-router-dom'
import { ROTA_REVISAO_MUSICA } from '../utils'

export const CartaoRevisaoGerenciar = memo(function CartaoRevisaoGerenciar() {
  const { data: resumo } = useResumoIdentificacao()
  const emRevisao = resumo?.emRevisao ?? 0

  return (
    <Box
      p={{ base: 4, md: 6 }}
      bg="cirqueira.musica.cartao"
      borderRadius="8px"
      border="1px solid"
      borderColor={emRevisao > 0 ? 'cirqueira.musica.amarelo' : 'cirqueira.musica.cartaoElevado'}
    >
      <HStack justify="space-between" align={{ base: 'start', md: 'center' }} gap={4} wrap="wrap">
        <HStack gap={3} align="start" minW={0}>
          <Box color={emRevisao > 0 ? 'cirqueira.musica.amarelo' : 'cirqueira.musica.verde'}>
            {emRevisao > 0 ? <ClipboardCheck size={24} /> : <Wrench size={24} />}
          </Box>
          <VStack align="start" gap={0.5} minW={0}>
            <Heading
              as="h3"
              fontSize="md"
              fontWeight="bold"
              color="cirqueira.musica.textoPrincipal"
            >
              {emRevisao > 0
                ? `${emRevisao} ${emRevisao === 1 ? 'item para revisar' : 'itens para revisar'}`
                : 'Nada pendente na revisão'}
            </Heading>
            <Text fontSize="xs" color="cirqueira.musica.textoSecundario">
              Corrija músicas, artistas, versões e canais que a identificação automática errou,
              junte músicas repetidas e marque canais que não são música.
            </Text>
          </VStack>
        </HStack>
        <Button
          asChild
          size="sm"
          borderRadius="full"
          bg="cirqueira.musica.verde"
          color="cirqueira.grey.950"
          fontWeight="bold"
          _hover={{ bg: 'cirqueira.musica.verdeHover' }}
        >
          <LinkRouter to={ROTA_REVISAO_MUSICA}>
            <Wrench size={14} />
            Abrir revisão e correções
          </LinkRouter>
        </Button>
      </HStack>
    </Box>
  )
})
