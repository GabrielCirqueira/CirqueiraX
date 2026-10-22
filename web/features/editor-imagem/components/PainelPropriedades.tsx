import { Box, HStack, IconButton, Slider, Text } from '@chakra-ui/react'
import { BringToFront, CopyPlus, Trash2 } from 'lucide-react'
import { memo, useState } from 'react'
import type {
  AlteracaoAnotacao,
  Anotacao,
  EstiloBorda,
  ImagemEditor,
  TipoPreenchimento,
} from '../types'
import {
  type ConfiguracaoDeslizante,
  ROTULO_TIPO_ANOTACAO,
  montarDeslizantes,
} from '../utils/propriedadesPainel'
import { isPropriedadeEditavel } from '../utils/transformacaoAnotacoes'

interface OpcaoSegmento<T extends string> {
  valor: T
  rotulo: string
}

const OPCOES_BORDA: OpcaoSegmento<EstiloBorda>[] = [
  { valor: 'solida', rotulo: 'Sólida' },
  { valor: 'tracejada', rotulo: 'Tracejada' },
]

const OPCOES_PREENCHIMENTO: OpcaoSegmento<TipoPreenchimento>[] = [
  { valor: 'nenhum', rotulo: 'Vazio' },
  { valor: 'translucido', rotulo: 'Translúcido' },
  { valor: 'solido', rotulo: 'Sólido' },
]

const OPCOES_FUNDO_TEXTO: OpcaoSegmento<'sem' | 'com'>[] = [
  { valor: 'sem', rotulo: 'Contorno' },
  { valor: 'com', rotulo: 'Etiqueta' },
]

function Separador() {
  return <Box w="1px" h={6} bg="border.subtle" display={{ base: 'none', md: 'block' }} />
}

interface ControleDeslizanteProps {
  configuracao: ConfiguracaoDeslizante
  onPrevisualizar: (alteracao: AlteracaoAnotacao) => void
  onConfirmar: (alteracao: AlteracaoAnotacao) => void
}

function ControleDeslizante({
  configuracao,
  onPrevisualizar,
  onConfirmar,
}: ControleDeslizanteProps) {
  const [valor, setValor] = useState(configuracao.valor)
  const { propriedade, rotulo, minimo, maximo } = configuracao

  return (
    <HStack gap={2.5}>
      <Text fontSize="xs" color="fg.muted" minW="fit-content">
        {rotulo}
      </Text>
      <Slider.Root
        size="sm"
        w={{ base: '110px', md: '130px' }}
        colorPalette="brand"
        min={minimo}
        max={maximo}
        step={1}
        defaultValue={[configuracao.valor]}
        onValueChange={({ value }) => {
          const [proximo = valor] = value
          setValor(proximo)
          onPrevisualizar({ [propriedade]: proximo })
        }}
        onValueChangeEnd={({ value }) => {
          const [final = valor] = value
          onConfirmar({ [propriedade]: final })
        }}
      >
        <Slider.Control>
          <Slider.Track>
            <Slider.Range />
          </Slider.Track>
          <Slider.Thumbs />
        </Slider.Control>
      </Slider.Root>
      <Text
        fontSize="xs"
        color="fg.subtle"
        w="3ch"
        textAlign="right"
        fontVariantNumeric="tabular-nums"
      >
        {valor}
      </Text>
    </HStack>
  )
}

interface ControleSegmentadoProps<T extends string> {
  rotulo: string
  opcoes: OpcaoSegmento<T>[]
  valor: T
  onSelecionar: (valor: T) => void
}

function ControleSegmentado<T extends string>({
  rotulo,
  opcoes,
  valor,
  onSelecionar,
}: ControleSegmentadoProps<T>) {
  return (
    <HStack gap={2}>
      <Text fontSize="xs" color="fg.muted">
        {rotulo}
      </Text>
      <HStack gap={0.5} p={0.5} bg="bg.muted" borderRadius="lg">
        {opcoes.map((opcao) => {
          const ativa = opcao.valor === valor
          return (
            <Box
              as="button"
              key={opcao.valor}
              px={2.5}
              py={1}
              fontSize="xs"
              borderRadius="md"
              cursor="pointer"
              bg={ativa ? 'bg.panel' : 'transparent'}
              color={ativa ? 'fg' : 'fg.muted'}
              fontWeight={ativa ? 'semibold' : 'normal'}
              shadow={ativa ? 'xs' : 'none'}
              transition="background 0.12s ease"
              aria-pressed={ativa}
              onClick={() => onSelecionar(opcao.valor)}
            >
              {opcao.rotulo}
            </Box>
          )
        })}
      </HStack>
    </HStack>
  )
}

export interface PainelPropriedadesProps {
  anotacao: Anotacao
  imagem: ImagemEditor
  onPrevisualizar: (alteracao: AlteracaoAnotacao) => void
  onConfirmar: (alteracao: AlteracaoAnotacao) => void
  onTrazerParaFrente: () => void
  onDuplicar: () => void
  onExcluir: () => void
}

export const PainelPropriedades = memo(function PainelPropriedades({
  anotacao,
  imagem,
  onPrevisualizar,
  onConfirmar,
  onTrazerParaFrente,
  onDuplicar,
  onExcluir,
}: PainelPropriedadesProps) {
  const deslizantes = montarDeslizantes(anotacao, imagem)

  return (
    <HStack
      gap={4}
      px={3}
      py={2}
      bg="bg.panel"
      borderWidth="1px"
      borderColor="border.subtle"
      borderRadius="xl"
      shadow="sm"
      flexWrap="wrap"
      justify="center"
      alignSelf="center"
      maxW="full"
    >
      <Text fontSize="xs" fontWeight="semibold" color="fg">
        {ROTULO_TIPO_ANOTACAO[anotacao.tipo]}
      </Text>

      {deslizantes.map((configuracao) => (
        <ControleDeslizante
          key={`${anotacao.id}-${configuracao.propriedade}-${configuracao.valor}-${configuracao.maximo}`}
          configuracao={configuracao}
          onPrevisualizar={onPrevisualizar}
          onConfirmar={onConfirmar}
        />
      ))}

      {'estiloBorda' in anotacao && isPropriedadeEditavel(anotacao, 'estiloBorda') && (
        <ControleSegmentado
          rotulo="Traço"
          opcoes={OPCOES_BORDA}
          valor={anotacao.estiloBorda}
          onSelecionar={(estiloBorda) => onConfirmar({ estiloBorda })}
        />
      )}

      {'preenchimento' in anotacao && isPropriedadeEditavel(anotacao, 'preenchimento') && (
        <ControleSegmentado
          rotulo="Preenchimento"
          opcoes={OPCOES_PREENCHIMENTO}
          valor={anotacao.preenchimento}
          onSelecionar={(preenchimento) => onConfirmar({ preenchimento })}
        />
      )}

      {anotacao.tipo === 'texto' && (
        <ControleSegmentado
          rotulo="Estilo"
          opcoes={OPCOES_FUNDO_TEXTO}
          valor={anotacao.comFundo ? 'com' : 'sem'}
          onSelecionar={(fundo) => onConfirmar({ comFundo: fundo === 'com' })}
        />
      )}

      <Separador />

      <HStack gap={0.5}>
        <IconButton
          size="xs"
          variant="ghost"
          borderRadius="lg"
          color="fg.muted"
          aria-label="Trazer para frente"
          title="Trazer para frente"
          onClick={onTrazerParaFrente}
        >
          <BringToFront size={15} />
        </IconButton>
        <IconButton
          size="xs"
          variant="ghost"
          borderRadius="lg"
          color="fg.muted"
          aria-label="Duplicar"
          title="Duplicar (Ctrl + D)"
          onClick={onDuplicar}
        >
          <CopyPlus size={15} />
        </IconButton>
        <IconButton
          size="xs"
          variant="ghost"
          borderRadius="lg"
          color="fg.muted"
          _hover={{ color: 'cirqueira.red.500' }}
          aria-label="Excluir"
          title="Excluir (Delete)"
          onClick={onExcluir}
        >
          <Trash2 size={15} />
        </IconButton>
      </HStack>
    </HStack>
  )
})
