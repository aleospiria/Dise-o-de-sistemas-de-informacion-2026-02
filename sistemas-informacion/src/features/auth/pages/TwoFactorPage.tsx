import { Link } from 'react-router-dom'
import { AuthHeader } from '@/features/auth/components/AuthHeader'
import { TwoFactorForm } from '@/features/auth/components/TwoFactorForm'
import styles from '@/features/auth/pages/AuthPage.module.css'
import { useDocumentTitle } from '@/shared/hooks/useDocumentTitle'

/** Segundo paso del inicio de sesión cuando la cuenta tiene 2FA activo. */
export function TwoFactorPage() {
  useDocumentTitle('Verificación en dos pasos')
  return (
    <div className={styles.page}>
      <AuthHeader
        icon="shield-check"
        title="Verificación en dos pasos"
        description="Confirma que eres tú con el código temporal de tu aplicación autenticadora."
      />
      <TwoFactorForm />
      <p className={styles.footer}>
        <Link to="/login">Volver a iniciar sesión</Link>
      </p>
    </div>
  )
}