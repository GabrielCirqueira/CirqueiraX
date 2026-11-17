export const CHAVES_QUERY_USUARIOS = {
  todos: ['usuarios'] as const,
  lista: () => [...CHAVES_QUERY_USUARIOS.todos, 'lista'] as const,
  detalhe: (id: number) => [...CHAVES_QUERY_USUARIOS.todos, 'detalhe', id] as const,
  funcionalidades: () => [...CHAVES_QUERY_USUARIOS.todos, 'funcionalidades'] as const,
}
