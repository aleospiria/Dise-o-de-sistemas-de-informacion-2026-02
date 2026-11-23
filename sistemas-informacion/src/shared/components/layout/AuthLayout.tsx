import { Outlet } from 'react-router-dom'
import styles from '@/shared/components/layout/AuthLayout.module.css'
import { Icon, type IconName } from '@/shared/components/ui/icons'
import { APP_NAME } from '@/shared/constants/app'

/** Puntos de valor que se muestran junto al formulario (tabla declarativa). */
const HIGHLIGHTS: Array<{ icon: IconName; text: string }> = [
  { icon: 'search', text: 'Consulta qué recursos están libres antes de ir al laboratorio.' },
  { icon: 'clock', text: 'Reserva por horas, entre 1 y 24 h, desde cualquier dispositivo.' },
  { icon: 'clipboard-check', text: 'Sigue cada préstamo hasta su devolución.' },
]

/**
 * Contenedor sin navegación para las pantallas públicas (inicio de sesión,
 * registro y recuperación de contraseña). En escritorio muestra un panel de
 * marca junto al formulario; en móvil, una cabecera de marca compacta.
 * Úsalo como layout route.
 */
export function AuthLayout() {
  return (
    <div className={styles.wrapper}>
      <aside className={styles.brandPanel} aria-label="Acerca del sistema">
        <div className={styles.brandHead}>
          <span className={styles.brandMark}>
            <Icon name="flask" size={26} />
          </span>
          <p className={styles.brandName}>{APP_NAME}</p>
        </div>
        <div className={styles.brandBody}>
          <p className={styles.tagline}>
            Equipos, herramientas y materiales del laboratorio, a un clic.
          </p>
          <ul className={styles.highlights}>
            {HIGHLIGHTS.map((item) => (
              <li key={item.icon} className={styles.highlight}>
                <span className={styles.highlightIcon}>
                  <Icon name={item.icon} size={20} />
                </span>
                <span>{item.text}</span>
              </li>
            ))}
          </ul>
        </div>
      </aside>
      <div className={styles.formSide}>
        <main id="main-content" className={styles.card}>
          <Outlet />
        </main>
      </div>
    </div>
  )
}
