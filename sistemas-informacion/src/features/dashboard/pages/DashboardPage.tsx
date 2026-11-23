import type { ComponentType } from 'react'
import { useAuth } from '@/contexts/useAuth'
import { AdminDashboard } from '@/features/dashboard/components/AdminDashboard'
import styles from '@/features/dashboard/components/Dashboard.module.css'
import { StudentDashboard } from '@/features/dashboard/components/StudentDashboard'
import { TechnicianDashboard } from '@/features/dashboard/components/TechnicianDashboard'
import { Icon, type IconName } from '@/shared/components/ui/icons'
import { ROLE_LABELS } from '@/shared/constants/roles'
import type { UserRole } from '@/shared/types'

/**
 * Panel de cada rol. Es una tabla `Record<UserRole, …>` (SOLID OCP): agregar un
 * rol a los tipos de dominio obliga a darle su panel aquí, sin `if`/`switch`.
 */
const DASHBOARD_VIEWS: Record<UserRole, ComponentType> = {
  Estudiante: StudentDashboard,
  Docente: StudentDashboard,
  Técnico_Laboratorio: TechnicianDashboard,
  Administrador_Laboratorio: AdminDashboard,
}

/** Ícono y frase de bienvenida de cada rol (tabla declarativa). */
const WELCOME: Record<UserRole, { icon: IconName; text: string }> = {
  Estudiante: {
    icon: 'graduation-cap',
    text: 'Consulta qué hay libre, reserva por horas y sigue tus préstamos.',
  },
  Docente: {
    icon: 'book-open',
    text: 'Consulta qué hay libre, reserva por horas y sigue tus préstamos.',
  },
  Técnico_Laboratorio: {
    icon: 'wrench',
    text: 'Entrega y recibe los recursos del laboratorio, y vigila los retrasos.',
  },
  Administrador_Laboratorio: {
    icon: 'shield-check',
    text: 'Supervisa el inventario, los préstamos y la operación del laboratorio.',
  },
}

/** Pantalla de inicio: muestra el panel que corresponde al rol de la sesión (Req 19.4). */
export function DashboardPage() {
  const { session } = useAuth()
  if (!session) return null // PrivateRoute ya garantiza la sesión
  const View = DASHBOARD_VIEWS[session.role]
  const welcome = WELCOME[session.role]
  return (
    <div className={styles.view}>
      <section className={styles.welcome} aria-label="Bienvenida">
        <span className={styles.welcomeIcon}>
          <Icon name={welcome.icon} size={28} />
        </span>
        <div className={styles.welcomeText}>
          <p className={styles.greeting}>Hola, {session.nombre}.</p>
          <p className={styles.role}>
            {ROLE_LABELS[session.role]} · {welcome.text}
          </p>
        </div>
      </section>
      <View />
    </div>
  )
}
