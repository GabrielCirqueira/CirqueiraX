import { Button, HStack, Heading, Progress, Text, VStack } from '@chakra-ui/react'
import { FileArchive } from 'lucide-react'
import { memo, useState } from 'react'
import { useImportacoesYoutube } from '../hooks'
import { RelatorioImportacaoYoutubeSchema } from '../types'
import {
  corSituacaoImportacao,
  descreverSituacaoImportacao,
  formatarDataImportacao,
  formatarNumero,
  percentualClassificacao,
  totalIdentificadas,
  totalParaRevisao,
} from '../utils'
import { ConfirmacaoCustoImportacaoYoutube } from './ConfirmacaoCustoImportacaoYoutube'
import { DialogRelatorioImportacaoYoutube } from './DialogRelatorioImportacaoYoutube'

export const ListaImportacoesYoutube = memo(function ListaImportacoesYoutube() {
  const { data } = useImportacoesYoutube()
  const [uuidAberto, setUuidAberto] = useState<string | null>(null)
  const importacoes = data?.recentes ?? []
  const aberta = importacoes.find((importacao) => importacao.uuid === uuidAberto) ?? null

  if (importacoes.length === 0) return null

  return (
    <VStack
      align="stretch"
      gap={3}
      p={{ base: 3, md: 4 }}
      borderRadius="12px"
      bg="cirqueira.musica.cartao"
      border="1px solid"
      borderColor="cirqueira.musica.cartaoElevado"
    >
      <VStack align="start" gap={0.5}>
        <Heading as="h3" fontSize="sm" fontWeight="bold">
          Importações do YouTube
        </Heading>
        <Text fontSize="xs" color="cirqueira.musica.textoSecundario">
          Cada arquivo soma ao que já existe. Reprodução repetida entre arquivos não conta duas
          vezes, e eles rodam um de cada vez, na ordem em que foram enviados.
        </Text>
      </VStack>

      {importacoes.map((importacao) => {
        const relatorio = importacao.relatorio
          ? RelatorioImportacaoYoutubeSchema.parse(importacao.relatorio)
          : null
        return (
          <VStack
            key={importacao.uuid}
            align="stretch"
            gap={2}
            p={3}
            borderRadius="8px"
            bg="cirqueira.musica.cartaoElevado"
          >
            <HStack gap={3} align="start" minW={0}>
              <FileArchive size={18} />
              <VStack align="start" gap={0} flex={1} minW={0}>
                <Text fontSize="sm" fontWeight="semibold" truncate maxW="full">
                  {importacao.nomeArquivoOriginal ?? 'Arquivo do Takeout'}
                </Text>
                <Text fontSize="2xs" color="cirqueira.musica.textoSecundario">
                  Enviado {formatarDataImportacao(importacao.criadoEm)}
                  {importacao.leitura.totalLidos > 0 &&
                    ` · ${formatarNumero(importacao.leitura.totalLidos)} reproduções lidas`}
                </Text>
                <Text fontSize="xs" fontWeight="semibold" color={corSituacaoImportacao(importacao)}>
                  {descreverSituacaoImportacao(importacao)}
                </Text>
                {relatorio && (
                  <Text fontSize="2xs" color="cirqueira.musica.textoSecundario">
                    {formatarNumero(totalIdentificadas(relatorio))} músicas identificadas ·{' '}
                    {formatarNumero(totalParaRevisao(relatorio))} para revisão
                  </Text>
                )}
              </VStack>
              {importacao.status === 'concluida' && (
                <Button
                  size="xs"
                  borderRadius="full"
                  variant="outline"
                  borderColor="cirqueira.musica.verde"
                  color="cirqueira.musica.verde"
                  flexShrink={0}
                  onClick={() => setUuidAberto(importacao.uuid)}
                >
                  Ver relatório
                </Button>
              )}
            </HStack>
            {importacao.status === 'classificando' && (
              <Progress.Root
                value={percentualClassificacao(importacao)}
                colorPalette="green"
                size="xs"
              >
                <Progress.Track bg="cirqueira.musica.cartao">
                  <Progress.Range />
                </Progress.Track>
              </Progress.Root>
            )}
            {importacao.aguardandoConfirmacao && (
              <ConfirmacaoCustoImportacaoYoutube importacao={importacao} />
            )}
          </VStack>
        )
      })}

      <DialogRelatorioImportacaoYoutube importacao={aberta} onFechar={() => setUuidAberto(null)} />
    </VStack>
  )
})
