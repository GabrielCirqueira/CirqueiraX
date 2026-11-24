import { formatarData, tempoRelativo } from '@/shared/utils/formatarData'
import { iniciaisNome } from '@/shared/utils/iniciaisNome'
import {
  Badge,
  Box,
  Button,
  Center,
  Dialog,
  HStack,
  IconButton,
  Portal,
  SimpleGrid,
  Skeleton,
  Text,
  VStack,
} from '@chakra-ui/react'
import {
  AudioLines,
  BookAudio,
  Bot,
  Calendar,
  Clock,
  Disc3,
  Download,
  FileAudio,
  FileText,
  Headphones,
  Image as IconeImagem,
  Link2,
  Mic,
  MonitorPlay,
  Music,
  Repeat,
  Send,
  Shield,
  Sparkles,
  Upload,
  Users,
  X,
} from 'lucide-react'
import { memo } from 'react'
import { useResumoAtividadeUsuario } from '../hooks'
import type { ResumoAtividadeUsuario, StatusContaIntegracao, UsuarioSistema } from '../types'
import {
  formatarBytesResumo,
  formatarDolarResumo,
  formatarMinutosResumo,
  formatarNumeroResumo,
} from '../utils/formatarResumoUsuario'
import {
  BarraFontesMusica,
  CartaoIndicador,
  GradeResumo,
  ListaTopoResumo,
  SecaoResumo,
} from './PecasResumoUsuario'

const ROTULOS_STATUS_CONTA: Record<StatusContaIntegracao, string> = {
  conectada: 'Conectada',
  reconectar: 'Reconectar',
  desconectada: 'Desconectada',
}

const CORES_STATUS_CONTA: Record<StatusContaIntegracao, string> = {
  conectada: 'green',
  reconectar: 'orange',
  desconectada: 'gray',
}

const FONTE_SPOTIFY = 'spotify'
const FONTE_YOUTUBE_MUSIC = 'youtube_music'

export interface ModalResumoUsuarioProps {
  usuario: UsuarioSistema | null
  onFechar: () => void
}

function ultimoTexto(data: string | null): string | undefined {
  return data ? `Último ${tempoRelativo(data)}` : undefined
}

function ChipConta({ nome, status }: { nome: string; status: StatusContaIntegracao | null }) {
  return (
    <Badge
      colorPalette={status ? CORES_STATUS_CONTA[status] : 'gray'}
      variant={status === 'conectada' ? 'subtle' : 'outline'}
      borderRadius="full"
      px={2.5}
      py={1}
    >
      <Link2 size={11} />
      {nome} · {status ? ROTULOS_STATUS_CONTA[status] : 'Não conectada'}
    </Badge>
  )
}

function SecaoMusica({ musica }: { musica: ResumoAtividadeUsuario['musica'] }) {
  const { totais, mes } = musica
  const minutosSpotify = totais.porFonte[FONTE_SPOTIFY]?.minutos ?? 0
  const minutosYoutube = totais.porFonte[FONTE_YOUTUBE_MUSIC]?.minutos ?? 0

  return (
    <SecaoResumo
      titulo="Música"
      icone={Music}
      acao={
        totais.primeira && (
          <Text fontSize="xs" color="fg.subtle">
            Desde {formatarData(totais.primeira)}
          </Text>
        )
      }
    >
      <GradeResumo>
        <CartaoIndicador
          destaque
          icone={Clock}
          rotulo="Tempo ouvindo"
          valor={formatarMinutosResumo(totais.minutos)}
          detalhe={`${formatarNumeroResumo(totais.minutos)} minutos`}
        />
        <CartaoIndicador
          destaque
          icone={Headphones}
          rotulo="Streams"
          valor={formatarNumeroResumo(totais.streams)}
          detalhe={`${formatarNumeroResumo(totais.reproducoes)} reproduções`}
        />
        <CartaoIndicador
          icone={Calendar}
          rotulo="Este mês"
          valor={formatarMinutosResumo(mes.minutos)}
          detalhe={`${formatarNumeroResumo(mes.streams)} streams · ${mes.musicas} músicas`}
        />
        <CartaoIndicador
          icone={Disc3}
          rotulo="Músicas diferentes"
          valor={formatarNumeroResumo(totais.musicas)}
          detalhe={`${formatarNumeroResumo(musica.exclusividade.ambas)} nas duas fontes`}
        />
        <CartaoIndicador
          icone={Users}
          rotulo="Artistas"
          valor={formatarNumeroResumo(totais.artistas)}
        />
        <CartaoIndicador
          icone={Repeat}
          rotulo="Dias ouvindo"
          valor={formatarNumeroResumo(totais.dias)}
          detalhe={totais.ultima ? `Última escuta ${tempoRelativo(totais.ultima)}` : undefined}
        />
      </GradeResumo>
      <BarraFontesMusica spotify={minutosSpotify} youtubeMusic={minutosYoutube} />
      <SimpleGrid columns={{ base: 1, md: 2 }} gap={2.5}>
        <ListaTopoResumo
          titulo="Músicas mais ouvidas"
          itens={musica.topMusicas.map((item, indice) => ({
            chave: item.musicaUuid ?? `${item.nomeFaixa}-${indice}`,
            titulo: item.nomeFaixa,
            subtitulo: item.artista,
            imagemUrl: item.imagemUrl,
            streams: item.streams,
          }))}
        />
        <ListaTopoResumo
          titulo="Artistas mais ouvidos"
          redondo
          itens={musica.topArtistas.map((item, indice) => ({
            chave: item.artistaUuid ?? `${item.nome}-${indice}`,
            titulo: item.nome,
            subtitulo: `${formatarMinutosResumo(item.minutos)}`,
            imagemUrl: item.imagemUrl,
            streams: item.streams,
          }))}
        />
      </SimpleGrid>
    </SecaoResumo>
  )
}

function SecaoDownloads({ resumo }: { resumo: ResumoAtividadeUsuario }) {
  const { midias, audios } = resumo
  const prints = midias.print_empresa.total + midias.print_pessoal.total

  return (
    <SecaoResumo titulo="Downloads e arquivos" icone={Download}>
      <GradeResumo>
        <CartaoIndicador
          icone={MonitorPlay}
          rotulo="Downloads de vídeo"
          valor={formatarNumeroResumo(midias.download.total)}
          detalhe={`${formatarBytesResumo(midias.download.bytes)}${midias.download.erros > 0 ? ` · ${midias.download.erros} com erro` : ''}`}
        />
        <CartaoIndicador
          icone={FileAudio}
          rotulo="Downloads MP3"
          valor={formatarNumeroResumo(audios.total)}
          detalhe={`${formatarMinutosResumo(audios.minutos)} · ${formatarBytesResumo(audios.bytes)}`}
        />
        <CartaoIndicador
          icone={IconeImagem}
          rotulo="Prints"
          valor={formatarNumeroResumo(prints)}
          detalhe={`${midias.print_pessoal.total} pessoais · ${midias.print_empresa.total} empresa`}
        />
        <CartaoIndicador
          icone={Send}
          rotulo="Via Telegram"
          valor={formatarNumeroResumo(midias.bot_telegram.total)}
          detalhe={ultimoTexto(midias.bot_telegram.ultimo)}
        />
        <CartaoIndicador
          icone={Upload}
          rotulo="Upload manual"
          valor={formatarNumeroResumo(midias.manual.total)}
          detalhe={ultimoTexto(midias.manual.ultimo)}
        />
        <CartaoIndicador
          icone={AudioLines}
          rotulo="MP3 disponíveis"
          valor={formatarNumeroResumo(audios.disponiveis)}
          detalhe={ultimoTexto(audios.ultimo)}
        />
      </GradeResumo>
    </SecaoResumo>
  )
}

function SecaoConteudo({ resumo }: { resumo: ResumoAtividadeUsuario }) {
  const { transcricoes, livrosAudio, youtube, ia, transferencias } = resumo

  return (
    <SecaoResumo titulo="Transcrições e outros" icone={FileText}>
      <GradeResumo>
        <CartaoIndicador
          icone={Mic}
          rotulo="Transcrições"
          valor={formatarNumeroResumo(transcricoes.total)}
          detalhe={`${transcricoes.concluidas} concluídas · ${formatarMinutosResumo(transcricoes.minutos)}`}
        />
        <CartaoIndicador
          icone={FileText}
          rotulo="Palavras transcritas"
          valor={formatarNumeroResumo(transcricoes.palavras)}
          detalhe={`${transcricoes.favoritas} favoritas · ${transcricoes.deVideo} de vídeo`}
        />
        <CartaoIndicador
          icone={BookAudio}
          rotulo="Livros em áudio"
          valor={formatarNumeroResumo(livrosAudio.total)}
          detalhe={`${livrosAudio.prontos} prontos · ${formatarNumeroResumo(livrosAudio.paginas)} páginas`}
        />
        <CartaoIndicador
          icone={MonitorPlay}
          rotulo="Vídeos no YouTube"
          valor={formatarNumeroResumo(youtube.videos)}
          detalhe={`${formatarMinutosResumo(youtube.minutos)} assistidos`}
        />
        <CartaoIndicador
          icone={Repeat}
          rotulo="Transferências"
          valor={formatarNumeroResumo(transferencias.total)}
          detalhe={`${formatarNumeroResumo(transferencias.faixasTransferidas)} faixas movidas`}
        />
        <CartaoIndicador
          icone={Bot}
          rotulo="Uso de IA"
          valor={formatarDolarResumo(ia.custoMicrodolares)}
          detalhe={`${formatarNumeroResumo(ia.chamadas)} chamadas · ${formatarNumeroResumo(ia.tokens)} tokens`}
        />
      </GradeResumo>
    </SecaoResumo>
  )
}

function CorpoResumo({ usuarioId }: { usuarioId: number }) {
  const { data: resumo, isLoading, isError, refetch } = useResumoAtividadeUsuario(usuarioId)

  if (isLoading) {
    return (
      <VStack align="stretch" gap={4}>
        <Skeleton h="24px" w="40%" borderRadius="md" />
        <SimpleGrid columns={{ base: 2, md: 3 }} gap={2.5}>
          {Array.from({ length: 6 }, (_, indice) => (
            <Skeleton key={indice} h="84px" borderRadius="lg" />
          ))}
        </SimpleGrid>
        <Skeleton h="200px" borderRadius="lg" />
      </VStack>
    )
  }

  if (isError || !resumo) {
    return (
      <Center flexDirection="column" gap={3} py={10}>
        <Text color="fg.muted">Não foi possível carregar a atividade.</Text>
        <Button size="sm" colorPalette="brand" borderRadius="full" onClick={() => void refetch()}>
          Tentar de novo
        </Button>
      </Center>
    )
  }

  return (
    <VStack align="stretch" gap={6}>
      <SecaoResumo titulo="Contas conectadas" icone={Link2}>
        <HStack gap={2} flexWrap="wrap">
          <ChipConta nome="Spotify" status={resumo.contas.spotify} />
          <ChipConta nome="YouTube Music" status={resumo.contas.youtubeMusic} />
          <ChipConta nome="Google Fotos" status={resumo.contas.googleFotos ? 'conectada' : null} />
        </HStack>
      </SecaoResumo>
      <SecaoMusica musica={resumo.musica} />
      <SecaoDownloads resumo={resumo} />
      <SecaoConteudo resumo={resumo} />
    </VStack>
  )
}

export const ModalResumoUsuario = memo(function ModalResumoUsuario({
  usuario,
  onFechar,
}: ModalResumoUsuarioProps) {
  return (
    <Dialog.Root
      lazyMount
      unmountOnExit
      open={usuario !== null}
      onOpenChange={(detalhes) => !detalhes.open && onFechar()}
      placement="center"
      scrollBehavior="inside"
    >
      <Portal>
        <Dialog.Backdrop bg="blackAlpha.700" />
        <Dialog.Positioner px={{ base: 2, md: 4 }}>
          <Dialog.Content
            bg="bg.panel"
            borderWidth="1px"
            borderColor="border.subtle"
            borderRadius="xl"
            maxW="880px"
            w="full"
            maxH={{ base: '92dvh', md: '88vh' }}
          >
            {usuario && (
              <>
                <Dialog.Header
                  px={{ base: 4, md: 5 }}
                  py={4}
                  borderBottomWidth="1px"
                  borderColor="border.subtle"
                  display="flex"
                  flexDirection="row"
                  alignItems="center"
                  justifyContent="space-between"
                  gap={3}
                >
                  <HStack gap={3} minW={0}>
                    <Center
                      boxSize={11}
                      borderRadius="lg"
                      bg="cirqueira.brand.500/20"
                      color="cirqueira.brand.300"
                      fontSize="sm"
                      fontWeight="bold"
                      flexShrink={0}
                    >
                      {iniciaisNome(usuario.nomeCompleto)}
                    </Center>
                    <VStack align="start" gap={0.5} minW={0}>
                      <HStack gap={2} minW={0} maxW="full">
                        <Dialog.Title fontSize="md" fontWeight="bold" color="fg" truncate>
                          {usuario.nomeCompleto}
                        </Dialog.Title>
                        {usuario.administrador && (
                          <Badge colorPalette="brand" variant="subtle" size="sm" flexShrink={0}>
                            <Shield size={10} />
                            Admin
                          </Badge>
                        )}
                      </HStack>
                      <Text fontSize="xs" color="fg.muted" truncate maxW="full">
                        @{usuario.username} · conta criada em {formatarData(usuario.criadoEm)}
                      </Text>
                    </VStack>
                  </HStack>
                  <Dialog.CloseTrigger asChild position="static">
                    <IconButton aria-label="Fechar" size="sm" variant="ghost" borderRadius="full">
                      <X size={16} />
                    </IconButton>
                  </Dialog.CloseTrigger>
                </Dialog.Header>
                <Dialog.Body px={{ base: 4, md: 5 }} py={5}>
                  <CorpoResumo usuarioId={usuario.id} />
                </Dialog.Body>
                <Box
                  px={{ base: 4, md: 5 }}
                  py={2.5}
                  borderTopWidth="1px"
                  borderColor="border.subtle"
                >
                  <HStack gap={1.5} color="fg.subtle">
                    <Sparkles size={12} />
                    <Text fontSize="11px">
                      Música conta Spotify e YouTube Music juntos, desde sempre.
                    </Text>
                  </HStack>
                </Box>
              </>
            )}
          </Dialog.Content>
        </Dialog.Positioner>
      </Portal>
    </Dialog.Root>
  )
})
