import type { ComponentType } from 'react'
import { useAuth } from '@/contexts/useAuth'
import { AdminDashboard } from '@/features/dashboard/components/AdminDashboard'
import styles from '@/features/dashboard/components/Dashboard.module.css'
import { StudentDashboard } from '@/features/dashboard/components/StudentDashboard'
import { TechnicianDashboard } from '@/features/dashboard/components/TechnicianDashboard'
import type { UserRole } from '@/shared/types'

/**
 * Panel de cada rol. Es una tabla `Record<UserRole, …>` (SOLID OCP): agregar un
 * rol a los tipos de dominio obliga a darle su panel aquí, sin `if`/`switch`.
 */
const DASHBOARD_VIEWS: Record<UserRole, ComponentType> = {
  Estudiante: StudentDashboard,
  Técnico_Laboratorio: TechnicianDashboard,
  Administrador_Laboratorio: AdminDashboard,
}

/** Pantalla de inicio: muestra el panel que corresponde al rol de la sesión (Req 19.4). */
export function DashboardPage() {
  const { session } = useAuth()
  if (!session) return null // PrivateRoute ya garantiza la sesión

  const View = DASHBOARD_VIEWS[session.role]
  return (
    <>
      <p className={styles.greeting}>Hola, {session.nombre}.</p>
      <View />
    </>
  )
}
