import { Link } from 'react-router-dom'
import { TwoFactorForm } from '@/features/auth/components/TwoFactorForm'
import styles from '@/features/auth/pages/AuthPage.module.css'
import { APP_NAME } from '@/shared/constants/app'
import { useDocumentTitle } from '@/shared/hooks/useDocumentTitle'

/** Segundo paso del inicio de sesión cuando la cuenta tiene 2FA activo. */
export function TwoFactorPage() {
  useDocumentTitle('Verificación en dos pasos')

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <p className={styles.appName}>{APP_NAME}</p>
        <h1 className={styles.title}>Verificación en dos pasos</h1>
      </header>
      <TwoFactorForm />
      <p className={styles.footer}>
        <Link to="/login">Volver a iniciar sesión</Link>
      </p>
    </div>
  )
}
