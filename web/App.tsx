import { MainLayout } from '@/layouts'
import {
  Route,
  RouterProvider,
  createBrowserRouter,
  createRoutesFromElements,
} from 'react-router-dom'

import { RotaProtegida } from '@/routes'
import { lazyWithRetry } from '@/shared/utils/lazyWithRetry'

const router = createBrowserRouter(
  createRoutesFromElements(
    <Route path="/">
      <Route element={<MainLayout />}>
        {/* Rota pública de autenticação */}
        <Route path="login" lazy={() => lazyWithRetry(() => import('@/features/auth/Login'))} />

        {/* Rotas protegidas — exigem login */}
        <Route element={<RotaProtegida />}>
          <Route index lazy={() => lazyWithRetry(() => import('@/features/dashboard/Dashboard'))} />
          <Route
            path="dashboard"
            lazy={() => lazyWithRetry(() => import('@/features/dashboard/Dashboard'))}
          />
          <Route
            path="downloads"
            lazy={() => lazyWithRetry(() => import('@/features/downloads-video/DownloadsVideo'))}
          />
          <Route
            path="upload-manual"
            lazy={() => lazyWithRetry(() => import('@/features/upload-manual/UploadManual'))}
          />
          <Route
            path="app"
            lazy={() => lazyWithRetry(() => import('@/features/dashboard/Dashboard'))}
          />
        </Route>

        <Route path="*" lazy={() => lazyWithRetry(() => import('@/features/not-found/NotFound'))} />
      </Route>
    </Route>
  )
)

export default function App() {
  return <RouterProvider router={router} />
}
