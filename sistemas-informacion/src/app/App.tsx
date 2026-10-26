import { RouterProvider } from 'react-router-dom'
import { AppProviders } from '@/app/providers'
import { createAppRouter } from '@/app/router'

// Se crea una sola vez; los providers deben envolver al router porque las
// rutas consumen los contextos.
const router = createAppRouter()

export default function App() {
  return (
    <AppProviders>
      <RouterProvider router={router} />
    </AppProviders>
  )
}
