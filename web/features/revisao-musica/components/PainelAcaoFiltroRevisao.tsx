import { Button, Flex, HStack, Text } from '@chakra-ui/react'
import { Ban, ListMusic, Zap } from 'lucide-react'
import { memo, useState } from 'react'
import type { AcaoLoteRevisao } from '../types'
import { descreverQuantidadeVideos } from '../utils'

const ROTULOS: Record<AcaoLoteRevisao, string> = {
  nao_musica: 'Não é música',
  manter_compilacao: 'Manter como compilação',
}

export interface PainelAcaoFiltroRevisaoProps {
  total: number
  acoes: AcaoLoteRevisao[]
  ocupado: boolean
  descricao: string
  onAplicar: (acao: AcaoLoteRevisao) => void
}

export const PainelAcaoFiltroRevisao = memo(function PainelAcaoFiltroRevisao({
  total,
  acoes,
  ocupado,
  descricao,
  onAplicar,
}: PainelAcaoFiltroRevisaoProps) {
  const [confirmando, setConfirmando] = useState<AcaoLoteRevisao | null>(null)

  return (
    <Flex
      gap={2}
      px={3}
      py={2.5}
      borderRadius="8px"
      border="1px dashed"
      borderColor="cirqueira.musica.amarelo"
      direction={{ base: 'column', md: 'row' }}
      align={{ base: 'stretch', md: 'center' }}
      justify="space-between"
    >
      <HStack gap={2} align="start">
        <Zap size={14} color="var(--chakra-colors-cirqueira-musica-amarelo)" />
        <Text fontSize="xs" color="cirqueira.musica.textoSecundario">
          {descricao}{' '}
          <Text as="strong" color="cirqueira.musica.textoPrincipal">
            {descreverQuantidadeVideos(total)}
          </Text>
          .
        </Text>
      </HStack>
      <HStack gap={1.5} wrap="wrap">
        {acoes.map((acao) =>
          confirmando === acao ? (
            <HStack key={acao} gap={1}>
              <Button
                size="xs"
                borderRadius="full"
                bg="cirqueira.musica.amarelo"
                color="cirqueira.musica.fundo"
                disabled={ocupado}
                onClick={() => {
                  setConfirmando(null)
                  onAplicar(acao)
                }}
              >
                Confirmar: {ROTULOS[acao].toLowerCase()} para {descreverQuantidadeVideos(total)}
              </Button>
              <Button
                size="xs"
                variant="ghost"
                color="cirqueira.musica.textoSecundario"
                onClick={() => setConfirmando(null)}
              >
                Cancelar
              </Button>
            </HStack>
          ) : (
            <Button
              key={acao}
              size="xs"
              borderRadius="full"
              variant="outline"
              borderColor="cirqueira.musica.amarelo"
              color="cirqueira.musica.amarelo"
              disabled={ocupado || total === 0}
              onClick={() => setConfirmando(acao)}
            >
              {acao === 'nao_musica' ? <Ban size={12} /> : <ListMusic size={12} />}
              {ROTULOS[acao]} para todos
            </Button>
          )
        )}
      </HStack>
    </Flex>
  )
})
