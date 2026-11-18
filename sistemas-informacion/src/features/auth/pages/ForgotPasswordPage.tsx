import { Link } from 'react-router-dom'
import { ForgotPasswordForm } from '@/features/auth/components/ForgotPasswordForm'
import styles from '@/features/auth/pages/AuthPage.module.css'
import { APP_NAME } from '@/shared/constants/app'
import { useDocumentTitle } from '@/shared/hooks/useDocumentTitle'

/** Pantalla pública para solicitar la recuperación de contraseña. */
export function ForgotPasswordPage() {
  useDocumentTitle('Recuperar contraseña')

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <p className={styles.appName}>{APP_NAME}</p>
        <h1 className={styles.title}>Recuperar contraseña</h1>
      </header>
      <ForgotPasswordForm />
      <p className={styles.footer}>
        ¿Ya la recordaste? <Link to="/login">Inicia sesión</Link>
      </p>
    </div>
  )
}
