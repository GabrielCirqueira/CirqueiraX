import { Badge, Button, HStack, Icon, IconButton, Table, Text, VStack } from '@chakra-ui/react'
import { AlertCircle, ExternalLink, Loader2, RotateCcw } from 'lucide-react'
import { memo } from 'react'
import type { RegistroEnvioGoogleFotos } from '../types'
import {
  envioEmAndamento,
  envioFalhou,
  formatarDataHoraCurta,
  formatarDuracaoEnvio,
  formatarTamanhoArquivo,
  nomeExibicaoEnvio,
  obterAparenciaStatusEnvio,
  podeReenviarRegistro,
  resumirErroEnvio,
} from '../utils/enviosGoogleFotos'

interface LinhaEnvioGoogleFotosProps {
  registro: RegistroEnvioGoogleFotos
  reenviando: boolean
  onReenviar: (uuidRegistro: string) => void
}

export const LinhaEnvioGoogleFotos = memo(function LinhaEnvioGoogleFotos({
  registro,
  reenviando,
  onReenviar,
}: LinhaEnvioGoogleFotosProps) {
  const aparencia = obterAparenciaStatusEnvio(registro.status)
  const resumoErro = resumirErroEnvio(registro.erroMotivo)

  return (
    <Table.Row bg={envioFalhou(registro) ? 'cirqueira.red.500/5' : undefined}>
      <Table.Cell verticalAlign="top">
        <Badge size="sm" variant="subtle" colorPalette={aparencia.paleta} borderRadius="md">
          {envioEmAndamento(registro) && (
            <Loader2 size={10} style={{ animation: 'spin 1s linear infinite' }} />
          )}
          {aparencia.rotulo}
        </Badge>
      </Table.Cell>

      <Table.Cell verticalAlign="top" minW="240px">
        <VStack align="flex-start" gap={0.5}>
          <Text
            fontSize="xs"
            fontWeight="semibold"
            color="fg"
            truncate
            maxW="320px"
            title={registro.nomeArquivo ?? undefined}
          >
            {nomeExibicaoEnvio(registro)}
          </Text>
          <Text fontSize="11px" color="fg.subtle">
            {registro.origemMidiaDescricao} • {registro.tipoArquivo ?? '—'} •{' '}
            {formatarTamanhoArquivo(registro.tamanhoBytes)}
          </Text>
          {resumoErro && (
            <HStack
              gap={1.5}
              align="flex-start"
              color="cirqueira.red.500"
              title={registro.erroMotivo ?? undefined}
            >
              <Icon as={AlertCircle} boxSize={3} mt="2px" flexShrink={0} />
              <Text fontSize="11px" lineClamp={3} wordBreak="break-word">
                {resumoErro}
              </Text>
            </HStack>
          )}
        </VStack>
      </Table.Cell>

      <Table.Cell verticalAlign="top" fontSize="xs" color="fg.muted" whiteSpace="nowrap">
        {formatarDataHoraCurta(registro.dataMidia)}
      </Table.Cell>

      <Table.Cell verticalAlign="top" minW="160px">
        <VStack align="flex-start" gap={0.5}>
          <Text fontSize="xs" color="fg">
            {registro.categoriaNome ?? '—'}
          </Text>
          <Text
            fontSize="11px"
            color="fg.subtle"
            truncate
            maxW="200px"
            title={registro.contaEmail ?? undefined}
          >
            {registro.contaEmail ?? 'Conta não identificada'}
          </Text>
        </VStack>
      </Table.Cell>

      <Table.Cell verticalAlign="top">
        <VStack align="flex-start" gap={0.5}>
          <Text fontSize="xs" color="fg">
            #{registro.tentativa}
          </Text>
          <Text fontSize="11px" color="fg.subtle" whiteSpace="nowrap">
            {registro.origemEnvioDescricao}
          </Text>
        </VStack>
      </Table.Cell>

      <Table.Cell verticalAlign="top">
        <VStack align="flex-start" gap={0.5}>
          <Text fontSize="xs" color="fg" whiteSpace="nowrap">
            {formatarDataHoraCurta(registro.iniciadoEm)}
          </Text>
          <Text fontSize="11px" color="fg.subtle">
            {formatarDuracaoEnvio(registro.duracaoMs)}
          </Text>
        </VStack>
      </Table.Cell>

      <Table.Cell verticalAlign="top" textAlign="right">
        <HStack gap={1} justify="flex-end">
          {registro.googlePhotosUrl && (
            <IconButton
              asChild
              size="xs"
              variant="ghost"
              aria-label="Abrir no Google Fotos"
              title="Abrir no Google Fotos"
            >
              <a href={registro.googlePhotosUrl} target="_blank" rel="noreferrer">
                <ExternalLink size={13} />
              </a>
            </IconButton>
          )}
          {podeReenviarRegistro(registro) && (
            <Button
              size="xs"
              variant="subtle"
              colorPalette="red"
              borderRadius="lg"
              disabled={reenviando}
              onClick={() => onReenviar(registro.uuid)}
            >
              {reenviando ? (
                <Loader2 size={12} style={{ animation: 'spin 1s linear infinite' }} />
              ) : (
                <RotateCcw size={12} />
              )}
              <Text as="span">Reenviar</Text>
            </Button>
          )}
        </HStack>
      </Table.Cell>
    </Table.Row>
  )
})
