import { useCategorias } from '@/features/downloads-video/hooks/useDownloadsVideo'
import { useMountEffect, useSEO } from '@/shared/hooks'
import { Box, Button, Flex, Tabs, Text, VStack } from '@chakra-ui/react'
import { Frame, ImageOff, Layers, MousePointerClick, SlidersHorizontal } from 'lucide-react'
import { type ChangeEvent, type DragEvent, memo, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { AreaEdicaoCanvas } from './components/AreaEdicaoCanvas'
import { BarraEstiloRapido } from './components/BarraEstiloRapido'
import { BarraFerramentasEditor } from './components/BarraFerramentasEditor'
import { CabecalhoEditor } from './components/CabecalhoEditor'
import { ControleZoom } from './components/ControleZoom'
import { ListaCamadas } from './components/ListaCamadas'
import { type DadosSalvarEdicao, ModalSalvarEdicao } from './components/ModalSalvarEdicao'
import { PainelPropriedades } from './components/PainelPropriedades'
import { PainelTela } from './components/PainelTela'
import { ZonaColarImagem } from './components/ZonaColarImagem'
import { useAtalhosEditor } from './hooks/useAtalhosEditor'
import { useCoresRecentes } from './hooks/useCoresRecentes'
import { useEditorImagem } from './hooks/useEditorImagem'
import { useImagemDaMidia, useSalvarEdicao } from './hooks/useEditorImagemApi'
import { useExportacaoEdicao } from './hooks/useExportacaoEdicao'
import { useZoomEditor } from './hooks/useZoomEditor'
import type { AlteracaoAnotacao, Anotacao, ComandoAtalho } from './types'
import { extrairImagemDaTransferencia } from './utils/areaTransferencia'
import { descreverImagem } from './utils/carregamentoImagem'
import {
  type FormatoExportacao,
  gerarImagemEditada,
  sanitizarNomeArquivo,
  sugerirNomeArquivo,
} from './utils/exportacaoImagem'
import './utils/fontesEditor'
import { ROTULO_TIPO_ANOTACAO, temPropriedade } from './utils/propriedadesPainel'

const PARAMETRO_MIDIA = 'midia'
const TIPOS_ACEITOS = 'image/png,image/jpeg,image/webp,image/gif'

type AbaPainel = 'estilo' | 'camadas' | 'tela'

const ALTURA_CABECALHO_APP = '56px'
const FUNDO_AREA_TRABALHO =
  'radial-gradient(circle, color-mix(in srgb, var(--chakra-colors-fg) 14%, transparent) 1px, transparent 1px) 0 0 / 18px 18px'

export function Component() {
  return <EditorImagemView />
}

const EditorImagemView = memo(function EditorImagemView() {
  useSEO({
    title: 'Editor de Imagem',
    description:
      'Cole um print ou crie uma imagem do zero com formas, texto, setas e cores, e copie de volta.',
    keywords: 'editor de imagem, anotar print, criar imagem, formas, texto, cirqueirax',
  })

  const [parametros, setParametros] = useSearchParams()
  const midiaUuid = parametros.get(PARAMETRO_MIDIA)
  const consultaMidia = useImagemDaMidia(midiaUuid)
  const editor = useEditorImagem(consultaMidia.data ?? null)
  const exportacao = useExportacaoEdicao()
  const { coresRecentes, registrarCor } = useCoresRecentes()
  const { data: categorias = [] } = useCategorias()
  const salvarEdicao = useSalvarEdicao(categorias)
  const [modalSalvarAberto, setModalSalvarAberto] = useState(false)
  const [arrastandoArquivo, setArrastandoArquivo] = useState(false)
  const [aba, setAba] = useState<AbaPainel>('estilo')
  const [ultimaSelecionadaId, setUltimaSelecionadaId] = useState<string | null>(null)
  const seletorArquivoRef = useRef<HTMLInputElement>(null)

  const { imagem, recorte, selecionada } = editor
  const zoom = useZoomEditor(recorte?.largura ?? 0, recorte?.altura ?? 0)

  // Ao selecionar um item (no canvas ou na lista), o painel mostra o estilo dele.
  const selecionadaId = selecionada?.id ?? null
  if (selecionadaId !== ultimaSelecionadaId) {
    setUltimaSelecionadaId(selecionadaId)
    if (selecionadaId) setAba('estilo')
  }

  /** Selecionar pela lista mantém a aba de camadas aberta. */
  function selecionarPelaLista(id: string) {
    setUltimaSelecionadaId(id)
    editor.selecionarAnotacao(id)
  }

  useMountEffect(() => {
    if (!midiaUuid) editor.novaTela()
  })

  function abrirImagem(arquivo: File) {
    if (midiaUuid) setParametros({}, { replace: true })
    editor.carregarArquivoColado(arquivo)
  }

  function comecarDoZero() {
    if (midiaUuid) setParametros({}, { replace: true })
    editor.novaTela()
  }

  function copiar() {
    if (!imagem) return
    exportacao.copiar(imagem, editor.obterAnotacoesConfirmadas())
  }

  function baixar(formato: FormatoExportacao) {
    if (!imagem) return
    exportacao.baixar(imagem, editor.obterAnotacoesConfirmadas(), formato)
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

  function selecionarCor(cor: string) {
    registrarCor(cor)
    editor.selecionarCor(cor)
  }

  function confirmarAlteracao(alteracao: AlteracaoAnotacao) {
    if (alteracao.cor) registrarCor(alteracao.cor)
    if (alteracao.corPreenchimento) registrarCor(alteracao.corPreenchimento)
    editor.confirmarAlteracao(alteracao)
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
    if (comando.tipo === 'camada') editor.moverCamada(comando.direcao)
    if (comando.tipo === 'ajustarTamanho') editor.ajustarTamanhoSelecionada(comando.passo)
    if (comando.tipo === 'zoom') zoom.aplicar(comando.acao)
    if (comando.tipo === 'travarFerramenta') editor.alternarTravarFerramenta()
  }

  function colarAnotacao(anotacao: Anotacao | null): boolean {
    if (!imagem) return false
    return editor.colarAnotacao(anotacao)
  }

  function colarTexto(texto: string) {
    if (imagem) editor.colarTexto(texto)
  }

  useAtalhosEditor({
    aoColarImagem: abrirImagem,
    aoExecutarComando: executarComando,
    aoCopiarSelecao: (recortar) =>
      recortar ? editor.recortarSelecionada() : editor.copiarSelecionada(),
    aoColarAnotacao: colarAnotacao,
    aoColarTexto: colarTexto,
  })

  /** Botão "copiar item": passa pelo evento nativo para o Ctrl + V seguinte colar o item. */
  function copiarItemPeloBotao() {
    try {
      if (document.execCommand('copy')) return
    } catch {
      // segue para a cópia interna
    }
    editor.copiarSelecionada()
  }

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
  const alvo = editor.alvoPainel
  const totalCamadas = editor.historico.anotacoes.filter((item) => item.tipo !== 'recorte').length

  const areaVazia = consultaMidia.isError ? (
    <VStack gap={3} color="fg.subtle" textAlign="center" m="auto">
      <ImageOff size={32} strokeWidth={1.5} />
      <Text fontSize="sm">Não foi possível abrir essa mídia. Cole outra imagem.</Text>
      <Button size="sm" variant="outline" borderRadius="8px" onClick={comecarDoZero}>
        Começar do zero
      </Button>
    </VStack>
  ) : (
    <Box m="auto">
      <ZonaColarImagem
        carregando={carregando || !imagem}
        onEscolherArquivo={() => seletorArquivoRef.current?.click()}
      />
    </Box>
  )

  return (
    <Flex
      direction="column"
      w="full"
      h={{ base: 'auto', lg: `calc(100dvh - ${ALTURA_CABECALHO_APP})` }}
      minH={{ base: `calc(100dvh - ${ALTURA_CABECALHO_APP})`, lg: 0 }}
      overflow={{ base: 'visible', lg: 'hidden' }}
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

      <CabecalhoEditor
        descricaoImagem={imagem ? descreverImagem(imagem, recorte) : null}
        temImagem={Boolean(imagem)}
        copiando={exportacao.copiando}
        podeDesfazer={editor.podeDesfazer}
        podeRefazer={editor.podeRefazer}
        temAnotacoes={editor.temAnotacoes}
        onDesfazer={editor.desfazer}
        onRefazer={editor.refazer}
        onLimpar={editor.limpar}
        onAbrirArquivo={() => seletorArquivoRef.current?.click()}
        onNovaTela={comecarDoZero}
        onBaixar={baixar}
        onSalvar={abrirModalSalvar}
        onCopiar={copiar}
      />

      <Flex direction={{ base: 'column', lg: 'row' }} flex="1" minH={0}>
        {imagem && (
          <BarraFerramentasEditor
            ferramenta={editor.ferramenta}
            travarFerramenta={editor.travarFerramenta}
            onSelecionarFerramenta={editor.selecionarFerramenta}
            onAlternarTravar={editor.alternarTravarFerramenta}
          />
        )}

        <Box
          position="relative"
          flex="1"
          minW={0}
          minH={{ base: '60dvh', lg: 0 }}
          bg={arrastandoArquivo ? 'cirqueira.brand.500/8' : 'bg.subtle'}
          outline={arrastandoArquivo ? '2px dashed' : 'none'}
          outlineColor="cirqueira.brand.500"
          outlineOffset="-8px"
          transition="background 0.15s ease"
        >
          <Box
            ref={zoom.registrarArea}
            position="absolute"
            inset={0}
            display="flex"
            overflow="auto"
            p={{ base: 4, md: 6 }}
            pt={imagem ? { base: 16, md: 16 } : undefined}
            style={{ background: FUNDO_AREA_TRABALHO }}
          >
            {imagem && !editor.carregandoImagem && recorte ? (
              <AreaEdicaoCanvas
                imagem={imagem}
                larguraTela={recorte.largura}
                zoom={zoom.zoom}
                ferramenta={editor.ferramenta}
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
            ) : (
              areaVazia
            )}
          </Box>

          {imagem && (
            <Flex
              position="absolute"
              top={3}
              left={3}
              right={3}
              justify="center"
              pointerEvents="none"
              zIndex={2}
            >
              <Box pointerEvents="auto" maxW="full">
                <BarraEstiloRapido
                  estilo={editor.estilo}
                  coresRecentes={coresRecentes}
                  rotuloAlvo={selecionada ? ROTULO_TIPO_ANOTACAO[selecionada.tipo] : null}
                  semAlvo={!alvo}
                  temSelecao={Boolean(selecionada)}
                  bloqueada={Boolean(selecionada?.bloqueada)}
                  mostrarEspessura={Boolean(alvo && temPropriedade(alvo.tipo, 'espessura'))}
                  onSelecionarCor={selecionarCor}
                  onSelecionarEspessura={editor.selecionarEspessura}
                  onCopiar={copiarItemPeloBotao}
                  onDuplicar={editor.duplicarSelecionada}
                  onExcluir={editor.excluirSelecionada}
                />
              </Box>
            </Flex>
          )}

          {imagem && (
            <Box position="absolute" right={3} bottom={3} zIndex={2}>
              <ControleZoom zoom={zoom.zoom} ajustado={zoom.ajustado} onAplicar={zoom.aplicar} />
            </Box>
          )}
        </Box>

        {imagem && (
          <Flex
            as="aside"
            direction="column"
            w={{ base: 'full', lg: '320px' }}
            flexShrink={0}
            bg="bg.panel"
            borderColor="border.subtle"
            borderTopWidth={{ base: '1px', lg: 0 }}
            borderLeftWidth={{ base: 0, lg: '1px' }}
            minH={0}
          >
            <Tabs.Root
              value={aba}
              onValueChange={({ value }) => setAba(value as AbaPainel)}
              variant="line"
              size="sm"
              colorPalette="brand"
              display="flex"
              flexDirection="column"
              flex="1"
              minH={0}
            >
              <Tabs.List px={2} flexShrink={0}>
                <Tabs.Trigger value="estilo" flex="1" justifyContent="center">
                  <SlidersHorizontal size={14} />
                  Estilo
                </Tabs.Trigger>
                <Tabs.Trigger value="camadas" flex="1" justifyContent="center">
                  <Layers size={14} />
                  Camadas
                  {totalCamadas > 0 && (
                    <Box
                      as="span"
                      px={1.5}
                      borderRadius="full"
                      bg="bg.muted"
                      fontSize="2xs"
                      color="fg.muted"
                    >
                      {totalCamadas}
                    </Box>
                  )}
                </Tabs.Trigger>
                <Tabs.Trigger value="tela" flex="1" justifyContent="center">
                  <Frame size={14} />
                  {imagem.tela ? 'Tela' : 'Imagem'}
                </Tabs.Trigger>
              </Tabs.List>

              <Box flex="1" minH={0} overflowY="auto">
                <Tabs.Content value="estilo" p={4}>
                  {alvo ? (
                    <PainelPropriedades
                      alvo={alvo}
                      coresRecentes={coresRecentes}
                      onPrevisualizar={editor.previsualizarAlteracao}
                      onCancelarPrevisualizacao={editor.cancelarPrevisualizacao}
                      onConfirmar={confirmarAlteracao}
                      onEditarTexto={editor.editarTextoSelecionado}
                      onDuplicar={editor.duplicarSelecionada}
                      onExcluir={editor.excluirSelecionada}
                      onMoverCamada={editor.moverCamada}
                      onAlinhar={editor.alinharSelecionada}
                    />
                  ) : (
                    <VStack gap={3} py={8} color="fg.subtle" textAlign="center">
                      <MousePointerClick size={26} strokeWidth={1.5} />
                      <Text fontSize="sm" color="fg.muted" fontWeight="medium">
                        Nada selecionado
                      </Text>
                      <Text fontSize="xs" maxW="240px">
                        Clique num item para mover, esticar pelas alças e trocar cor, tamanho e
                        preenchimento. Ou escolha uma ferramenta à esquerda para desenhar.
                      </Text>
                    </VStack>
                  )}
                </Tabs.Content>
                <Tabs.Content value="camadas" p={3}>
                  <ListaCamadas
                    anotacoes={editor.historico.anotacoes}
                    selecionadaId={selecionadaId}
                    onSelecionar={selecionarPelaLista}
                    onMover={editor.moverCamada}
                    onExcluir={editor.excluirAnotacao}
                    onAlternarVisibilidade={editor.alternarVisibilidade}
                    onAlternarBloqueio={editor.alternarBloqueio}
                  />
                </Tabs.Content>
                <Tabs.Content value="tela" p={4}>
                  <PainelTela
                    imagem={imagem}
                    coresRecentes={coresRecentes}
                    onConfigurar={editor.configurarTela}
                    onNovaTela={comecarDoZero}
                  />
                </Tabs.Content>
              </Box>
            </Tabs.Root>
          </Flex>
        )}
      </Flex>

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
    </Flex>
  )
})

export default EditorImagemView
