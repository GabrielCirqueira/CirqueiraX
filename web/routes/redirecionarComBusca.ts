import { type LoaderFunctionArgs, redirect } from 'react-router-dom'

export function redirecionarComBusca(destino: string) {
  return ({ request }: LoaderFunctionArgs) => redirect(`${destino}${new URL(request.url).search}`)
}
