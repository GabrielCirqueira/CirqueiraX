import { useSEO } from '@/shared/hooks'
import {
  ROTULOS_FUNCIONALIDADE,
  usuarioPossuiPermissao,
  type FuncionalidadeSistema,
} from '@/shared/utils/funcionalidadesSistema'
import { useAuthStore } from '@/stores'
import { Badge, Box, HStack, SimpleGrid, Text, VStack, Wrap, WrapItem } from '@chakra-ui/react'
import { memo } from 'react'
import { Link as RouterLink } from 'react-router-dom'
import { AtalhosOperador } from './components/AtalhosOperador'
import { AtividadesRecentes } from './components/AtividadesRecentes'
import { CardsResumoOperador } from './components/CardsResumoOperador'
import { ContinuarOuvindoOperador } from './components/ContinuarOuvindoOperador'
import { useResumoDashboard } from './hooks/useDashboard'
import { filtrarAtalhosOperador } from './utils/atalhosOperador'

const PERMISSOES_MIDIA: FuncionalidadeSistema[] = [
  'central_midias',
  'downloads_video',
  'downloads_audio',
  'prints',
  'upload_manual',
  'google_fotos',
  'editor_imagem',
  'extrair_texto',
]

function saudacaoPorHorario(agora = new Date()): string {
  const hora = agora.getHours()
  if (hora < 12) return 'Bom dia'
  if (hora < 18) return 'Boa tarde'
  return 'Boa noite'
}

export const DashboardOperador = memo(function DashboardOperador() {
  useSEO({
    title: 'Início',
    description: 'Atalhos e resumo da sua conta no CirqueiraX.',
    keywords: 'inicio, dashboard, cirqueirax',
  })

  const usuario = useAuthStore((s) => s.usuario)
  const primeiroNome = usuario?.nomeCompleto?.trim().split(/\s+/)[0] || 'olá'

  const temMidia = PERMISSOES_MIDIA.some((codigo) => usuarioPossuiPermissao(usuario, codigo))
  const temLivros = usuarioPossuiPermissao(usuario, 'livros_audio')

  const { data: resumo, isLoading: carregandoResumo } = useResumoDashboard(temMidia)

  const atalhos = filtrarAtalhosOperador((codigo) => usuarioPossuiPermissao(usuario, codigo))
  const permissoes = usuario?.permissoes ?? []

  return (
    <Box w="full" maxW="7xl" mx="auto" py={{ base: 4, md: 8 }} px={{ base: 4, md: 8 }}>
      <VStack w="full" gap={6} alignItems="stretch">
        <HStack justify="space-between" align="start" gap={4} flexWrap="wrap">
          <VStack align="start" gap={1}>
            <Text
              as="h1"
              fontSize={{ base: 'xl', md: '2xl' }}
              fontWeight="black"
              color="fg"
              letterSpacing="tight"
            >
              {saudacaoPorHorario()}, {primeiroNome}
            </Text>
            <Text fontSize="sm" color="fg.muted">
              Aqui está o resumo da sua conta e os atalhos liberados para você.
            </Text>
          </VStack>
          <Box
            as={RouterLink}
            to="/perfil"
            fontSize="sm"
            color="cirqueira.brand.400"
            fontWeight="semibold"
          >
            Meu perfil
          </Box>
        </HStack>

        <VStack align="stretch" gap={3}>
          <Text fontSize="sm" fontWeight="semibold" color="fg">
            Seus atalhos
          </Text>
          <AtalhosOperador atalhos={atalhos} />
        </VStack>

        {temMidia && (
          <VStack align="stretch" gap={3}>
            <Text fontSize="sm" fontWeight="semibold" color="fg">
              Suas mídias
            </Text>
            <CardsResumoOperador resumo={resumo} carregando={carregandoResumo} />
          </VStack>
        )}

        <SimpleGrid columns={{ base: 1, lg: temLivros && temMidia ? 2 : 1 }} gap={4}>
          {temMidia && (
            <AtividadesRecentes midias={resumo?.ultimasMidias} carregando={carregandoResumo} />
          )}
          {temLivros && <ContinuarOuvindoOperador />}
        </SimpleGrid>

        <Box
          borderWidth="1px"
          borderColor="border.subtle"
          borderRadius="xl"
          bg="bg.panel"
          p={{ base: 4, md: 5 }}
        >
          <VStack align="stretch" gap={3}>
            <Text fontWeight="bold" color="fg">
              Seu acesso
            </Text>
            {permissoes.length === 0 ? (
              <Text fontSize="sm" color="fg.muted">
                Nenhuma funcionalidade atribuída além do que o administrador definir.
              </Text>
            ) : (
              <Wrap gap={2}>
                {permissoes.map((codigo) => (
                  <WrapItem key={codigo}>
                    <Badge variant="outline" borderRadius="md">
                      {ROTULOS_FUNCIONALIDADE[codigo] ?? codigo}
                    </Badge>
                  </WrapItem>
                ))}
              </Wrap>
            )}
          </VStack>
        </Box>
      </VStack>
    </Box>
  )
})
