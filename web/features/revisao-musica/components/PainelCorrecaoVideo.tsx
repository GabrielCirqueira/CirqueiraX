import { Button, HStack, NativeSelect, Text, VStack } from '@chakra-ui/react'
import { memo, useState } from 'react'
import type { CorrecaoVideoPayload, MusicaCatalogo, VideoRevisao } from '../types'
import {
  OPCOES_VERSAO_MUSICA,
  componentesIniciais,
  componentesValidos,
  novaMusicaValida,
  paraComponentesEntrada,
  separarArtistas,
} from '../utils'
import { BuscaMusicaCatalogo } from './BuscaCatalogo'
import { CamposNovaMusica, type NovaMusicaRascunho } from './CamposNovaMusica'
import { EditorComponentesMashup } from './EditorComponentesMashup'
import { JanelaRevisaoMusica } from './JanelaRevisaoMusica'

export type ModoCorrecaoVideo = 'escolher' | 'mashup'

type OrigemEscolha = 'catalogo' | 'nova'

export interface PainelCorrecaoVideoProps {
  modo: ModoCorrecaoVideo
  videos: VideoRevisao[]
  salvando: boolean
  onFechar: () => void
  onConfirmar: (payload: CorrecaoVideoPayload) => void
  onConfirmarLote: (musicaUuid: string) => void
}

export const PainelCorrecaoVideo = memo(function PainelCorrecaoVideo({
  modo,
  videos,
  salvando,
  onFechar,
  onConfirmar,
  onConfirmarLote,
}: PainelCorrecaoVideoProps) {
  const lote = videos.length > 1
  const primeiro = videos[0] ?? null
  const [origem, setOrigem] = useState<OrigemEscolha>('catalogo')
  const [musica, setMusica] = useState<MusicaCatalogo | null>(null)
  const [versao, setVersao] = useState(primeiro?.tipoVersao ?? 'original')
  const [nova, setNova] = useState<NovaMusicaRascunho>({
    titulo: primeiro?.sugestaoIa?.componentes[0]?.titulo ?? '',
    artistas: (primeiro?.sugestaoIa?.componentes[0]?.artistas ?? []).join(', '),
    versao: primeiro?.tipoVersao ?? 'original',
  })
  const [componentes, setComponentes] = useState(() => componentesIniciais(primeiro))

  const titulo =
    modo === 'mashup'
      ? 'Marcar como mashup'
      : lote
        ? `Definir a mesma música para ${videos.length} vídeos`
        : 'Escolher música'

  const podeConfirmar =
    modo === 'mashup'
      ? componentesValidos(componentes)
      : origem === 'catalogo'
        ? musica !== null
        : novaMusicaValida(nova.titulo, nova.artistas)

  function confirmar() {
    if (modo === 'mashup') {
      onConfirmar({
        acao: 'definir_mashup',
        componentes: paraComponentesEntrada(componentes),
        versao,
      })
      return
    }
    if (origem === 'catalogo' && musica) {
      if (lote) {
        onConfirmarLote(musica.uuid)
        return
      }
      onConfirmar({ acao: 'definir_musica', musicaUuid: musica.uuid, versao })
      return
    }
    onConfirmar({
      acao: 'definir_musica',
      titulo: nova.titulo.trim(),
      artistas: separarArtistas(nova.artistas),
      versao: nova.versao,
    })
  }

  const rodape = (
    <HStack gap={3} justify="flex-end" w="full">
      <Button variant="ghost" borderRadius="full" onClick={onFechar} disabled={salvando}>
        Cancelar
      </Button>
      <Button
        borderRadius="full"
        bg="cirqueira.musica.verde"
        color="cirqueira.musica.fundo"
        _hover={{ bg: 'cirqueira.musica.verdeHover' }}
        disabled={!podeConfirmar}
        loading={salvando}
        onClick={confirmar}
      >
        Salvar
      </Button>
    </HStack>
  )

  const seletorVersao = !lote && (
    <NativeSelect.Root size="sm" maxW="220px">
      <NativeSelect.Field
        aria-label="Versão deste vídeo"
        value={versao}
        onChange={(evento) => setVersao(evento.target.value)}
        bg="cirqueira.musica.fundo"
        borderColor="cirqueira.musica.cartaoElevado"
      >
        {OPCOES_VERSAO_MUSICA.map((opcao) => (
          <option key={opcao.valor} value={opcao.valor}>
            {opcao.rotulo}
          </option>
        ))}
      </NativeSelect.Field>
      <NativeSelect.Indicator />
    </NativeSelect.Root>
  )

  return (
    <JanelaRevisaoMusica aberto titulo={titulo} onFechar={onFechar} rodape={rodape}>
      <VStack align="stretch" gap={4}>
        {primeiro && !lote && (
          <Text fontSize="xs" color="cirqueira.musica.textoSecundario">
            Vídeo: {primeiro.titulo} · {primeiro.canal}
          </Text>
        )}

        {modo === 'mashup' ? (
          <VStack align="stretch" gap={3}>
            <EditorComponentesMashup componentes={componentes} onAlterar={setComponentes} />
            {seletorVersao}
          </VStack>
        ) : (
          <VStack align="stretch" gap={3}>
            {!lote && (
              <HStack gap={2} role="radiogroup" aria-label="Origem da música">
                {(['catalogo', 'nova'] as const).map((opcao) => (
                  <Button
                    key={opcao}
                    size="xs"
                    borderRadius="full"
                    role="radio"
                    aria-checked={origem === opcao}
                    variant={origem === opcao ? 'solid' : 'outline'}
                    bg={origem === opcao ? 'cirqueira.musica.cartaoElevado' : 'transparent'}
                    color="cirqueira.musica.textoPrincipal"
                    borderColor="cirqueira.musica.cartaoElevado"
                    onClick={() => setOrigem(opcao)}
                  >
                    {opcao === 'catalogo' ? 'Buscar no catálogo' : 'Criar nova'}
                  </Button>
                ))}
              </HStack>
            )}
            {origem === 'catalogo' ? (
              <VStack align="stretch" gap={3}>
                <BuscaMusicaCatalogo selecionada={musica} onEscolher={setMusica} />
                {seletorVersao}
              </VStack>
            ) : (
              <CamposNovaMusica valor={nova} onAlterar={setNova} />
            )}
          </VStack>
        )}
      </VStack>
    </JanelaRevisaoMusica>
  )
})
