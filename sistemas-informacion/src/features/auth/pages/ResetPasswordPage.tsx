import { Link } from 'react-router-dom'
import { ResetPasswordForm } from '@/features/auth/components/ResetPasswordForm'
import styles from '@/features/auth/pages/AuthPage.module.css'
import { APP_NAME } from '@/shared/constants/app'
import { useDocumentTitle } from '@/shared/hooks/useDocumentTitle'

/** Pantalla pública para definir una nueva contraseña desde el enlace recibido. */
export function ResetPasswordPage() {
  useDocumentTitle('Nueva contraseña')

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <p className={styles.appName}>{APP_NAME}</p>
        <h1 className={styles.title}>Nueva contraseña</h1>
      </header>
      <ResetPasswordForm />
      <p className={styles.footer}>
        <Link to="/login">Volver a iniciar sesión</Link>
      </p>
    </div>
  )
}
