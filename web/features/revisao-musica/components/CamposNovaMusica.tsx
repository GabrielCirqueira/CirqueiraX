import { Field, HStack, Input, NativeSelect, VStack } from '@chakra-ui/react'
import { memo } from 'react'
import { OPCOES_VERSAO_MUSICA } from '../utils'

export interface NovaMusicaRascunho {
  titulo: string
  artistas: string
  versao: string
}

export const NOVA_MUSICA_VAZIA: NovaMusicaRascunho = {
  titulo: '',
  artistas: '',
  versao: 'original',
}

export interface CamposNovaMusicaProps {
  valor: NovaMusicaRascunho
  onAlterar: (valor: NovaMusicaRascunho) => void
  mostrarVersao?: boolean
}

export const CamposNovaMusica = memo(function CamposNovaMusica({
  valor,
  onAlterar,
  mostrarVersao = true,
}: CamposNovaMusicaProps) {
  return (
    <VStack align="stretch" gap={3}>
      <Field.Root>
        <Field.Label fontSize="xs" color="cirqueira.musica.textoSecundario">
          Título
        </Field.Label>
        <Input
          value={valor.titulo}
          onChange={(evento) => onAlterar({ ...valor, titulo: evento.target.value })}
          bg="cirqueira.musica.fundo"
          borderColor="cirqueira.musica.cartaoElevado"
        />
      </Field.Root>
      <HStack gap={3} align="start" flexWrap={{ base: 'wrap', sm: 'nowrap' }}>
        <Field.Root flex={2} minW="200px">
          <Field.Label fontSize="xs" color="cirqueira.musica.textoSecundario">
            Artistas
          </Field.Label>
          <Input
            value={valor.artistas}
            onChange={(evento) => onAlterar({ ...valor, artistas: evento.target.value })}
            placeholder="Separe por vírgula"
            bg="cirqueira.musica.fundo"
            borderColor="cirqueira.musica.cartaoElevado"
          />
        </Field.Root>
        {mostrarVersao && (
          <Field.Root flex={1} minW="140px">
            <Field.Label fontSize="xs" color="cirqueira.musica.textoSecundario">
              Versão
            </Field.Label>
            <NativeSelect.Root>
              <NativeSelect.Field
                value={valor.versao}
                onChange={(evento) => onAlterar({ ...valor, versao: evento.target.value })}
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
          </Field.Root>
        )}
      </HStack>
    </VStack>
  )
})
