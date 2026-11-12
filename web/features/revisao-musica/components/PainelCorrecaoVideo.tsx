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
import { AtalhosVideoRevisao } from './AtalhosVideoRevisao'
import { BuscaMusicaCatalogo } from './BuscaCatalogo'
import { CamposNovaMusica, type NovaMusicaRascunho } from './CamposNovaMusica'
import { EditorComponentesMashup } from './EditorComponentesMashup'
import { JanelaRevisaoMusica } from './JanelaRevisaoMusica'
import { MiniaturaVideoRevisao } from './MiniaturaVideoRevisao'

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
      ? 'Quais músicas formam este mashup?'
      : lote
        ? `Qual música toca nestes ${videos.length} vídeos?`
        : 'Qual música toca neste vídeo?'

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
      <Button
        variant="ghost"
        borderRadius="full"
        color="cirqueira.musica.textoSecundario"
        _hover={{ bg: 'cirqueira.musica.cartaoElevado', color: 'cirqueira.musica.textoPrincipal' }}
        onClick={onFechar}
        disabled={salvando}
      >
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
        Confirmar
      </Button>
    </HStack>
  )

  const seletorVersao = !lote && (
    <VStack align="stretch" gap={1}>
      <Text fontSize="xs" fontWeight="semibold" color="cirqueira.musica.textoSecundario">
        Versão tocada no vídeo
      </Text>
      <NativeSelect.Root size="sm" maxW="240px">
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
      <Text fontSize="2xs" color="cirqueira.musica.textoDesabilitado">
        Slowed, remix, ao vivo etc. contam para a música original, mas ficam separados nos detalhes.
      </Text>
    </VStack>
  )

  return (
    <JanelaRevisaoMusica aberto titulo={titulo} onFechar={onFechar} rodape={rodape}>
      <VStack align="stretch" gap={4}>
        {primeiro && !lote && (
          <HStack
            align="start"
            gap={3}
            px={3}
            py={2.5}
            borderRadius="8px"
            bg="cirqueira.musica.cartaoElevado"
          >
            <MiniaturaVideoRevisao
              imagem={primeiro.miniatura}
              videoId={primeiro.videoId}
              titulo={primeiro.titulo}
              largura={{ base: '96px', sm: '120px' }}
            />
            <VStack align="stretch" gap={1} minW={0} flex={1}>
              <Text fontSize="sm" color="cirqueira.musica.textoPrincipal" lineClamp={2}>
                {primeiro.titulo}
              </Text>
              <Text fontSize="xs" color="cirqueira.musica.textoSecundario" truncate>
                {primeiro.canal}
              </Text>
              <AtalhosVideoRevisao videoId={primeiro.videoId} />
            </VStack>
          </HStack>
        )}
        {lote && (
          <VStack align="stretch" gap={2}>
            {videos.map((video) => (
              <HStack key={video.uuid} gap={3} minW={0}>
                <MiniaturaVideoRevisao
                  imagem={video.miniatura}
                  videoId={video.videoId}
                  titulo={video.titulo}
                  largura={{ base: '64px', sm: '80px' }}
                />
                <Text fontSize="xs" color="cirqueira.musica.textoPrincipal" lineClamp={2} minW={0}>
                  {video.titulo}
                </Text>
              </HStack>
            ))}
          </VStack>
        )}
        <Text fontSize="xs" color="cirqueira.musica.textoSecundario">
          {modo === 'mashup'
            ? 'Informe cada música que aparece no mashup, com título e artistas.'
            : origem === 'catalogo'
              ? 'Procure pelo título ou artista e toque na música certa. Se ela ainda não existir, use “Criar nova”.'
              : 'Escreva o título e os artistas (separados por vírgula). A música é criada e o vídeo passa a contar para ela.'}
        </Text>

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
                    bg={origem === opcao ? 'cirqueira.musica.verde' : 'transparent'}
                    color={
                      origem === opcao
                        ? 'cirqueira.musica.fundo'
                        : 'cirqueira.musica.textoPrincipal'
                    }
                    borderColor="cirqueira.musica.textoDesabilitado"
                    onClick={() => setOrigem(opcao)}
                  >
                    {opcao === 'catalogo' ? 'Buscar música existente' : 'Criar nova'}
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
