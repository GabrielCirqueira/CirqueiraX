import { IconeFonteMusica } from '@/features/musica/components/IconeFonteMusica'
import { formatarDataHoraPtBr } from '@/features/musica/utils'
import { Box, Button, HStack, Heading, Spinner, Text, VStack } from '@chakra-ui/react'
import { AlertCircle, Info, LogOut, Upload } from 'lucide-react'
import { memo, useState } from 'react'
import { useDesconectarYoutubeMusic, useStatusYoutubeMusic } from '../hooks'
import { NOTA_MARGEM_HORARIO, formatarNumero, situacaoPainelYoutubeMusic } from '../utils'
import { CampoCabecalhosYoutubeMusic } from './CampoCabecalhosYoutubeMusic'
import { ModalDesconectarYoutubeMusic } from './ModalDesconectarYoutubeMusic'
import { SecaoExtensaoYoutubeMusic } from './SecaoExtensaoYoutubeMusic'
import { SeletorFonteCapturaYoutube } from './SeletorFonteCapturaYoutube'

export interface PainelConexaoYoutubeMusicProps {
  onAbrirModalImportacao: () => void
}

export const PainelConexaoYoutubeMusic = memo(function PainelConexaoYoutubeMusic({
  onAbrirModalImportacao,
}: PainelConexaoYoutubeMusicProps) {
  const { data: status, isLoading } = useStatusYoutubeMusic()
  const desconectar = useDesconectarYoutubeMusic()
  const [modalDesconectarAberto, setModalDesconectarAberto] = useState(false)
  const [mostrarCampo, setMostrarCampo] = useState(false)
  const situacao = situacaoPainelYoutubeMusic(status)

  function handleConfirmarDesconexao() {
    desconectar.mutate(undefined, { onSuccess: () => setModalDesconectarAberto(false) })
  }

  return (
    <Box
      id="conexao-youtube-music"
      p={{ base: 4, md: 6 }}
      bg="cirqueira.musica.cartao"
      borderRadius="8px"
      border="1px solid"
      borderColor={
        situacao === 'reconectar' ? 'cirqueira.red.500' : 'cirqueira.musica.cartaoElevado'
      }
      h="full"
    >
      {isLoading ? (
        <HStack gap={3}>
          <Spinner size="sm" color="cirqueira.musica.verde" />
          <Text fontSize="sm" color="cirqueira.musica.textoSecundario">
            Verificando o YouTube Music...
          </Text>
        </HStack>
      ) : (
        <VStack align="stretch" gap={4}>
          <HStack gap={3} align="center">
            <IconeFonteMusica fonte="youtube_music" tamanho={28} />
            <VStack align="start" gap={0}>
              <Heading
                as="h2"
                fontSize="md"
                fontWeight="bold"
                color="cirqueira.musica.textoPrincipal"
              >
                {situacao === 'conectado'
                  ? (status?.nomeConta ?? 'YouTube Music conectado')
                  : situacao === 'reconectar'
                    ? 'Sessão do YouTube Music expirou'
                    : 'Conecte o YouTube Music'}
              </Heading>
              <Text fontSize="xs" color="cirqueira.musica.textoSecundario">
                {situacao === 'conectado'
                  ? `${formatarNumero(status?.totalReproducoesColetadas ?? 0)} reproduções registradas`
                  : 'O servidor consulta o seu histórico e registra o que você ouve.'}
              </Text>
            </VStack>
          </HStack>

          <SeletorFonteCapturaYoutube fonte={status?.fonteCaptura ?? 'coletor'} />

          {situacao === 'reconectar' && (
            <HStack
              gap={2}
              align="start"
              px={3}
              py={2}
              borderRadius="8px"
              bg="cirqueira.red.950"
              color="cirqueira.red.300"
              fontSize="xs"
              role="alert"
            >
              <AlertCircle size={16} />
              <Text>
                A coleta parou porque a sessão da sua conta Google expirou ou foi encerrada
                {status?.erroMotivo ? ` (${status.erroMotivo})` : ''}. Cole os cabeçalhos de novo
                para retomar. As reproduções já registradas continuam guardadas.
              </Text>
            </HStack>
          )}

          {situacao === 'conectado' && (
            <VStack align="stretch" gap={1} fontSize="xs" color="cirqueira.musica.textoSecundario">
              {status?.fonteCaptura === 'extensao' && (
                <Text color="cirqueira.musica.amarelo" fontWeight="semibold">
                  Coleta por cookies pausada. O cookie continua guardado.
                </Text>
              )}
              <Text>Última consulta: {formatarDataHoraPtBr(status?.ultimaConsultaEm ?? null)}</Text>
              <Text>Última novidade: {formatarDataHoraPtBr(status?.ultimaNovidadeEm ?? null)}</Text>
              <HStack gap={1.5} align="start" color="cirqueira.musica.textoDesabilitado">
                <Info size={12} />
                <Text>{NOTA_MARGEM_HORARIO}</Text>
              </HStack>
            </VStack>
          )}

          {situacao === 'reconectar' && <CampoCabecalhosYoutubeMusic rotuloBotao="Reconectar" />}

          {situacao === 'desconectado' &&
            (mostrarCampo ? (
              <CampoCabecalhosYoutubeMusic rotuloBotao="Conectar" />
            ) : (
              <Button
                alignSelf="flex-start"
                size="sm"
                borderRadius="full"
                variant="outline"
                borderColor="cirqueira.musica.fonteYoutubeMusic"
                color="cirqueira.musica.textoPrincipal"
                _hover={{ bg: 'cirqueira.musica.cartaoElevado' }}
                onClick={() => setMostrarCampo(true)}
              >
                Conectar o YouTube Music
              </Button>
            ))}

          <SecaoExtensaoYoutubeMusic resumo={status?.extensao} />

          <HStack gap={2} wrap="wrap">
            <Button
              size="sm"
              variant="outline"
              borderRadius="full"
              borderColor="cirqueira.musica.cartaoElevado"
              color="cirqueira.musica.textoPrincipal"
              _hover={{ bg: 'cirqueira.musica.cartaoElevado' }}
              onClick={onAbrirModalImportacao}
            >
              <Upload size={14} />
              Importar do Google Takeout
            </Button>
            {situacao !== 'desconectado' && (
              <Button
                size="sm"
                variant="ghost"
                borderRadius="full"
                color="cirqueira.musica.textoSecundario"
                _hover={{ color: 'cirqueira.red.400', bg: 'cirqueira.musica.cartaoElevado' }}
                onClick={() => setModalDesconectarAberto(true)}
              >
                <LogOut size={14} />
                Desconectar
              </Button>
            )}
          </HStack>
        </VStack>
      )}

      <ModalDesconectarYoutubeMusic
        aberto={modalDesconectarAberto}
        carregando={desconectar.isPending}
        onConfirmar={handleConfirmarDesconexao}
        onFechar={() => setModalDesconectarAberto(false)}
      />
    </Box>
  )
})
