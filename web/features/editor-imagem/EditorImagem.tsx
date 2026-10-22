import { useCategorias } from '@/features/downloads-video/hooks/useDownloadsVideo'
import { useSEO } from '@/shared/hooks'
import { Box, Button, HStack, Kbd, Text, VStack } from '@chakra-ui/react'
import { ImageOff } from 'lucide-react'
import { type ChangeEvent, type DragEvent, memo, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { AreaEdicaoCanvas } from './components/AreaEdicaoCanvas'
import { BarraFerramentasEditor } from './components/BarraFerramentasEditor'
import { CabecalhoEditor } from './components/CabecalhoEditor'
import { type DadosSalvarEdicao, ModalSalvarEdicao } from './components/ModalSalvarEdicao'
import { PainelPropriedades } from './components/PainelPropriedades'
import { ZonaColarImagem } from './components/ZonaColarImagem'
import { useAtalhosEditor } from './hooks/useAtalhosEditor'
import { useEditorImagem } from './hooks/useEditorImagem'
import { useImagemDaMidia, useSalvarEdicao } from './hooks/useEditorImagemApi'
import { useExportacaoEdicao } from './hooks/useExportacaoEdicao'
import type { ComandoAtalho } from './types'
import { extrairImagemDaTransferencia } from './utils/areaTransferencia'
import { descreverImagem } from './utils/carregamentoImagem'
import {
  gerarImagemEditada,
  sanitizarNomeArquivo,
  sugerirNomeArquivo,
} from './utils/exportacaoImagem'

const PARAMETRO_MIDIA = 'midia'
const TIPOS_ACEITOS = 'image/png,image/jpeg,image/webp,image/gif'

export function Component() {
  return <EditorImagemView />
}

const EditorImagemView = memo(function EditorImagemView() {
  useSEO({
    title: 'Editor de Imagem',
    description:
      'Cole um print com Ctrl + V, aponte campos com setas, formas e texto e copie de volta.',
    keywords: 'editor de imagem, anotar print, setas, cirqueirax',
  })

  const [parametros, setParametros] = useSearchParams()
  const midiaUuid = parametros.get(PARAMETRO_MIDIA)
  const consultaMidia = useImagemDaMidia(midiaUuid)
  const editor = useEditorImagem(consultaMidia.data ?? null)
  const exportacao = useExportacaoEdicao()
  const { data: categorias = [] } = useCategorias()
  const salvarEdicao = useSalvarEdicao(categorias)
  const [modalSalvarAberto, setModalSalvarAberto] = useState(false)
  const [arrastandoArquivo, setArrastandoArquivo] = useState(false)
  const seletorArquivoRef = useRef<HTMLInputElement>(null)

  const { imagem } = editor

  function abrirImagem(arquivo: File) {
    if (midiaUuid) setParametros({}, { replace: true })
    editor.carregarArquivoColado(arquivo)
  }

  function copiar() {
    if (!imagem) return
    exportacao.copiar(imagem, editor.obterAnotacoesConfirmadas())
  }

  function baixar() {
    if (!imagem) return
    exportacao.baixar(imagem, editor.obterAnotacoesConfirmadas())
  }

  function abrirModalSalvar() {
    if (!imagem) return
    editor.confirmarTexto()
    setModalSalvarAberto(true)
  }

  async function salvar(dados: DadosSalvarEdicao) {
    if (!imagem) return
    const arquivo = await gerarImagemEditada(imagem, editor.obterAnotacoesConfirmadas())
    salvarEdicao.mutate(
      {
        arquivo,
        nomeArquivo: sanitizarNomeArquivo(dados.nomeArquivo),
        categoriaId: dados.categoriaId,
        mediaItemOrigemUuid: imagem.mediaItemOrigemUuid,
      },
      { onSuccess: () => setModalSalvarAberto(false) }
    )
  }

  function executarComando(comando: ComandoAtalho) {
    if (comando.tipo === 'ferramenta') editor.selecionarFerramenta(comando.ferramenta)
    if (comando.tipo === 'desfazer') editor.desfazer()
    if (comando.tipo === 'refazer') editor.refazer()
    if (comando.tipo === 'cancelar') editor.cancelarAcaoAtual()
    if (comando.tipo === 'copiar') copiar()
    if (comando.tipo === 'salvar') abrirModalSalvar()
    if (comando.tipo === 'excluir') editor.excluirSelecionada()
    if (comando.tipo === 'duplicar') editor.duplicarSelecionada()
    if (comando.tipo === 'deslocar') editor.deslocarSelecionada(comando.dx, comando.dy)
  }

  useAtalhosEditor({ aoColarImagem: abrirImagem, aoExecutarComando: executarComando })

  function aoSoltarArquivo(evento: DragEvent<HTMLDivElement>) {
    evento.preventDefault()
    setArrastandoArquivo(false)
    const arquivo = extrairImagemDaTransferencia(evento.dataTransfer)
    if (arquivo) abrirImagem(arquivo)
  }

  function aoArrastarSobre(evento: DragEvent<HTMLDivElement>) {
    evento.preventDefault()
    if (!arrastandoArquivo) setArrastandoArquivo(true)
  }

  function aoEscolherArquivo(evento: ChangeEvent<HTMLInputElement>) {
    const arquivo = evento.target.files?.[0]
    evento.target.value = ''
    if (arquivo) abrirImagem(arquivo)
  }

  const carregando = editor.carregandoImagem || consultaMidia.isLoading

  return (
    <Box
      w="full"
      maxW="full"
      mx="auto"
      py={{ base: 4, md: 6 }}
      px={{ base: 4, md: 8 }}
      onDragOver={aoArrastarSobre}
      onDragLeave={() => setArrastandoArquivo(false)}
      onDrop={aoSoltarArquivo}
    >
      <input
        ref={seletorArquivoRef}
        type="file"
        accept={TIPOS_ACEITOS}
        onChange={aoEscolherArquivo}
        style={{ display: 'none' }}
      />

      <VStack w="full" gap={4} alignItems="stretch">
        <CabecalhoEditor
          descricaoImagem={imagem ? descreverImagem(imagem, editor.recorte) : null}
          temImagem={Boolean(imagem)}
          copiando={exportacao.copiando}
          onAbrirArquivo={() => seletorArquivoRef.current?.click()}
          onBaixar={baixar}
          onSalvar={abrirModalSalvar}
          onCopiar={copiar}
        />

        {imagem && (
          <BarraFerramentasEditor
            ferramenta={editor.ferramenta}
            estilo={editor.estilo}
            podeDesfazer={editor.podeDesfazer}
            podeRefazer={editor.podeRefazer}
            temAnotacoes={editor.temAnotacoes}
            onSelecionarFerramenta={editor.selecionarFerramenta}
            onSelecionarCor={editor.selecionarCor}
            onSelecionarEspessura={editor.selecionarEspessura}
            onDesfazer={editor.desfazer}
            onRefazer={editor.refazer}
            onLimpar={editor.limpar}
          />
        )}

        {imagem && (
          <Box
            minH={{ base: '46px', md: '54px' }}
            h={{ md: '54px' }}
            display="flex"
            justifyContent="center"
            alignItems="center"
          >
            {editor.selecionada ? (
              <PainelPropriedades
                anotacao={editor.selecionada}
                imagem={imagem}
                onPrevisualizar={editor.previsualizarAlteracao}
                onConfirmar={editor.confirmarAlteracao}
                onTrazerParaFrente={editor.trazerSelecionadaParaFrente}
                onDuplicar={editor.duplicarSelecionada}
                onExcluir={editor.excluirSelecionada}
              />
            ) : (
              <Text fontSize="xs" color="fg.subtle" textAlign="center">
                Clique numa forma para mover, esticar pelas alças e ajustar borda, arredondamento e
                preenchimento. Duplo clique edita um texto.
              </Text>
            )}
          </Box>
        )}

        <Box
          display="flex"
          alignItems="center"
          justifyContent="center"
          minH={{ base: '55dvh', md: 'calc(100dvh - 260px)' }}
          p={{ base: 3, md: 6 }}
          borderRadius="xl"
          borderWidth="1px"
          borderStyle={imagem ? 'solid' : 'dashed'}
          borderColor={arrastandoArquivo ? 'cirqueira.brand.500' : 'border.subtle'}
          bg={arrastandoArquivo ? 'cirqueira.brand.500/5' : 'bg.subtle'}
          transition="border-color 0.15s ease, background 0.15s ease"
        >
          {imagem && !editor.carregandoImagem ? (
            <AreaEdicaoCanvas
              imagem={imagem}
              ferramenta={editor.ferramenta}
              estilo={editor.estilo}
              textoEmEdicao={editor.textoEmEdicao}
              registrarCanvasBase={editor.registrarCanvasBase}
              registrarCanvasSobreposicao={editor.registrarCanvasSobreposicao}
              onIniciarDesenho={editor.iniciarDesenho}
              onMoverDesenho={editor.moverDesenho}
              onFinalizarDesenho={editor.finalizarDesenho}
              onDuploClique={editor.editarTextoComDuploClique}
              onAtualizarTexto={editor.atualizarTexto}
              onConfirmarTexto={editor.confirmarTexto}
              onCancelarTexto={editor.cancelarAcaoAtual}
            />
          ) : consultaMidia.isError ? (
            <VStack gap={3} color="fg.subtle" textAlign="center">
              <ImageOff size={32} strokeWidth={1.5} />
              <Text fontSize="sm">Não foi possível abrir essa mídia. Cole outra imagem.</Text>
              <Button
                size="sm"
                variant="outline"
                borderRadius="lg"
                onClick={() => setParametros({})}
              >
                Começar do zero
              </Button>
            </VStack>
          ) : (
            <ZonaColarImagem
              carregando={carregando}
              onEscolherArquivo={() => seletorArquivoRef.current?.click()}
            />
          )}
        </Box>

        {imagem && (
          <HStack gap={4} fontSize="xs" color="fg.subtle" justify="center" flexWrap="wrap">
            <Text as="span">
              <Kbd size="sm">Shift</Kbd> linha reta ou quadrado
            </Text>
            <Text as="span">
              <Kbd size="sm">Ctrl</Kbd> + <Kbd size="sm">Z</Kbd> desfazer
            </Text>
            <Text as="span">
              <Kbd size="sm">Ctrl</Kbd> + <Kbd size="sm">C</Kbd> copiar
            </Text>
            <Text as="span">
              <Kbd size="sm">Ctrl</Kbd> + <Kbd size="sm">V</Kbd> nova imagem
            </Text>
          </HStack>
        )}
      </VStack>

      {imagem && (
        <ModalSalvarEdicao
          aberto={modalSalvarAberto}
          nomeSugerido={sugerirNomeArquivo(imagem)}
          categorias={categorias}
          mantemDataOriginal={Boolean(imagem.mediaItemOrigemUuid)}
          salvando={salvarEdicao.isPending}
          onFechar={() => setModalSalvarAberto(false)}
          onSalvar={salvar}
        />
      )}
    </Box>
  )
})

export default EditorImagemView
