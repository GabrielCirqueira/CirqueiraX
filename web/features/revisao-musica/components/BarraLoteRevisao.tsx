import { Button, Checkbox, Flex, HStack, Text } from '@chakra-ui/react'
import { X } from 'lucide-react'
import { type ReactNode, memo } from 'react'

export interface AcaoBarraLoteRevisao {
  chave: string
  rotulo: string
  icone: ReactNode
  destaque?: boolean
  desabilitada?: boolean
  onClick: () => void
}

export interface BarraLoteRevisaoProps {
  quantidade: number
  totalPagina: number
  rotuloItens: [string, string]
  ocupado: boolean
  acoes: AcaoBarraLoteRevisao[]
  onAlternarTodos: () => void
  onLimpar: () => void
}

export const BarraLoteRevisao = memo(function BarraLoteRevisao({
  quantidade,
  totalPagina,
  rotuloItens,
  ocupado,
  acoes,
  onAlternarTodos,
  onLimpar,
}: BarraLoteRevisaoProps) {
  const todos = totalPagina > 0 && quantidade === totalPagina
  const [singular, plural] = rotuloItens

  return (
    <Flex
      position="sticky"
      top={2}
      zIndex={2}
      justify="space-between"
      align={{ base: 'stretch', md: 'center' }}
      direction={{ base: 'column', md: 'row' }}
      gap={2}
      px={3}
      py={2}
      borderRadius="8px"
      bg="cirqueira.musica.cartaoElevado"
      border="1px solid"
      borderColor={quantidade > 0 ? 'cirqueira.musica.verde' : 'cirqueira.musica.cartaoElevado'}
      role="region"
      aria-label="Ações em lote"
    >
      <HStack gap={3}>
        <Checkbox.Root
          checked={todos ? true : quantidade > 0 ? 'indeterminate' : false}
          onCheckedChange={onAlternarTodos}
          colorPalette="green"
          size="sm"
        >
          <Checkbox.HiddenInput />
          <Checkbox.Control borderColor="cirqueira.musica.textoSecundario" />
          <Checkbox.Label fontSize="xs" color="cirqueira.musica.textoSecundario">
            Selecionar a página
          </Checkbox.Label>
        </Checkbox.Root>
        <Text fontSize="xs" fontWeight="semibold" color="cirqueira.musica.textoPrincipal">
          {quantidade > 0
            ? `${quantidade} ${quantidade === 1 ? singular : plural}`
            : 'Nenhum selecionado'}
        </Text>
      </HStack>
      <HStack gap={1.5} wrap="wrap" justify={{ base: 'start', md: 'end' }}>
        {acoes.map((acao) => (
          <Button
            key={acao.chave}
            size="xs"
            borderRadius="full"
            variant={acao.destaque ? 'solid' : 'outline'}
            bg={acao.destaque ? 'cirqueira.musica.verde' : 'transparent'}
            color={acao.destaque ? 'cirqueira.musica.fundo' : 'cirqueira.musica.textoPrincipal'}
            borderColor="cirqueira.musica.textoDesabilitado"
            _hover={{
              bg: acao.destaque ? 'cirqueira.musica.verdeHover' : 'cirqueira.musica.cartao',
            }}
            disabled={ocupado || quantidade === 0 || acao.desabilitada}
            onClick={acao.onClick}
          >
            {acao.icone} {acao.rotulo}
          </Button>
        ))}
        {quantidade > 0 && (
          <Button
            size="xs"
            variant="ghost"
            color="cirqueira.musica.textoSecundario"
            onClick={onLimpar}
          >
            <X size={12} /> Limpar
          </Button>
        )}
      </HStack>
    </Flex>
  )
})
