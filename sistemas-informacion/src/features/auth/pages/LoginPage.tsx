import { Link } from 'react-router-dom'
import { AuthHeader } from '@/features/auth/components/AuthHeader'
import { LoginForm } from '@/features/auth/components/LoginForm'
import styles from '@/features/auth/pages/AuthPage.module.css'
import { useDocumentTitle } from '@/shared/hooks/useDocumentTitle'

/** Pantalla pública de inicio de sesión, dentro de `AuthLayout`. */
export function LoginPage() {
  useDocumentTitle('Iniciar sesión')
  return (
    <div className={styles.page}>
      <AuthHeader
        icon="user"
        title="Iniciar sesión"
        description="Ingresa con tu cuenta para consultar y reservar los recursos del laboratorio."
      />
      <LoginForm />
      <p className={styles.footer}>
        ¿No tienes cuenta? <Link to="/register">Crear cuenta</Link>
      </p>
    </div>
  )
}