import { Link } from 'react-router-dom'
import { AuthHeader } from '@/features/auth/components/AuthHeader'
import { ForgotPasswordForm } from '@/features/auth/components/ForgotPasswordForm'
import styles from '@/features/auth/pages/AuthPage.module.css'
import { useDocumentTitle } from '@/shared/hooks/useDocumentTitle'

/** Pantalla pública para solicitar la recuperación de contraseña. */
export function ForgotPasswordPage() {
  useDocumentTitle('Recuperar contraseña')
  return (
    <div className={styles.page}>
      <AuthHeader
        icon="mail"
        title="Recuperar contraseña"
        description="Te ayudamos a volver a entrar en dos pasos: pide el enlace y crea una contraseña nueva."
      />
      <ForgotPasswordForm />
      <p className={styles.footer}>
        ¿Ya la recordaste? <Link to="/login">Inicia sesión</Link>
      </p>
    </div>
  )
}