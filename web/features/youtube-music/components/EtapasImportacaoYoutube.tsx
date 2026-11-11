import { Box, HStack, Text } from '@chakra-ui/react'
import { memo } from 'react'
import { PASSOS_IMPORTACAO_YOUTUBE, type PassoImportacaoYoutube, indicePasso } from '../utils'

export interface EtapasImportacaoYoutubeProps {
  passo: PassoImportacaoYoutube
}

export const EtapasImportacaoYoutube = memo(function EtapasImportacaoYoutube({
  passo,
}: EtapasImportacaoYoutubeProps) {
  const atual = indicePasso(passo)

  return (
    <HStack gap={1} w="full" aria-label="Etapas da importação">
      {PASSOS_IMPORTACAO_YOUTUBE.map((item, indice) => {
        const feito = atual >= 0 && indice < atual
        const ativo = indice === atual
        return (
          <Box key={item.chave} flex={1} minW={0} aria-current={ativo ? 'step' : undefined}>
            <Box
              h="4px"
              borderRadius="full"
              bg={feito || ativo ? 'cirqueira.musica.verde' : 'cirqueira.musica.cartaoElevado'}
              opacity={ativo ? 0.6 : 1}
            />
            <Text
              mt={1}
              fontSize="2xs"
              fontWeight={ativo ? 'bold' : 'medium'}
              color={ativo ? 'cirqueira.musica.textoPrincipal' : 'cirqueira.musica.textoSecundario'}
              truncate
            >
              {item.rotulo}
            </Text>
          </Box>
        )
      })}
    </HStack>
  )
})
