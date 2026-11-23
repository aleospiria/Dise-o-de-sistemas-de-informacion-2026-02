import styles from '@/features/auth/components/DemoAccounts.module.css'
import { DEMO_ACCOUNTS, type DemoAccount } from '@/features/auth/demoAccounts'
import { Icon, type IconName } from '@/shared/components/ui/icons'
import { ROLE_LABELS } from '@/shared/constants/roles'
import type { UserRole } from '@/shared/types'

/** Ícono de cada rol (tabla declarativa, SOLID OCP). */
const ROLE_ICONS: Record<UserRole, IconName> = {
  Estudiante: 'graduation-cap',
  Docente: 'book-open',
  Técnico_Laboratorio: 'wrench',
  Administrador_Laboratorio: 'shield-check',
}

export interface DemoAccountsProps {
  onSelect: (account: DemoAccount) => void
}

/** Accesos rápidos a las cuentas de prueba, uno por rol. */
export function DemoAccounts({ onSelect }: DemoAccountsProps) {
  return (
    <details className={styles.demo} open>
      <summary className={styles.summary}>Cuentas de demostración</summary>
      <p className={styles.hint}>
        Datos de prueba para conocer cada rol. Toca una cuenta para llenar el formulario y
        luego pulsa «Iniciar sesión».
      </p>
      <ul className={styles.list}>
        {DEMO_ACCOUNTS.map((account) => (
          <li key={account.correo}>
            <button type="button" className={styles.account} onClick={() => onSelect(account)}>
              <span className={styles.roleIcon}>
                <Icon name={ROLE_ICONS[account.rol]} size={22} />
              </span>
              <span className={styles.text}>
                <span className={styles.role}>{ROLE_LABELS[account.rol]}</span>
                <span className={styles.email}>{account.correo}</span>
                <span className={styles.password}>Contraseña: {account.contrasena}</span>
              </span>
              <Icon name="arrow-right" size={18} className={styles.go} />
            </button>
          </li>
        ))}
      </ul>
    </details>
  )
}
