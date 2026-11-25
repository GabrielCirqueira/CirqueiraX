import {
  Box,
  HStack,
  IconButton,
  Input,
  SimpleGrid,
  Slider,
  Switch,
  Text,
  VStack,
} from '@chakra-ui/react'
import {
  AlignCenter,
  AlignEndHorizontal,
  AlignEndVertical,
  AlignHorizontalJustifyCenter,
  AlignLeft,
  AlignRight,
  AlignStartHorizontal,
  AlignStartVertical,
  AlignVerticalJustifyCenter,
  ArrowDownToLine,
  ArrowUpToLine,
  Bold,
  ChevronDown,
  ChevronUp,
  CopyPlus,
  Italic,
  type LucideIcon,
  PencilLine,
  Trash2,
} from 'lucide-react'
import { type ReactNode, memo, useState } from 'react'
import type {
  AlinhamentoTexto,
  AlteracaoAnotacao,
  AlvoPainel,
  DirecaoCamada,
  EixoAlinhamento,
  EstiloBorda,
  EstiloTexto,
  PropriedadeEditavel,
  TipoPreenchimento,
} from '../types'
import {
  LIMITES_PROPRIEDADE,
  type LimitePropriedade,
  OPCOES_FONTE,
} from '../utils/constantesEditor'
import {
  ROTULO_TIPO_ANOTACAO,
  limiteDaEspessura,
  limiteDoRaioCanto,
  rotuloDaCor,
  temPropriedade,
} from '../utils/propriedadesPainel'
import { SeletorCor } from './SeletorCor'

interface OpcaoSegmento<T extends string> {
  valor: T
  rotulo: string
  icone?: LucideIcon
}

const OPCOES_BORDA: OpcaoSegmento<EstiloBorda>[] = [
  { valor: 'solida', rotulo: 'Sólida' },
  { valor: 'tracejada', rotulo: 'Tracejada' },
  { valor: 'pontilhada', rotulo: 'Pontos' },
]

const OPCOES_PREENCHIMENTO: OpcaoSegmento<TipoPreenchimento>[] = [
  { valor: 'nenhum', rotulo: 'Vazio' },
  { valor: 'translucido', rotulo: 'Translúcido' },
  { valor: 'solido', rotulo: 'Sólido' },
]

const OPCOES_ESTILO_TEXTO: OpcaoSegmento<EstiloTexto>[] = [
  { valor: 'simples', rotulo: 'Simples' },
  { valor: 'contorno', rotulo: 'Contorno' },
  { valor: 'etiqueta', rotulo: 'Etiqueta' },
]

const OPCOES_ALINHAMENTO: OpcaoSegmento<AlinhamentoTexto>[] = [
  { valor: 'esquerda', rotulo: 'Esquerda', icone: AlignLeft },
  { valor: 'centro', rotulo: 'Centro', icone: AlignCenter },
  { valor: 'direita', rotulo: 'Direita', icone: AlignRight },
]

const OPCOES_ALINHAR_TELA: { eixo: EixoAlinhamento; rotulo: string; icone: LucideIcon }[] = [
  { eixo: 'esquerda', rotulo: 'Encostar à esquerda', icone: AlignStartVertical },
  {
    eixo: 'centroHorizontal',
    rotulo: 'Centralizar na horizontal',
    icone: AlignHorizontalJustifyCenter,
  },
  { eixo: 'direita', rotulo: 'Encostar à direita', icone: AlignEndVertical },
  { eixo: 'topo', rotulo: 'Encostar no topo', icone: AlignStartHorizontal },
  { eixo: 'centroVertical', rotulo: 'Centralizar na vertical', icone: AlignVerticalJustifyCenter },
  { eixo: 'base', rotulo: 'Encostar embaixo', icone: AlignEndHorizontal },
]

function Secao({ titulo, children }: { titulo: string; children: ReactNode }) {
  return (
    <VStack gap={2} alignItems="stretch">
      <Text fontSize="2xs" fontWeight="semibold" color="fg.subtle" textTransform="uppercase">
        {titulo}
      </Text>
      {children}
    </VStack>
  )
}

interface ControleDeslizanteProps {
  rotulo: string
  propriedade: PropriedadeEditavel
  limite: LimitePropriedade
  valor: number
  sufixo?: string
  onPrevisualizar: (alteracao: AlteracaoAnotacao) => void
  onConfirmar: (alteracao: AlteracaoAnotacao) => void
}

function limitar(valor: number, { minimo, maximo }: LimitePropriedade): number {
  return Math.min(Math.max(valor, minimo), maximo)
}

function ControleDeslizante({
  rotulo,
  propriedade,
  limite,
  valor: valorInicial,
  sufixo = '',
  onPrevisualizar,
  onConfirmar,
}: ControleDeslizanteProps) {
  const [valor, setValor] = useState(Math.round(limitar(valorInicial, limite)))
  const [digitado, setDigitado] = useState(String(Math.round(valorInicial)))

  function confirmarDigitado() {
    const numero = Number.parseFloat(digitado.replace(',', '.'))
    if (!Number.isFinite(numero)) {
      setDigitado(String(valor))
      return
    }
    const final = Math.round(limitar(numero, limite))
    setValor(final)
    setDigitado(String(final))
    onConfirmar({ [propriedade]: final })
  }

  return (
    <VStack gap={1} alignItems="stretch">
      <HStack justify="space-between">
        <Text fontSize="xs" color="fg.muted">
          {rotulo}
        </Text>
        <HStack gap={1}>
          <Input
            size="2xs"
            w="52px"
            textAlign="right"
            inputMode="numeric"
            value={digitado}
            aria-label={`${rotulo} (valor exato)`}
            onChange={(evento) => setDigitado(evento.target.value)}
            onBlur={confirmarDigitado}
            onKeyDown={(evento) => {
              if (evento.key === 'Enter') confirmarDigitado()
            }}
          />
          {sufixo && (
            <Text fontSize="xs" color="fg.subtle">
              {sufixo}
            </Text>
          )}
        </HStack>
      </HStack>
      <Slider.Root
        size="sm"
        colorPalette="brand"
        min={limite.minimo}
        max={limite.maximo}
        step={1}
        value={[valor]}
        onValueChange={({ value }) => {
          const [proximo = valor] = value
          setValor(proximo)
          setDigitado(String(proximo))
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
    </VStack>
  )
}

interface ControleSegmentadoProps<T extends string> {
  opcoes: OpcaoSegmento<T>[]
  valor: T
  onSelecionar: (valor: T) => void
}

function ControleSegmentado<T extends string>({
  opcoes,
  valor,
  onSelecionar,
}: ControleSegmentadoProps<T>) {
  return (
    <HStack gap={0.5} p={0.5} bg="bg.muted" borderRadius="8px">
      {opcoes.map((opcao) => {
        const ativa = opcao.valor === valor
        const Icone = opcao.icone
        return (
          <Box
            as="button"
            key={opcao.valor}
            flex="1"
            display="inline-flex"
            alignItems="center"
            justifyContent="center"
            px={2}
            py={1}
            fontSize="xs"
            borderRadius="8px"
            cursor="pointer"
            bg={ativa ? 'bg.panel' : 'transparent'}
            color={ativa ? 'fg' : 'fg.muted'}
            fontWeight={ativa ? 'semibold' : 'normal'}
            shadow={ativa ? 'xs' : 'none'}
            transition="background 0.12s ease"
            aria-pressed={ativa}
            title={opcao.rotulo}
            onClick={() => onSelecionar(opcao.valor)}
          >
            {Icone ? <Icone size={14} /> : opcao.rotulo}
          </Box>
        )
      })}
    </HStack>
  )
}

interface BotaoAcaoProps {
  rotulo: string
  icone: LucideIcon
  perigo?: boolean
  ativo?: boolean
  onClick: () => void
}

function BotaoAcao({ rotulo, icone: Icone, perigo, ativo, onClick }: BotaoAcaoProps) {
  return (
    <IconButton
      size="xs"
      variant={ativo ? 'subtle' : 'ghost'}
      colorPalette={ativo ? 'brand' : 'gray'}
      borderRadius="full"
      color={ativo ? undefined : 'fg.muted'}
      _hover={perigo ? { color: 'cirqueira.red.500' } : undefined}
      aria-label={rotulo}
      aria-pressed={ativo}
      title={rotulo}
      onClick={onClick}
    >
      <Icone size={15} />
    </IconButton>
  )
}

export interface PainelPropriedadesProps {
  alvo: AlvoPainel
  coresRecentes: string[]
  onPrevisualizar: (alteracao: AlteracaoAnotacao) => void
  onCancelarPrevisualizacao: () => void
  onConfirmar: (alteracao: AlteracaoAnotacao) => void
  onEditarTexto: () => void
  onDuplicar: () => void
  onExcluir: () => void
  onMoverCamada: (direcao: DirecaoCamada) => void
  onAlinhar: (eixo: EixoAlinhamento) => void
}

export const PainelPropriedades = memo(function PainelPropriedades({
  alvo,
  coresRecentes,
  onPrevisualizar,
  onCancelarPrevisualizacao,
  onConfirmar,
  onEditarTexto,
  onDuplicar,
  onExcluir,
  onMoverCamada,
  onAlinhar,
}: PainelPropriedadesProps) {
  const { tipo, valores, anotacaoId } = alvo
  const tem = (propriedade: PropriedadeEditavel) => temPropriedade(tipo, propriedade)
  const chave = (propriedade: string, valor: unknown) =>
    `${anotacaoId ?? tipo}-${propriedade}-${String(valor)}`
  const previsualizarCor = anotacaoId
    ? (propriedade: 'cor' | 'corPreenchimento') => (cor: string) =>
        onPrevisualizar({ [propriedade]: cor })
    : null

  return (
    <VStack gap={4} alignItems="stretch">
      <HStack justify="space-between" gap={2}>
        <VStack gap={0} alignItems="flex-start" minW={0}>
          <Text fontSize="sm" fontWeight="semibold" color="fg">
            {ROTULO_TIPO_ANOTACAO[tipo]}
          </Text>
          <Text fontSize="2xs" color="fg.subtle">
            {anotacaoId ? 'Selecionado' : 'Ajuste antes de desenhar'}
          </Text>
        </VStack>
        {anotacaoId && (
          <HStack gap={0}>
            {tipo === 'texto' && (
              <BotaoAcao
                rotulo="Editar texto (duplo clique)"
                icone={PencilLine}
                onClick={onEditarTexto}
              />
            )}
            <BotaoAcao rotulo="Duplicar (Ctrl + D)" icone={CopyPlus} onClick={onDuplicar} />
            <BotaoAcao rotulo="Excluir (Delete)" icone={Trash2} perigo onClick={onExcluir} />
          </HStack>
        )}
      </HStack>

      {tem('cor') && (
        <HStack justify="space-between">
          <Text fontSize="xs" color="fg.muted">
            {rotuloDaCor(tipo)}
          </Text>
          <SeletorCor
            valor={valores.cor}
            rotulo={rotuloDaCor(tipo)}
            coresRecentes={coresRecentes}
            onPrevisualizar={previsualizarCor?.('cor')}
            onCancelarPrevisualizacao={onCancelarPrevisualizacao}
            onConfirmar={(cor) => onConfirmar({ cor })}
          />
        </HStack>
      )}

      {tem('preenchimento') && (
        <Secao titulo="Preenchimento">
          <ControleSegmentado
            opcoes={OPCOES_PREENCHIMENTO}
            valor={valores.preenchimento}
            onSelecionar={(preenchimento) => onConfirmar({ preenchimento })}
          />
          {valores.preenchimento !== 'nenhum' && (
            <HStack justify="space-between">
              <Text fontSize="xs" color="fg.muted">
                Cor do preenchimento
              </Text>
              <SeletorCor
                valor={valores.corPreenchimento}
                rotulo="Cor do preenchimento"
                coresRecentes={coresRecentes}
                onPrevisualizar={previsualizarCor?.('corPreenchimento')}
                onCancelarPrevisualizacao={onCancelarPrevisualizacao}
                onConfirmar={(corPreenchimento) => onConfirmar({ corPreenchimento })}
              />
            </HStack>
          )}
        </Secao>
      )}

      {tem('espessura') && (
        <Secao titulo={tem('preenchimento') ? 'Borda' : 'Traço'}>
          <ControleDeslizante
            key={chave('espessura', valores.espessura)}
            rotulo={tem('preenchimento') ? 'Espessura (0 = sem borda)' : 'Espessura'}
            propriedade="espessura"
            limite={limiteDaEspessura(tipo)}
            valor={valores.espessura}
            onPrevisualizar={onPrevisualizar}
            onConfirmar={onConfirmar}
          />
          {tem('estiloBorda') && (
            <ControleSegmentado
              opcoes={OPCOES_BORDA}
              valor={valores.estiloBorda}
              onSelecionar={(estiloBorda) => onConfirmar({ estiloBorda })}
            />
          )}
          {tem('raioCanto') && (
            <ControleDeslizante
              key={chave('raioCanto', `${valores.raioCanto}-${alvo.limiteRaioCanto}`)}
              rotulo="Arredondamento"
              propriedade="raioCanto"
              limite={limiteDoRaioCanto(alvo.limiteRaioCanto)}
              valor={valores.raioCanto}
              onPrevisualizar={onPrevisualizar}
              onConfirmar={onConfirmar}
            />
          )}
        </Secao>
      )}

      {tipo === 'texto' && (
        <Secao titulo="Texto">
          <ControleDeslizante
            key={chave('tamanhoFonte', valores.tamanhoFonte)}
            rotulo="Tamanho"
            propriedade="tamanhoFonte"
            limite={LIMITES_PROPRIEDADE.tamanhoFonte}
            valor={valores.tamanhoFonte}
            sufixo="px"
            onPrevisualizar={onPrevisualizar}
            onConfirmar={onConfirmar}
          />
          <SimpleGrid columns={3} gap={1}>
            {OPCOES_FONTE.map((fonte) => {
              const ativa = fonte.valor === valores.fonte
              return (
                <Box
                  as="button"
                  key={fonte.valor}
                  px={1.5}
                  py={1.5}
                  borderRadius="8px"
                  borderWidth="1px"
                  borderColor={ativa ? 'cirqueira.brand.500' : 'border.subtle'}
                  bg={ativa ? 'cirqueira.brand.500/10' : 'transparent'}
                  color={ativa ? 'fg' : 'fg.muted'}
                  fontSize="xs"
                  truncate
                  cursor="pointer"
                  title={fonte.rotulo}
                  aria-pressed={ativa}
                  style={{ fontFamily: fonte.familia }}
                  onClick={() => onConfirmar({ fonte: fonte.valor })}
                >
                  {fonte.rotulo}
                </Box>
              )
            })}
          </SimpleGrid>
          <HStack gap={2}>
            <HStack gap={0.5} p={0.5} bg="bg.muted" borderRadius="8px">
              <BotaoAcao
                rotulo="Negrito"
                icone={Bold}
                ativo={valores.negrito}
                onClick={() => onConfirmar({ negrito: !valores.negrito })}
              />
              <BotaoAcao
                rotulo="Itálico"
                icone={Italic}
                ativo={valores.italico}
                onClick={() => onConfirmar({ italico: !valores.italico })}
              />
            </HStack>
            <Box flex="1">
              <ControleSegmentado
                opcoes={OPCOES_ALINHAMENTO}
                valor={valores.alinhamento}
                onSelecionar={(alinhamento) => onConfirmar({ alinhamento })}
              />
            </Box>
          </HStack>
          <ControleSegmentado
            opcoes={OPCOES_ESTILO_TEXTO}
            valor={valores.estiloTexto}
            onSelecionar={(estiloTexto) => onConfirmar({ estiloTexto })}
          />
        </Secao>
      )}

      {tem('raio') && (
        <ControleDeslizante
          key={chave('raio', valores.raio)}
          rotulo="Tamanho"
          propriedade="raio"
          limite={LIMITES_PROPRIEDADE.raio}
          valor={valores.raio}
          onPrevisualizar={onPrevisualizar}
          onConfirmar={onConfirmar}
        />
      )}

      {tem('opacidade') && (
        <Secao titulo="Efeitos">
          <ControleDeslizante
            key={chave('opacidade', valores.opacidade)}
            rotulo="Opacidade"
            propriedade="opacidade"
            limite={LIMITES_PROPRIEDADE.opacidade}
            valor={valores.opacidade}
            sufixo="%"
            onPrevisualizar={onPrevisualizar}
            onConfirmar={onConfirmar}
          />
          {tem('sombra') && (
            <Switch.Root
              size="sm"
              colorPalette="brand"
              checked={valores.sombra}
              onCheckedChange={({ checked }) => onConfirmar({ sombra: checked })}
            >
              <Switch.HiddenInput />
              <Switch.Control />
              <Switch.Label fontSize="xs" color="fg.muted">
                Sombra
              </Switch.Label>
            </Switch.Root>
          )}
        </Secao>
      )}

      {anotacaoId && (
        <Secao titulo="Posição">
          <HStack gap={0.5} flexWrap="wrap">
            <BotaoAcao
              rotulo="Trazer para a frente (Ctrl + Shift + ])"
              icone={ArrowUpToLine}
              onClick={() => onMoverCamada('frente')}
            />
            <BotaoAcao
              rotulo="Subir uma camada (Ctrl + ])"
              icone={ChevronUp}
              onClick={() => onMoverCamada('subir')}
            />
            <BotaoAcao
              rotulo="Descer uma camada (Ctrl + [)"
              icone={ChevronDown}
              onClick={() => onMoverCamada('descer')}
            />
            <BotaoAcao
              rotulo="Enviar para trás (Ctrl + Shift + [)"
              icone={ArrowDownToLine}
              onClick={() => onMoverCamada('tras')}
            />
          </HStack>
        </Secao>
      )}

      {anotacaoId && (
        <Secao titulo="Alinhar na tela">
          <HStack gap={0.5} flexWrap="wrap">
            {OPCOES_ALINHAR_TELA.map((opcao) => (
              <BotaoAcao
                key={opcao.eixo}
                rotulo={opcao.rotulo}
                icone={opcao.icone}
                onClick={() => onAlinhar(opcao.eixo)}
              />
            ))}
          </HStack>
        </Secao>
      )}
    </VStack>
  )
})
