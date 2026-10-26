import type { ReactNode } from 'react'
import { AppDataProvider } from '@/contexts/AppDataProvider'
import { AuthProvider } from '@/contexts/AuthProvider'
import { UIProvider } from '@/contexts/UIProvider'
import {
  localStorageRepository,
  type StorageRepository,
} from '@/services/storage'
import { ToastContainer } from '@/shared/components/ui/ToastContainer'

interface AppProvidersProps {
  children: ReactNode
  /** Puerto de persistencia compartido (SOLID M2). Los tests inyectan un fake. */
  repository?: StorageRepository
}

/**
 * Compone los contextos globales: AuthProvider > AppDataProvider > UIProvider.
 * Ambos providers de datos reciben el mismo repositorio para que sesión y
 * datos de dominio lean y escriban en el mismo almacenamiento.
 */
export function AppProviders({
  children,
  repository = localStorageRepository,
}: AppProvidersProps) {
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
