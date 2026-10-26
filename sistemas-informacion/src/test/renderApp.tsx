import { render } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createMemoryRouter, RouterProvider } from 'react-router-dom'
import { AppProviders } from '@/app/providers'
import { appRoutes } from '@/app/router'
import { DEMO_ACCOUNTS } from '@/features/auth/demoAccounts'
import { loginUser } from '@/services/mockDb/auth.service'
import { seedData } from '@/services/mockDb/seed-data'
import { InMemoryStorageRepository } from '@/services/storage'
import type { UserRole } from '@/shared/types'

interface RenderAppOptions {
  /** Rol con el que iniciar sesión; sin él, se entra como invitado. */
  role?: UserRole
  /** Ajusta los datos semilla antes de montar la app. */
  prepare?: (repo: InMemoryStorageRepository) => void
}

/**
 * Monta la aplicación real (providers + router) sobre un almacenamiento en
 * memoria con los datos semilla, opcionalmente con una sesión ya iniciada.
 */
export function renderApp(path: string, { role, prepare }: RenderAppOptions = {}) {
  const repo = new InMemoryStorageRepository()
  seedData(repo)
  prepare?.(repo)

  if (role) {
    const account = DEMO_ACCOUNTS.find((a) => a.rol === role)
    if (!account) throw new Error(`No hay cuenta de demostración para ${role}.`)
    loginUser(account.correo, account.contrasena, repo)
  }

  const router = createMemoryRouter(appRoutes, { initialEntries: [path] })
  const user = userEvent.setup()
  const utils = render(
    <AppProviders repository={repo}>
      <RouterProvider router={router} />
    </AppProviders>,
  )
  return { repo, router, user, pathname: () => router.state.location.pathname, ...utils }
}
