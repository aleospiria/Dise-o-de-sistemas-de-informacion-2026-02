import { Link } from 'react-router-dom'
import { AuthHeader } from '@/features/auth/components/AuthHeader'
import { ResetPasswordForm } from '@/features/auth/components/ResetPasswordForm'
import styles from '@/features/auth/pages/AuthPage.module.css'
import { useDocumentTitle } from '@/shared/hooks/useDocumentTitle'

/** Pantalla pública para definir una nueva contraseña desde el enlace recibido. */
export function ResetPasswordPage() {
  useDocumentTitle('Nueva contraseña')
  return (
    <div className={styles.page}>
      <AuthHeader
        icon="key"
        title="Nueva contraseña"
        description="Elige una contraseña segura que no hayas usado antes."
      />
      <ResetPasswordForm />
      <p className={styles.footer}>
        <Link to="/login">Volver a iniciar sesión</Link>
      </p>
    </div>
  )
}