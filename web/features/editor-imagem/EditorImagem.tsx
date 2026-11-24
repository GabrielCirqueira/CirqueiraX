import { useCategorias } from '@/features/downloads-video/hooks/useDownloadsVideo'
import { useMountEffect, useSEO } from '@/shared/hooks'
import { Box, Button, Grid, HStack, Kbd, Text, VStack } from '@chakra-ui/react'
import { ImageOff, MousePointerClick } from 'lucide-react'
import { type ChangeEvent, type DragEvent, memo, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { AreaEdicaoCanvas } from './components/AreaEdicaoCanvas'
import { BarraFerramentasEditor } from './components/BarraFerramentasEditor'
import { CabecalhoEditor } from './components/CabecalhoEditor'
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
import type { AlteracaoAnotacao, ComandoAtalho } from './types'
import { extrairImagemDaTransferencia } from './utils/areaTransferencia'
import { descreverImagem } from './utils/carregamentoImagem'
import {
  type FormatoExportacao,
  gerarImagemEditada,
  sanitizarNomeArquivo,
  sugerirNomeArquivo,
} from './utils/exportacaoImagem'
import './utils/fontesEditor'

const PARAMETRO_MIDIA = 'midia'
const TIPOS_ACEITOS = 'image/png,image/jpeg,image/webp,image/gif'

interface DicaAtalho {
  teclas: string[]
  descricao: string
}

const DICAS_ATALHO: DicaAtalho[] = [
  { teclas: ['Shift'], descricao: 'reta, quadrado ou proporção' },
  { teclas: ['Ctrl', 'Z'], descricao: 'desfazer' },
  { teclas: ['Ctrl', 'D'], descricao: 'duplicar' },
  { teclas: ['[ ]'], descricao: 'tamanho' },
  { teclas: ['Ctrl', ']'], descricao: 'camada' },
  { teclas: ['Ctrl', 'C'], descricao: 'copiar' },
  { teclas: ['Ctrl', 'V'], descricao: 'colar imagem' },
]

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
  const seletorArquivoRef = useRef<HTMLInputElement>(null)

  const { imagem } = editor

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
          onNovaTela={comecarDoZero}
          onBaixar={baixar}
          onSalvar={abrirModalSalvar}
          onCopiar={copiar}
        />

        {imagem && (
          <BarraFerramentasEditor
            ferramenta={editor.ferramenta}
            estilo={editor.estilo}
            coresRecentes={coresRecentes}
            podeDesfazer={editor.podeDesfazer}
            podeRefazer={editor.podeRefazer}
            temAnotacoes={editor.temAnotacoes}
            onSelecionarFerramenta={editor.selecionarFerramenta}
            onSelecionarCor={selecionarCor}
            onSelecionarEspessura={editor.selecionarEspessura}
            onDesfazer={editor.desfazer}
            onRefazer={editor.refazer}
            onLimpar={editor.limpar}
          />
        )}

        <Grid
          templateColumns={{ base: 'minmax(0, 1fr)', lg: imagem ? 'minmax(0, 1fr) 300px' : '1fr' }}
          gap={4}
          alignItems="start"
        >
          <Box
            display="flex"
            alignItems="center"
            justifyContent="center"
            minH={{ base: '55dvh', md: 'calc(100dvh - 230px)' }}
            p={{ base: 3, md: 6 }}
            borderRadius="8px"
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
                <Button size="sm" variant="outline" borderRadius="full" onClick={comecarDoZero}>
                  Começar do zero
                </Button>
              </VStack>
            ) : (
              <ZonaColarImagem
                carregando={carregando || !imagem}
                onEscolherArquivo={() => seletorArquivoRef.current?.click()}
              />
            )}
          </Box>

          {imagem && (
            <VStack gap={3} alignItems="stretch">
              {editor.alvoPainel ? (
                <PainelPropriedades
                  alvo={editor.alvoPainel}
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
                <HStack
                  gap={2.5}
                  p={3}
                  bg="bg.panel"
                  borderWidth="1px"
                  borderColor="border.subtle"
                  borderRadius="8px"
                  color="fg.subtle"
                >
                  <MousePointerClick size={18} />
                  <Text fontSize="xs">
                    Clique num item para mover, esticar pelas alças e mudar cor, tamanho e
                    preenchimento. Duplo clique edita um texto.
                  </Text>
                </HStack>
              )}

              <ListaCamadas
                anotacoes={editor.historico.anotacoes}
                selecionadaId={editor.selecionada?.id ?? null}
                onSelecionar={editor.selecionarAnotacao}
                onMover={editor.moverCamada}
                onExcluir={editor.excluirAnotacao}
              />

              <PainelTela
                imagem={imagem}
                coresRecentes={coresRecentes}
                onConfigurar={editor.configurarTela}
                onNovaTela={comecarDoZero}
              />
            </VStack>
          )}
        </Grid>

        {imagem && (
          <HStack gap={4} fontSize="xs" color="fg.subtle" justify="center" flexWrap="wrap">
            {DICAS_ATALHO.map((dica) => (
              <Text as="span" key={dica.descricao}>
                {dica.teclas.map((tecla, indice) => (
                  <Box as="span" key={tecla}>
                    {indice > 0 && ' + '}
                    <Kbd size="sm">{tecla}</Kbd>
                  </Box>
                ))}{' '}
                {dica.descricao}
              </Text>
            ))}
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
