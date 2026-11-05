import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import { ThemeProvider } from './contexts'
import { Provider } from './shared/components/ui/provider'
import { Toaster } from './shared/components/ui/toaster'
import './index.css'
import { registrarServiceWorker } from './shared/pwa/serviceWorker'
import './stores/useInstalacaoAppStore'

import '@fontsource/poppins/400.css'
import '@fontsource/poppins/600.css'
import '@fontsource/poppins/700.css'
import '@fontsource/poppins/900.css'
import '@fontsource/lato/400.css'
import '@fontsource/lato/700.css'

window.addEventListener('vite:preloadError', (event) => {
  if (!navigator.onLine) return
  const chave = 'cirqueirax:recarregou-por-erro'
  const ultima = Number(sessionStorage.getItem(chave) ?? 0)
  if (Date.now() - ultima < 30_000) return
  sessionStorage.setItem(chave, String(Date.now()))
  console.warn('Vite preload error detected, reloading page...', event)
  window.location.reload()
})

registrarServiceWorker()

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60,
      gcTime: 1000 * 60 * 10,
      retry: 1,
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
      networkMode: 'offlineFirst',
    },
    mutations: {
      networkMode: 'always',
    },
  },
})

const rootElement = document.getElementById('root')

if (!rootElement) {
  throw new Error('Root element not found')
}

createRoot(rootElement).render(
  <StrictMode>
    <Provider>
      <ThemeProvider>
        <QueryClientProvider client={queryClient}>
          <Toaster />
          <App />
        </QueryClientProvider>
      </ThemeProvider>
    </Provider>
  </StrictMode>
)
