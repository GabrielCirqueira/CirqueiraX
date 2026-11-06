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
      <Route path="login" lazy={() => lazyWithRetry(() => import('@/features/auth/Login'))} />

      <Route element={<MainLayout />}>
        <Route element={<RotaProtegida />}>
          <Route index lazy={() => lazyWithRetry(() => import('@/features/dashboard/Dashboard'))} />
          <Route
            path="dashboard"
            lazy={() => lazyWithRetry(() => import('@/features/dashboard/Dashboard'))}
          />
          <Route
            path="spotify"
            lazy={() => lazyWithRetry(() => import('@/features/spotify/Spotify'))}
          />
          <Route
            path="central-midias"
            lazy={() => lazyWithRetry(() => import('@/features/central-midias/CentralMidias'))}
          />
          <Route
            path="todas-midias"
            lazy={() => lazyWithRetry(() => import('@/features/central-midias/CentralMidias'))}
          />
          <Route
            path="downloads"
            lazy={() => lazyWithRetry(() => import('@/features/downloads-video/DownloadsVideo'))}
          />
          <Route
            path="downloads-mp3"
            lazy={() => lazyWithRetry(() => import('@/features/downloads-audio/DownloadsAudio'))}
          />
          <Route
            path="livros-audio"
            lazy={() => lazyWithRetry(() => import('@/features/livros-audio/LivrosAudio'))}
          />
          <Route
            path="livros-audio/:uuid"
            lazy={() => lazyWithRetry(() => import('@/features/livros-audio/LeitorLivroAudio'))}
          />
          <Route
            path="transcricoes"
            lazy={() => lazyWithRetry(() => import('@/features/transcricoes/Transcricoes'))}
          />
          <Route
            path="prints"
            lazy={() => lazyWithRetry(() => import('@/features/prints/Prints'))}
          />
          <Route
            path="editor-imagem"
            lazy={() => lazyWithRetry(() => import('@/features/editor-imagem/EditorImagem'))}
          />
          <Route
            path="upload-manual"
            lazy={() => lazyWithRetry(() => import('@/features/upload-manual/UploadManual'))}
          />
          <Route
            path="google-fotos"
            lazy={() => lazyWithRetry(() => import('@/features/google-fotos/GoogleFotos'))}
          />
          <Route
            path="spotify/artista"
            lazy={() => lazyWithRetry(() => import('@/features/spotify/DetalheArtistaSpotify'))}
          />
          <Route
            path="spotify/musica"
            lazy={() => lazyWithRetry(() => import('@/features/spotify/DetalheMusicaSpotify'))}
          />
          <Route
            path="spotify/callback"
            lazy={() =>
              lazyWithRetry(() => import('@/features/spotify/components/SpotifyCallback'))
            }
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
