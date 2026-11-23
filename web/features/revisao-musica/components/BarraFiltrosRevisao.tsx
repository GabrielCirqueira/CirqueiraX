import {
  Button,
  Checkbox,
  Flex,
  HStack,
  Input,
  InputGroup,
  NativeSelect,
  Text,
  VStack,
} from '@chakra-ui/react'
import { Keyboard, LayoutList, Rows3, Search, X } from 'lucide-react'
import { type ReactNode, memo } from 'react'
import type { FiltrosRevisao, OrdemRevisao, TipoRevisao } from '../types'
import {
  FILTROS_PADRAO_REVISAO,
  OPCOES_CONFIANCA_REVISAO,
  OPCOES_ORDEM_REVISAO,
  OPCOES_SUGESTAO_REVISAO,
  OPCOES_TAMANHO_PAGINA_REVISAO,
  filtraSugestao,
  filtraVideos,
  filtrosAtivos,
} from '../utils'

export interface BarraFiltrosRevisaoProps {
  tipo: TipoRevisao
  filtros: FiltrosRevisao
  compacto: boolean
  onMudar: (filtros: FiltrosRevisao) => void
  onAlternarCompacto: () => void
}

const PROPS_SELECT = {
  size: 'xs',
  borderRadius: 'full',
  bg: 'cirqueira.musica.fundo',
  borderColor: 'cirqueira.musica.cartaoElevado',
  color: 'cirqueira.musica.textoPrincipal',
  fontSize: 'xs',
} as const

function Chip({
  ativo,
  children,
  onClick,
}: {
  ativo: boolean
  children: ReactNode
  onClick: () => void
}) {
  return (
    <Button
      size="xs"
      borderRadius="full"
      px={3}
      fontSize="2xs"
      fontWeight="semibold"
      flexShrink={0}
      bg={ativo ? 'cirqueira.musica.cartaoElevado' : 'transparent'}
      color={ativo ? 'cirqueira.musica.textoPrincipal' : 'cirqueira.musica.textoSecundario'}
      border="1px solid"
      borderColor={ativo ? 'cirqueira.musica.verde' : 'cirqueira.musica.cartaoElevado'}
      _hover={{ color: 'cirqueira.musica.textoPrincipal' }}
      onClick={onClick}
    >
      {children}
    </Button>
  )
}

function Opcao({
  rotulo,
  marcado,
  onAlternar,
}: {
  rotulo: string
  marcado: boolean
  onAlternar: () => void
}) {
  return (
    <Checkbox.Root checked={marcado} onCheckedChange={onAlternar} colorPalette="green" size="sm">
      <Checkbox.HiddenInput />
      <Checkbox.Control borderColor="cirqueira.musica.textoSecundario" />
      <Checkbox.Label fontSize="xs" color="cirqueira.musica.textoSecundario">
        {rotulo}
      </Checkbox.Label>
    </Checkbox.Root>
  )
}

export const BarraFiltrosRevisao = memo(function BarraFiltrosRevisao({
  tipo,
  filtros,
  compacto,
  onMudar,
  onAlternarCompacto,
}: BarraFiltrosRevisaoProps) {
  const videos = filtraVideos(tipo)
  const mudar = (parcial: Partial<FiltrosRevisao>) => onMudar({ ...filtros, ...parcial })

  return (
    <VStack
      align="stretch"
      gap={2.5}
      p={3}
      borderRadius="10px"
      bg="cirqueira.musica.cartao"
      border="1px solid"
      borderColor="cirqueira.musica.cartaoElevado"
    >
      <Flex gap={2} wrap="wrap" align="center">
        <InputGroup
          flex="1"
          minW="180px"
          startElement={<Search size={14} />}
          endElement={
            filtros.busca ? (
              <Button
                size="2xs"
                variant="ghost"
                aria-label="Limpar busca"
                onClick={() => mudar({ busca: '' })}
              >
                <X size={12} />
              </Button>
            ) : undefined
          }
        >
          <Input
            size="sm"
            borderRadius="full"
            bg="cirqueira.musica.fundo"
            borderColor="cirqueira.musica.cartaoElevado"
            color="cirqueira.musica.textoPrincipal"
            placeholder={videos ? 'Buscar por título ou canal' : 'Buscar'}
            value={filtros.busca}
            onChange={(evento) => mudar({ busca: evento.target.value })}
          />
        </InputGroup>

        {videos && (
          <NativeSelect.Root size="xs" w="auto">
            <NativeSelect.Field
              {...PROPS_SELECT}
              aria-label="Ordenar"
              value={filtros.ordem}
              onChange={(evento) => mudar({ ordem: evento.target.value as OrdemRevisao })}
            >
              {OPCOES_ORDEM_REVISAO.map((opcao) => (
                <option key={opcao.valor} value={opcao.valor}>
                  {opcao.rotulo}
                </option>
              ))}
            </NativeSelect.Field>
            <NativeSelect.Indicator />
          </NativeSelect.Root>
        )}

        <NativeSelect.Root size="xs" w="auto">
          <NativeSelect.Field
            {...PROPS_SELECT}
            aria-label="Itens por página"
            value={String(filtros.porPagina)}
            onChange={(evento) => mudar({ porPagina: Number(evento.target.value) })}
          >
            {OPCOES_TAMANHO_PAGINA_REVISAO.map((tamanho) => (
              <option key={tamanho} value={tamanho}>
                {tamanho} por página
              </option>
            ))}
          </NativeSelect.Field>
          <NativeSelect.Indicator />
        </NativeSelect.Root>

        {videos && (
          <Button
            size="xs"
            borderRadius="full"
            variant="outline"
            borderColor="cirqueira.musica.cartaoElevado"
            color="cirqueira.musica.textoPrincipal"
            onClick={onAlternarCompacto}
          >
            {compacto ? <Rows3 size={12} /> : <LayoutList size={12} />}
            {compacto ? 'Cartões' : 'Lista compacta'}
          </Button>
        )}
      </Flex>

      {filtraSugestao(tipo) && (
        <Flex gap={1.5} wrap="wrap" align="center">
          <Text fontSize="2xs" color="cirqueira.musica.textoSecundario" mr={1}>
            Sugestão:
          </Text>
          {OPCOES_SUGESTAO_REVISAO.map((opcao) => (
            <Chip
              key={opcao.rotulo}
              ativo={filtros.sugestao === opcao.valor}
              onClick={() => mudar({ sugestao: opcao.valor })}
            >
              {opcao.rotulo}
            </Chip>
          ))}
          <Text fontSize="2xs" color="cirqueira.musica.textoSecundario" ml={2} mr={1}>
            Confiança:
          </Text>
          {OPCOES_CONFIANCA_REVISAO.map((opcao) => (
            <Chip
              key={opcao.rotulo}
              ativo={filtros.confiancaMinima === opcao.valor}
              onClick={() => mudar({ confiancaMinima: opcao.valor })}
            >
              {opcao.rotulo}
            </Chip>
          ))}
        </Flex>
      )}

      <Flex gap={4} wrap="wrap" align="center" justify="space-between">
        <HStack gap={4} wrap="wrap">
          {tipo === 'indisponivel' && (
            <Opcao
              rotulo="Só os sem título (não dá para identificar)"
              marcado={filtros.semTitulo}
              onAlternar={() => mudar({ semTitulo: !filtros.semTitulo })}
            />
          )}
          {tipo === 'canal_novo' && (
            <Opcao
              rotulo="Incluir canais com só 1 vídeo"
              marcado={filtros.incluirCanaisUnicos}
              onAlternar={() => mudar({ incluirCanaisUnicos: !filtros.incluirCanaisUnicos })}
            />
          )}
          {filtrosAtivos(filtros) && (
            <Button
              size="2xs"
              variant="ghost"
              color="cirqueira.musica.textoSecundario"
              onClick={() =>
                onMudar({
                  ...FILTROS_PADRAO_REVISAO,
                  ordem: filtros.ordem,
                  porPagina: filtros.porPagina,
                  incluirCanaisUnicos: filtros.incluirCanaisUnicos,
                })
              }
            >
              <X size={12} /> Limpar filtros
            </Button>
          )}
        </HStack>
        {videos && (
          <HStack gap={1.5} color="cirqueira.musica.textoDesabilitado" fontSize="2xs">
            <Keyboard size={12} />
            <Text>
              Clique num vídeo e use: A aceitar · N não é música · B buscar · X selecionar · J/K
              navegar
            </Text>
          </HStack>
        )}
      </Flex>
    </VStack>
  )
})
