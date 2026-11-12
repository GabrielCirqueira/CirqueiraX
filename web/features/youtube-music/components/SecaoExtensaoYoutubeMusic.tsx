import { formatarDataHoraPtBr } from '@/features/musica/utils'
import { useRelogioSpotify } from '@/features/spotify/hooks'
import { Box, Button, HStack, Input, Link, Text, VStack } from '@chakra-ui/react'
import { ChevronDown, ChevronUp, Copy, Download, Puzzle, Trash2 } from 'lucide-react'
import { type FormEvent, memo, useState } from 'react'
import {
  useCopiarTokenExtensao,
  useGerarTokenExtensaoYoutube,
  useRevogarTokenExtensaoYoutube,
  useTokensExtensaoYoutube,
} from '../hooks'
import type { ResumoExtensaoYoutube } from '../types'
import {
  AVISO_TOKEN_UNICO,
  EXPLICACAO_EXTENSAO,
  PASSOS_INSTALAR_EXTENSAO,
  URL_DOWNLOAD_EXTENSAO_YOUTUBE,
  VERSAO_EXTENSAO_YOUTUBE,
  descreverSinalExtensao,
} from '../utils'

export interface SecaoExtensaoYoutubeMusicProps {
  resumo: ResumoExtensaoYoutube | undefined
}

export const SecaoExtensaoYoutubeMusic = memo(function SecaoExtensaoYoutubeMusic({
  resumo,
}: SecaoExtensaoYoutubeMusicProps) {
  const [aberta, setAberta] = useState(false)
  const [nomeAparelho, setNomeAparelho] = useState('')
  const [tokenGerado, setTokenGerado] = useState<string | null>(null)
  const agora = useRelogioSpotify()
  const tokens = useTokensExtensaoYoutube(aberta)
  const gerar = useGerarTokenExtensaoYoutube()
  const revogar = useRevogarTokenExtensaoYoutube()
  const copiar = useCopiarTokenExtensao()

  function handleGerar(evento: FormEvent) {
    evento.preventDefault()
    const nome = nomeAparelho.trim()
    if (nome.length === 0) return
    gerar.mutate(nome, {
      onSuccess: (gerado) => {
        setTokenGerado(gerado.token)
        setNomeAparelho('')
      },
    })
  }

  return (
    <VStack
      align="stretch"
      gap={3}
      pt={3}
      borderTop="1px solid"
      borderColor="cirqueira.musica.cartaoElevado"
    >
      <Button
        variant="ghost"
        size="sm"
        justifyContent="space-between"
        px={0}
        color="cirqueira.musica.textoPrincipal"
        _hover={{ bg: 'transparent', color: 'cirqueira.musica.verde' }}
        onClick={() => setAberta(!aberta)}
        aria-expanded={aberta}
      >
        <HStack gap={2}>
          <Puzzle size={14} />
          <Text fontSize="sm" fontWeight="semibold">
            Extensão do navegador
          </Text>
        </HStack>
        {aberta ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
      </Button>
      <Text fontSize="xs" color="cirqueira.musica.textoSecundario" mt={-2}>
        {descreverSinalExtensao(resumo, agora)}
      </Text>

      {aberta && (
        <VStack align="stretch" gap={3}>
          <Text fontSize="xs" color="cirqueira.musica.textoSecundario">
            {EXPLICACAO_EXTENSAO}
          </Text>

          <Button
            asChild
            alignSelf="flex-start"
            size="sm"
            borderRadius="full"
            variant="outline"
            borderColor="cirqueira.musica.verde"
            color="cirqueira.musica.textoPrincipal"
            _hover={{ bg: 'cirqueira.musica.cartaoElevado' }}
          >
            <Link href={URL_DOWNLOAD_EXTENSAO_YOUTUBE} download>
              <Download size={14} />
              Baixar a extensão (versão {VERSAO_EXTENSAO_YOUTUBE})
            </Link>
          </Button>

          <VStack as="ol" align="stretch" gap={1.5} pl={4} fontSize="xs">
            {PASSOS_INSTALAR_EXTENSAO.map((passo) => (
              <Text
                as="li"
                key={passo}
                color="cirqueira.musica.textoSecundario"
                listStyleType="decimal"
              >
                {passo}
              </Text>
            ))}
          </VStack>

          <Box as="form" onSubmit={handleGerar}>
            <HStack gap={2}>
              <Input
                value={nomeAparelho}
                onChange={(evento) => setNomeAparelho(evento.target.value)}
                placeholder='Nome do aparelho, ex.: "PC de casa"'
                aria-label="Nome do aparelho"
                maxLength={60}
                size="sm"
                bg="cirqueira.musica.fundo"
                borderColor="cirqueira.musica.cartaoElevado"
                color="cirqueira.musica.textoPrincipal"
              />
              <Button
                type="submit"
                size="sm"
                borderRadius="full"
                fontWeight="bold"
                bg="cirqueira.musica.verde"
                color="cirqueira.grey.950"
                _hover={{ bg: 'cirqueira.musica.verdeHover' }}
                loading={gerar.isPending}
                disabled={nomeAparelho.trim().length === 0}
              >
                Gerar token
              </Button>
            </HStack>
          </Box>

          {tokenGerado && (
            <VStack
              align="stretch"
              gap={2}
              p={3}
              borderRadius="8px"
              borderWidth="1px"
              borderColor="cirqueira.musica.amarelo"
            >
              <Text fontSize="xs" color="cirqueira.musica.amarelo">
                {AVISO_TOKEN_UNICO}
              </Text>
              <HStack gap={2}>
                <Input
                  value={tokenGerado}
                  readOnly
                  aria-label="Token da extensão"
                  size="sm"
                  fontFamily="mono"
                  fontSize="xs"
                  bg="cirqueira.musica.fundo"
                  borderColor="cirqueira.musica.cartaoElevado"
                  color="cirqueira.musica.textoPrincipal"
                  onFocus={(evento) => evento.target.select()}
                />
                <Button
                  size="sm"
                  borderRadius="full"
                  variant="outline"
                  borderColor="cirqueira.musica.cartaoElevado"
                  color="cirqueira.musica.textoPrincipal"
                  onClick={() => copiar.mutate(tokenGerado)}
                >
                  <Copy size={14} />
                  Copiar
                </Button>
              </HStack>
            </VStack>
          )}

          {(tokens.data ?? []).length > 0 && (
            <VStack align="stretch" gap={1.5}>
              <Text fontSize="xs" fontWeight="semibold" color="cirqueira.musica.textoPrincipal">
                Aparelhos com a extensão
              </Text>
              {(tokens.data ?? []).map((token) => (
                <HStack
                  key={token.uuid}
                  justify="space-between"
                  px={3}
                  py={2}
                  borderRadius="8px"
                  bg="cirqueira.musica.fundo"
                  fontSize="xs"
                >
                  <VStack align="start" gap={0} minW={0}>
                    <Text color="cirqueira.musica.textoPrincipal" truncate>
                      {token.nomeAparelho}
                    </Text>
                    <Text color="cirqueira.musica.textoSecundario">
                      Último uso: {formatarDataHoraPtBr(token.ultimoUsoEm)}
                    </Text>
                  </VStack>
                  <Button
                    size="xs"
                    variant="ghost"
                    borderRadius="full"
                    color="cirqueira.musica.textoSecundario"
                    _hover={{ color: 'cirqueira.red.400', bg: 'cirqueira.musica.cartaoElevado' }}
                    loading={revogar.isPending && revogar.variables === token.uuid}
                    onClick={() => revogar.mutate(token.uuid)}
                    aria-label={`Remover ${token.nomeAparelho}`}
                  >
                    <Trash2 size={12} />
                    Remover
                  </Button>
                </HStack>
              ))}
            </VStack>
          )}
        </VStack>
      )}
    </VStack>
  )
})
