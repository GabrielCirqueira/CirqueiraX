import { Badge, Box, Flex, HStack, Tabs, Text, VStack } from '@chakra-ui/react'
import { BookA, Flag, Languages, Sparkles } from 'lucide-react'
import { memo } from 'react'
import type { PainelPronuncia } from '../types'
import { formatarNumero } from '../utils'

export type AbaPronuncia = 'tradutor' | 'correcoes' | 'dicionario'

export interface CabecalhoPronunciaProps {
  painel: PainelPronuncia | undefined
  administrador: boolean
  aba: AbaPronuncia
  onMudarAba: (aba: AbaPronuncia) => void
}

export const CabecalhoPronuncia = memo(function CabecalhoPronuncia({
  painel,
  administrador,
  aba,
  onMudarAba,
}: CabecalhoPronunciaProps) {
  return (
    <VStack align="stretch" gap={4}>
      <Flex
        justify="space-between"
        align={{ base: 'flex-start', md: 'center' }}
        gap={4}
        wrap="wrap"
      >
        <VStack align="start" gap={1} minW={0}>
          <HStack gap={2.5}>
            <Box
              p={2}
              borderRadius="8px"
              bgGradient="to-br"
              gradientFrom="cirqueira.cyan.500/25"
              gradientTo="cirqueira.brand.700/10"
              color="cirqueira.cyan.400"
              display="inline-flex"
            >
              <Languages size={22} strokeWidth={2.2} />
            </Box>
            <Text as="h1" fontSize={{ base: 'xl', md: '2xl' }} fontWeight="black" color="fg">
              Inglês & Pronúncia
            </Text>
          </HStack>
          <Text fontSize="xs" color="fg.subtle">
            Escreva em português ou inglês e veja a tradução e como se fala, escrito do jeito que a
            gente lê
          </Text>
        </VStack>

        {painel && (
          <HStack gap={2} flexWrap="wrap">
            <HStack
              bg="bg.panel"
              borderWidth="1px"
              borderColor="border.subtle"
              px={3}
              py={1.5}
              borderRadius="full"
              fontSize="xs"
              color="fg.subtle"
              gap={1.5}
            >
              <BookA size={12} />
              <Text as="span">
                {formatarNumero(painel.palavrasDicionario)} palavras no dicionário
              </Text>
            </HStack>
            <HStack
              bg="bg.panel"
              borderWidth="1px"
              borderColor="border.subtle"
              px={3}
              py={1.5}
              borderRadius="full"
              fontSize="xs"
              color="fg.subtle"
              gap={1.5}
            >
              <Sparkles size={12} />
              <Text as="span">{formatarNumero(painel.excecoes)} correções revisadas</Text>
            </HStack>
          </HStack>
        )}
      </Flex>

      {administrador && (
        <Tabs.Root
          value={aba}
          onValueChange={({ value }) => onMudarAba(value as AbaPronuncia)}
          variant="line"
          size="sm"
          colorPalette="brand"
        >
          <Tabs.List>
            <Tabs.Trigger value="tradutor">
              <Languages size={14} />
              Tradutor
            </Tabs.Trigger>
            <Tabs.Trigger value="correcoes">
              <Flag size={14} />
              Correções
              {(painel?.relatosEmAberto ?? 0) > 0 && (
                <Badge size="xs" colorPalette="red" variant="solid" borderRadius="full">
                  {painel?.relatosEmAberto}
                </Badge>
              )}
            </Tabs.Trigger>
            <Tabs.Trigger value="dicionario">
              <BookA size={14} />
              Dicionário
            </Tabs.Trigger>
          </Tabs.List>
        </Tabs.Root>
      )}
    </VStack>
  )
})
