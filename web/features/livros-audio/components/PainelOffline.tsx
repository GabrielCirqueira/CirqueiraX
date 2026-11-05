import { useSemConexao } from '@/stores/useConexaoStore'
import { Box, Button, Checkbox, Flex, HStack, Switch, Text, VStack } from '@chakra-ui/react'
import { CloudDownload, RefreshCw, Trash2, WifiOff, X } from 'lucide-react'
import { memo, useState } from 'react'
import { useOfflineLivro } from '../hooks/useOfflineLivro'
import type { LivroAudio, LivroAudioBloco } from '../types'
import {
  type AjustesDownloadAutomatico,
  HORAS_DOWNLOAD,
  lerAjustesDownloadAutomatico,
  salvarAjustesDownloadAutomatico,
  selecionarPartesPorHoras,
  somarPartes,
} from '../utils/downloadAutomatico'
import { formatarDuracaoResumida, formatarTamanhoLivro } from '../utils/livros'
import { chaveParteOffline } from '../utils/offline'

interface PainelOfflineProps {
  livro: LivroAudio
  blocos: LivroAudioBloco[]
  numeroInicial: number
  vozDoBloco: (numeroBloco: number) => string | null
  onFechar?: () => void
}

function ehIos(): boolean {
  return /iphone|ipad|ipod/i.test(navigator.userAgent)
}

export const PainelOffline = memo(function PainelOffline({
  livro,
  blocos,
  numeroInicial,
  vozDoBloco,
  onFechar,
}: PainelOfflineProps) {
  const offline = useOfflineLivro(livro.uuid)
  const semConexao = useSemConexao()
  const [incluirPdf, setIncluirPdf] = useState(false)
  const [ajustes, setAjustes] = useState<AjustesDownloadAutomatico>(() =>
    lerAjustesDownloadAutomatico(livro.uuid)
  )

  const faltando = (lista: LivroAudioBloco[]) =>
    lista.filter(
      (bloco) =>
        !offline.chaves.has(
          chaveParteOffline(bloco.numeroBloco, vozDoBloco(bloco.numeroBloco), bloco.atualizadoEm)
        )
    )

  const opcoes = [
    ...HORAS_DOWNLOAD.map((horas) => ({
      rotulo: `Próximas ${horas} h`,
      partes: faltando(selecionarPartesPorHoras(blocos, numeroInicial, horas)),
    })),
    {
      rotulo: 'Livro todo',
      partes: faltando(selecionarPartesPorHoras(blocos, 1, null)),
    },
  ]

  const desatualizadas = blocos.filter(
    (bloco) =>
      bloco.isPronto &&
      offline.numeros.has(bloco.numeroBloco) &&
      !offline.chaves.has(
        chaveParteOffline(bloco.numeroBloco, vozDoBloco(bloco.numeroBloco), bloco.atualizadoEm)
      )
  )
  const partesGuardadas = blocos.filter((bloco) => offline.numeros.has(bloco.numeroBloco))
  const tempoGuardado = somarPartes(partesGuardadas).segundos
  const progresso = offline.progresso

  function alterarAjustes(parcial: Partial<AjustesDownloadAutomatico>) {
    setAjustes((atual) => {
      const novo = { ...atual, ...parcial }
      salvarAjustesDownloadAutomatico(livro.uuid, novo)
      return novo
    })
  }

  function baixar(partes: LivroAudioBloco[]) {
    offline.baixar(partes, vozDoBloco, { incluirPdf: incluirPdf && !offline.temPdf })
  }

  async function apagar() {
    if (!window.confirm('Apagar deste aparelho tudo o que foi guardado deste livro?')) return
    await offline.remover()
  }

  return (
    <Box>
      <HStack justify="space-between" mb={1.5}>
        <HStack gap={2} color="cirqueira.brand.400">
          <CloudDownload size={15} />
          <Text fontSize="sm" fontWeight="bold" color="white">
            Ouvir sem internet
          </Text>
        </HStack>
        {onFechar && (
          <Button
            size="xs"
            variant="ghost"
            color="cirqueira.grey.400"
            minW="36px"
            h="36px"
            onClick={onFechar}
            aria-label="Fechar ouvir sem internet"
          >
            <X size={16} />
          </Button>
        )}
      </HStack>

      {!offline.suportado ? (
        <Text fontSize="xs" color="cirqueira.grey.300">
          Este navegador não deixa guardar áudio. Abra pelo Chrome ou Safari atualizado.
        </Text>
      ) : (
        <VStack align="stretch" gap={3}>
          <Text fontSize="xs" color="cirqueira.grey.400">
            Guarda o áudio e o texto das partes neste aparelho. Sem sinal, o livro abre e toca
            normalmente aqui no sistema.
          </Text>

          {progresso ? (
            <Box>
              <HStack justify="space-between" mb={1}>
                <Text fontSize="xs" color="cirqueira.grey.200">
                  {progresso.baixandoPdf
                    ? 'Guardando as páginas do livro…'
                    : `Baixando parte ${progresso.atual} de ${progresso.total}…`}
                </Text>
                <Button size="2xs" variant="ghost" onClick={offline.cancelar}>
                  Parar
                </Button>
              </HStack>
              <Box h="6px" bg="rgba(255,255,255,0.08)" borderRadius="full">
                <Box
                  h="full"
                  borderRadius="full"
                  bg="cirqueira.brand.500"
                  transition="width 0.3s ease"
                  w={`${
                    progresso.baixandoPdf
                      ? progresso.fracaoParte * 100
                      : (
                          (progresso.atual - 1 + progresso.fracaoParte) /
                            Math.max(1, progresso.total)
                        ) * 100
                  }%`}
                />
              </Box>
            </Box>
          ) : semConexao ? (
            <HStack gap={2} color="cirqueira.grey.300" fontSize="xs">
              <WifiOff size={14} />
              <Text>Sem conexão. Dá para baixar mais quando a internet voltar.</Text>
            </HStack>
          ) : (
            <>
              <Flex gap={2} flexWrap="wrap">
                {opcoes.map((opcao) => {
                  const total = somarPartes(opcao.partes)
                  return (
                    <Button
                      key={opcao.rotulo}
                      size="sm"
                      variant="subtle"
                      flex={{ base: '1 1 45%', sm: '0 0 auto' }}
                      h="auto"
                      minH="44px"
                      py={1.5}
                      disabled={opcao.partes.length === 0}
                      onClick={() => baixar(opcao.partes)}
                    >
                      <VStack gap={0}>
                        <Text fontSize="xs" fontWeight="semibold">
                          {opcao.rotulo}
                        </Text>
                        <Text fontSize="10px" color="cirqueira.grey.400">
                          {opcao.partes.length === 0
                            ? 'Já guardado'
                            : `${formatarDuracaoResumida(total.segundos)} · ${formatarTamanhoLivro(total.bytes)}`}
                        </Text>
                      </VStack>
                    </Button>
                  )
                })}
              </Flex>
              {!offline.temPdf && (
                <Checkbox.Root
                  size="sm"
                  colorPalette="brand"
                  checked={incluirPdf}
                  onCheckedChange={(evento) => setIncluirPdf(Boolean(evento.checked))}
                >
                  <Checkbox.HiddenInput />
                  <Checkbox.Control />
                  <Checkbox.Label fontSize="xs" color="cirqueira.grey.300">
                    Guardar também as páginas originais (PDF,{' '}
                    {formatarTamanhoLivro(livro.tamanhoBytes)})
                  </Checkbox.Label>
                </Checkbox.Root>
              )}
            </>
          )}

          {desatualizadas.length > 0 && !progresso && !semConexao && (
            <HStack
              justify="space-between"
              bg="cirqueira.brand.500/10"
              border="1px solid"
              borderColor="cirqueira.brand.500/30"
              borderRadius="lg"
              px={2.5}
              py={1.5}
            >
              <Text fontSize="xs" color="cirqueira.grey.200">
                {desatualizadas.length} parte(s) guardada(s) foram refeitas no servidor.
              </Text>
              <Button size="2xs" variant="subtle" onClick={() => baixar(desatualizadas)}>
                <RefreshCw size={11} />
                Atualizar
              </Button>
            </HStack>
          )}

          <Box borderTop="1px solid" borderColor="cirqueira.grey.800" pt={3}>
            <Switch.Root
              size="sm"
              colorPalette="brand"
              checked={ajustes.ativo}
              onCheckedChange={(evento) => alterarAjustes({ ativo: evento.checked })}
            >
              <Switch.HiddenInput />
              <Switch.Control />
              <Switch.Label fontSize="xs" color="cirqueira.grey.200">
                Manter sempre baixadas as próximas
              </Switch.Label>
            </Switch.Root>
            {ajustes.ativo && (
              <VStack align="stretch" gap={2} mt={2} pl={1}>
                <HStack gap={1.5}>
                  {HORAS_DOWNLOAD.map((horas) => (
                    <Button
                      key={horas}
                      size="xs"
                      minH="32px"
                      variant={ajustes.horas === horas ? 'solid' : 'subtle'}
                      colorPalette={ajustes.horas === horas ? 'brand' : 'gray'}
                      onClick={() => alterarAjustes({ horas })}
                    >
                      {horas} h
                    </Button>
                  ))}
                </HStack>
                <Checkbox.Root
                  size="sm"
                  colorPalette="brand"
                  checked={ajustes.liberarOuvidas}
                  onCheckedChange={(evento) =>
                    alterarAjustes({ liberarOuvidas: Boolean(evento.checked) })
                  }
                >
                  <Checkbox.HiddenInput />
                  <Checkbox.Control />
                  <Checkbox.Label fontSize="xs" color="cirqueira.grey.300">
                    Apagar do aparelho as partes que já ouvi
                  </Checkbox.Label>
                </Checkbox.Root>
                <Checkbox.Root
                  size="sm"
                  colorPalette="brand"
                  checked={ajustes.soWifi}
                  onCheckedChange={(evento) => alterarAjustes({ soWifi: Boolean(evento.checked) })}
                >
                  <Checkbox.HiddenInput />
                  <Checkbox.Control />
                  <Checkbox.Label fontSize="xs" color="cirqueira.grey.300">
                    Só baixar no Wi-Fi
                  </Checkbox.Label>
                </Checkbox.Root>
                <Text fontSize="10px" color="cirqueira.grey.500">
                  Acontece sozinho enquanto o livro está aberto com internet.
                </Text>
              </VStack>
            )}
          </Box>

          <HStack
            justify="space-between"
            borderTop="1px solid"
            borderColor="cirqueira.grey.800"
            pt={3}
          >
            <Text fontSize="xs" color="cirqueira.grey.300">
              {partesGuardadas.length > 0 || offline.temPdf
                ? `${partesGuardadas.length} parte(s), ${formatarDuracaoResumida(tempoGuardado)}${offline.temPdf ? ' + páginas' : ''} · ${formatarTamanhoLivro(offline.tamanho)}`
                : 'Nada guardado neste aparelho'}
            </Text>
            {(partesGuardadas.length > 0 || offline.temPdf) && !progresso && (
              <Button size="xs" variant="ghost" colorPalette="red" onClick={apagar}>
                <Trash2 size={12} />
                Apagar
              </Button>
            )}
          </HStack>

          {ehIos() && (
            <Text fontSize="10px" color="cirqueira.grey.500">
              No iPhone, adicione o site à Tela de Início (Compartilhar → Adicionar à Tela de
              Início). Sem isso o Safari pode apagar o que foi guardado depois de alguns dias sem
              abrir.
            </Text>
          )}
        </VStack>
      )}
    </Box>
  )
})
