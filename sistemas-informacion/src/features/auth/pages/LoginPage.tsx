import { Link } from 'react-router-dom'
import { LoginForm } from '@/features/auth/components/LoginForm'
import styles from '@/features/auth/pages/AuthPage.module.css'
import { APP_NAME } from '@/shared/constants/app'
import { useDocumentTitle } from '@/shared/hooks/useDocumentTitle'

/** Pantalla pública de inicio de sesión, dentro de `AuthLayout`. */
export function LoginPage() {
  useDocumentTitle('Iniciar sesión')

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <p className={styles.appName}>{APP_NAME}</p>
        <h1 className={styles.title}>Iniciar sesión</h1>
      </header>
      <LoginForm />
      <p className={styles.footer}>
        ¿No tienes cuenta? <Link to="/register">Crear cuenta</Link>
      </p>
    </div>
  )
}
