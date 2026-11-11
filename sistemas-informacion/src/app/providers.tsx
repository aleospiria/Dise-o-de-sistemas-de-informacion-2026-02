import type { ReactNode } from 'react'
import { AppDataProvider } from '@/contexts/AppDataProvider'
import { AuthProvider } from '@/contexts/AuthProvider'
import { UIProvider } from '@/contexts/UIProvider'
import type { StorageRepository } from '@/services/storage'
import { ToastContainer } from '@/shared/components/ui/ToastContainer'

interface AppProvidersProps {
  children: ReactNode
  /**
   * Puerto de persistencia (SOLID M2). Los tests inyectan un fake y la app
   * real lo omite para usar la API HTTP.
   */
  repository?: StorageRepository
}

/**
 * Compone los contextos globales: AuthProvider > AppDataProvider > UIProvider.
 * Sin `repository` la aplicación usa el backend; con él, los servicios mock.
 */
export function AppProviders({ children, repository }: AppProvidersProps) {
  return (
    <AuthProvider repository={repository}>
      <AppDataProvider repository={repository}>
        <UIProvider>
          {children}
          <ToastContainer />
        </UIProvider>
      </AppDataProvider>
    </AuthProvider>
  )
}
