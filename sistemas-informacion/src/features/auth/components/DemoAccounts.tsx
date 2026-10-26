import styles from '@/features/auth/components/AuthForm.module.css'
import { DEMO_ACCOUNTS, type DemoAccount } from '@/features/auth/demoAccounts'
import { ROLE_LABELS } from '@/shared/constants/roles'

export interface DemoAccountsProps {
  onSelect: (account: DemoAccount) => void
}

/** Accesos rápidos a las cuentas de prueba, uno por rol. */
export function DemoAccounts({ onSelect }: DemoAccountsProps) {
  return (
    <details className={styles.demo} open>
      <summary>Cuentas de demostración</summary>
      <p className={styles.demoHint}>
        Datos simulados para probar cada rol. Elige una para llenar el formulario.
      </p>
      <ul className={styles.demoList}>
        {DEMO_ACCOUNTS.map((account) => (
          <li key={account.correo}>
            <button
              type="button"
              className={styles.demoButton}
              onClick={() => onSelect(account)}
            >
              <span className={styles.demoRole}>{ROLE_LABELS[account.rol]}</span>
              <span className={styles.demoEmail}>{account.correo}</span>
            </button>
          </li>
        ))}
      </ul>
    </details>
  )
}
