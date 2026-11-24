import { Box, Button, HStack, IconButton, Input, SimpleGrid, Text, VStack } from '@chakra-ui/react'
import { ArrowLeftRight, FilePlus2 } from 'lucide-react'
import { memo, useState } from 'react'
import type { ConfiguracaoTela, ImagemEditor } from '../types'
import {
  COR_FUNDO_TELA_PADRAO,
  FORMATOS_TELA,
  LADO_MAXIMO_TELA,
  LADO_MINIMO_TELA,
} from '../utils/constantesEditor'
import { SeletorCor } from './SeletorCor'

const FUNDO_XADREZ = 'repeating-conic-gradient(#d4d4d8 0% 25%, #ffffff 0% 50%) 50% / 10px 10px'

function MiniaturaFormato({ largura, altura }: { largura: number; altura: number }) {
  const maior = Math.max(largura, altura)
  return (
    <Box
      w={`${(largura / maior) * 22}px`}
      h={`${(altura / maior) * 22}px`}
      borderWidth="1.5px"
      borderColor="currentColor"
      borderRadius="3px"
    />
  )
}

interface CampoLadoProps {
  rotulo: string
  valor: number
  onConfirmar: (valor: number) => void
}

function CampoLado({ rotulo, valor, onConfirmar }: CampoLadoProps) {
  const [digitado, setDigitado] = useState(String(valor))

  function confirmar() {
    const numero = Math.round(Number.parseFloat(digitado))
    if (!Number.isFinite(numero)) {
      setDigitado(String(valor))
      return
    }
    const final = Math.min(Math.max(numero, LADO_MINIMO_TELA), LADO_MAXIMO_TELA)
    setDigitado(String(final))
    if (final !== valor) onConfirmar(final)
  }

  return (
    <VStack gap={0.5} alignItems="stretch" flex="1">
      <Text fontSize="2xs" color="fg.subtle">
        {rotulo}
      </Text>
      <Input
        size="xs"
        inputMode="numeric"
        value={digitado}
        aria-label={rotulo}
        onChange={(evento) => setDigitado(evento.target.value)}
        onBlur={confirmar}
        onKeyDown={(evento) => {
          if (evento.key === 'Enter') confirmar()
        }}
      />
    </VStack>
  )
}

export interface PainelTelaProps {
  imagem: ImagemEditor
  coresRecentes: string[]
  onConfigurar: (alteracao: Partial<ConfiguracaoTela>) => void
  onNovaTela: () => void
}

export const PainelTela = memo(function PainelTela({
  imagem,
  coresRecentes,
  onConfigurar,
  onNovaTela,
}: PainelTelaProps) {
  const { tela } = imagem

  return (
    <VStack
      gap={3}
      alignItems="stretch"
      p={3}
      bg="bg.panel"
      borderWidth="1px"
      borderColor="border.subtle"
      borderRadius="8px"
      shadow="sm"
    >
      <HStack justify="space-between">
        <VStack gap={0} alignItems="flex-start">
          <Text fontSize="sm" fontWeight="semibold" color="fg">
            {tela ? 'Tela' : 'Imagem'}
          </Text>
          <Text fontSize="2xs" color="fg.subtle">
            {imagem.largura} × {imagem.altura}px
          </Text>
        </VStack>
        {!tela && (
          <Button size="xs" variant="outline" borderRadius="full" onClick={onNovaTela}>
            <FilePlus2 size={13} />
            Tela em branco
          </Button>
        )}
      </HStack>

      {tela && (
        <>
          <SimpleGrid columns={4} gap={1}>
            {FORMATOS_TELA.map((formato) => {
              const ativo = formato.largura === tela.largura && formato.altura === tela.altura
              return (
                <Box
                  as="button"
                  key={formato.id}
                  display="flex"
                  flexDirection="column"
                  alignItems="center"
                  justifyContent="flex-end"
                  gap={1}
                  h="58px"
                  px={1}
                  py={1.5}
                  borderRadius="8px"
                  borderWidth="1px"
                  borderColor={ativo ? 'cirqueira.brand.500' : 'border.subtle'}
                  bg={ativo ? 'cirqueira.brand.500/10' : 'transparent'}
                  color={ativo ? 'cirqueira.brand.500' : 'fg.muted'}
                  cursor="pointer"
                  title={`${formato.rotulo} · ${formato.largura} × ${formato.altura}px`}
                  aria-pressed={ativo}
                  onClick={() => onConfigurar({ largura: formato.largura, altura: formato.altura })}
                >
                  <MiniaturaFormato largura={formato.largura} altura={formato.altura} />
                  <Text fontSize="2xs" lineHeight="1.1" textAlign="center" lineClamp={1}>
                    {formato.rotulo.split(' ')[0]}
                  </Text>
                </Box>
              )
            })}
          </SimpleGrid>

          <HStack gap={2} alignItems="flex-end">
            <CampoLado
              key={`l-${tela.largura}`}
              rotulo="Largura"
              valor={tela.largura}
              onConfirmar={(largura) => onConfigurar({ largura })}
            />
            <IconButton
              size="xs"
              variant="ghost"
              color="fg.muted"
              aria-label="Girar formato"
              title="Trocar largura e altura"
              onClick={() => onConfigurar({ largura: tela.altura, altura: tela.largura })}
            >
              <ArrowLeftRight size={14} />
            </IconButton>
            <CampoLado
              key={`a-${tela.altura}`}
              rotulo="Altura"
              valor={tela.altura}
              onConfirmar={(altura) => onConfigurar({ altura })}
            />
          </HStack>

          <HStack justify="space-between">
            <Text fontSize="xs" color="fg.muted">
              Fundo
            </Text>
            <HStack gap={2}>
              <Box
                as="button"
                title="Fundo transparente"
                aria-label="Fundo transparente"
                aria-pressed={tela.corFundo === null}
                w={7}
                h={7}
                borderRadius="full"
                borderWidth="2px"
                borderColor={tela.corFundo === null ? 'fg' : 'border'}
                cursor="pointer"
                style={{ background: FUNDO_XADREZ }}
                onClick={() => onConfigurar({ corFundo: null })}
              />
              <SeletorCor
                valor={tela.corFundo ?? COR_FUNDO_TELA_PADRAO}
                rotulo="Cor do fundo"
                coresRecentes={coresRecentes}
                onConfirmar={(corFundo) => onConfigurar({ corFundo })}
              />
            </HStack>
          </HStack>

          <Text fontSize="2xs" color="fg.subtle">
            Cole uma imagem com Ctrl + V para trocar a tela por ela.
          </Text>
        </>
      )}
    </VStack>
  )
})
