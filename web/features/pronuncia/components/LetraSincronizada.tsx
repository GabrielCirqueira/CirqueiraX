import { useLatest, useMountEffect } from '@/shared/hooks'
import { Box, Button, HStack, IconButton, VStack } from '@chakra-ui/react'
import { LocateFixed, Snail, Square, Volume2, X } from 'lucide-react'
import { Fragment, memo, useRef, useState } from 'react'
import { type FalaIngles, posicaoAtualMs } from '../hooks'
import type { LetraMusica, ModoPronuncia, TocandoAgoraPronuncia } from '../types'
import {
  ANTECIPACAO_LINHA_MS,
  VELOCIDADE_LENTA,
  VELOCIDADE_NORMAL,
  indiceLinhaAtiva,
} from '../utils'
import { type EstadoLinhaLetra, LinhaLetraItem } from './LinhaLetraItem'
import { PalavrasPronunciadas } from './PalavrasPronunciadas'

const INTERVALO_SINCRONIA_MS = 100
const PAUSA_ROLAGEM_MANUAL_MS = 5_000
const SEM_LINHA = -1

export interface LetraSincronizadaProps {
  letra: LetraMusica
  tocando: TocandoAgoraPronuncia
  ajusteMs: number
  modo: ModoPronuncia
  mostrarPronuncia: boolean
  mostrarTraducao: boolean
  fala: FalaIngles
}

function estadoDaLinha(indice: number, ativa: number): EstadoLinhaLetra {
  if (indice === ativa) return 'ativa'
  return indice < ativa ? 'passada' : 'futura'
}

export const LetraSincronizada = memo(function LetraSincronizada({
  letra,
  tocando,
  ajusteMs,
  modo,
  mostrarPronuncia,
  mostrarTraducao,
  fala,
}: LetraSincronizadaProps) {
  const sincronizada = letra.situacao === 'sincronizada'
  const [ativa, setAtiva] = useState(SEM_LINHA)
  const [selecionada, setSelecionada] = useState<number | null>(null)
  const [seguindo, setSeguindo] = useState(true)
  const containerRef = useRef<HTMLDivElement | null>(null)
  const elementosRef = useRef(new Map<number, HTMLDivElement>())
  const ativaRef = useRef(SEM_LINHA)
  const ultimaRolagemManualRef = useRef(0)
  const dadosRef = useLatest({ letra, tocando, ajusteMs, sincronizada })

  function centralizar(indice: number, suave: boolean) {
    const container = containerRef.current
    const elemento = elementosRef.current.get(indice)
    if (!container || !elemento) return
    const destino = elemento.offsetTop - container.clientHeight / 2 + elemento.clientHeight / 2
    container.scrollTo({ top: Math.max(0, destino), behavior: suave ? 'smooth' : 'auto' })
  }

  useMountEffect(() => {
    const intervalo = window.setInterval(() => {
      const dados = dadosRef.current
      if (!dados.sincronizada) return
      const indice = indiceLinhaAtiva(
        dados.letra.linhas,
        posicaoAtualMs(dados.tocando, dados.ajusteMs) + ANTECIPACAO_LINHA_MS
      )
      if (indice === ativaRef.current) return
      ativaRef.current = indice
      setAtiva(indice)
      const rolouAgora = Date.now() - ultimaRolagemManualRef.current < PAUSA_ROLAGEM_MANUAL_MS
      if (indice !== SEM_LINHA && !rolouAgora) centralizar(indice, true)
      setSeguindo(!rolouAgora)
    }, INTERVALO_SINCRONIA_MS)
    return () => window.clearInterval(intervalo)
  })

  function marcarRolagemManual() {
    ultimaRolagemManualRef.current = Date.now()
    setSeguindo(false)
  }

  function voltarParaAtual() {
    ultimaRolagemManualRef.current = 0
    setSeguindo(true)
    if (ativaRef.current !== SEM_LINHA) centralizar(ativaRef.current, true)
  }

  function registrarElemento(indice: number, elemento: HTMLDivElement | null) {
    if (elemento) {
      elementosRef.current.set(indice, elemento)
      return
    }
    elementosRef.current.delete(indice)
  }

  function alternarSelecao(indice: number) {
    setSelecionada((atual) => (atual === indice ? null : indice))
  }

  const linhaSelecionada = selecionada === null ? null : letra.linhas[selecionada]
  const idFalaLinha = `linha-${selecionada}`
  const idFalaLinhaLenta = `linha-lenta-${selecionada}`

  return (
    <Box position="relative">
      <VStack
        ref={containerRef}
        align="stretch"
        gap={1}
        position="relative"
        maxH={{ base: '65dvh', lg: 'calc(100dvh - 240px)' }}
        overflowY="auto"
        py={{ base: 6, lg: '30dvh' }}
        px={1}
        onWheel={marcarRolagemManual}
        onTouchMove={marcarRolagemManual}
        css={{
          scrollbarWidth: 'thin',
          maskImage:
            'linear-gradient(to bottom, transparent 0, black 8%, black 92%, transparent 100%)',
        }}
      >
        {letra.linhas.map((linha, indice) => (
          <Fragment key={`${indice}-${linha.inicioMs ?? 'x'}`}>
            <LinhaLetraItem
              linha={linha}
              indice={indice}
              estado={sincronizada ? estadoDaLinha(indice, ativa) : 'futura'}
              selecionada={indice === selecionada}
              modo={modo}
              mostrarPronuncia={mostrarPronuncia}
              mostrarTraducao={mostrarTraducao}
              onSelecionar={alternarSelecao}
              registrarElemento={registrarElemento}
            />
            {indice === selecionada && linhaSelecionada?.analise && (
              <Box
                mx={2}
                mb={3}
                p={4}
                borderRadius="12px"
                borderWidth="1px"
                borderColor="cirqueira.brand.400/40"
                bg="bg.panel"
                animation="fade-in 0.2s ease-out"
              >
                <HStack justify="space-between" mb={3} gap={2} flexWrap="wrap">
                  <HStack gap={1.5}>
                    <Button
                      size="xs"
                      variant={fala.falandoId === idFalaLinha ? 'solid' : 'subtle'}
                      colorPalette="brand"
                      borderRadius="full"
                      disabled={!fala.suportado}
                      onClick={() =>
                        fala.falar(linhaSelecionada.texto, {
                          id: idFalaLinha,
                          velocidade: VELOCIDADE_NORMAL,
                        })
                      }
                    >
                      {fala.falandoId === idFalaLinha ? (
                        <Square size={12} />
                      ) : (
                        <Volume2 size={13} />
                      )}
                      Ouvir linha
                    </Button>
                    <Button
                      size="xs"
                      variant="outline"
                      borderRadius="full"
                      disabled={!fala.suportado}
                      onClick={() =>
                        fala.falar(linhaSelecionada.texto, {
                          id: idFalaLinhaLenta,
                          velocidade: VELOCIDADE_LENTA,
                        })
                      }
                    >
                      {fala.falandoId === idFalaLinhaLenta ? (
                        <Square size={12} />
                      ) : (
                        <Snail size={13} />
                      )}
                      Devagar
                    </Button>
                  </HStack>
                  <IconButton
                    size="xs"
                    variant="ghost"
                    borderRadius="full"
                    aria-label="Fechar detalhes"
                    onClick={() => setSelecionada(null)}
                  >
                    <X size={14} />
                  </IconButton>
                </HStack>
                <PalavrasPronunciadas analise={linhaSelecionada.analise} fala={fala} modo={modo} />
              </Box>
            )}
          </Fragment>
        ))}
      </VStack>

      {sincronizada && !seguindo && (
        <Button
          position="absolute"
          bottom={4}
          left="50%"
          transform="translateX(-50%)"
          size="sm"
          colorPalette="brand"
          borderRadius="full"
          shadow="lg"
          onClick={voltarParaAtual}
        >
          <LocateFixed size={14} />
          Voltar para a linha atual
        </Button>
      )}
    </Box>
  )
})
