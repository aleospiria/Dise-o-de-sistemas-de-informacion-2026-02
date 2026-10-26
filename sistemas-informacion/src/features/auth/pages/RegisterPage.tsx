import { Link } from 'react-router-dom'
import { RegisterForm } from '@/features/auth/components/RegisterForm'
import styles from '@/features/auth/pages/AuthPage.module.css'
import { APP_NAME } from '@/shared/constants/app'
import { useDocumentTitle } from '@/shared/hooks/useDocumentTitle'

/** Pantalla pública de registro, dentro de `AuthLayout`. */
export function RegisterPage() {
  useDocumentTitle('Crear cuenta')

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <p className={styles.appName}>{APP_NAME}</p>
        <h1 className={styles.title}>Crear cuenta</h1>
      </header>
      <RegisterForm />
      <p className={styles.footer}>
        ¿Ya tienes cuenta? <Link to="/login">Inicia sesión</Link>
      </p>
    </div>
  )
}
