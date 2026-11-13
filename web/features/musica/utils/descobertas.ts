export const LIMITE_INICIAL_DESCOBERTAS = 9

export function itensVisiveisDescobertas<T>(itens: T[], expandido: boolean): T[] {
  return expandido ? itens : itens.slice(0, LIMITE_INICIAL_DESCOBERTAS)
}

export function rotuloVerTodosDescobertas(total: number, expandido: boolean): string | null {
  if (total <= LIMITE_INICIAL_DESCOBERTAS) return null
  return expandido ? 'Mostrar menos' : `Ver todos (${total})`
}
