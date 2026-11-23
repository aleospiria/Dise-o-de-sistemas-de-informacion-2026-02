import { Link } from 'react-router-dom'
import { AuthHeader } from '@/features/auth/components/AuthHeader'
import { RegisterForm } from '@/features/auth/components/RegisterForm'
import styles from '@/features/auth/pages/AuthPage.module.css'
import { useDocumentTitle } from '@/shared/hooks/useDocumentTitle'

/** Pantalla pública de registro, dentro de `AuthLayout`. */
export function RegisterPage() {
  useDocumentTitle('Crear cuenta')
  return (
    <div className={styles.page}>
      <AuthHeader
        icon="user-plus"
        title="Crear cuenta"
        description="Regístrate con tus datos institucionales para reservar equipos, herramientas y materiales."
      />
      <RegisterForm />
      <p className={styles.footer}>
        ¿Ya tienes cuenta? <Link to="/login">Inicia sesión</Link>
      </p>
    </div>
  )
}