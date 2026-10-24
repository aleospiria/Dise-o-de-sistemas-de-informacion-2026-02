import { useId, type ReactNode } from 'react'
import styles from '@/shared/components/ui/FormField.module.css'

/** Atributos de accesibilidad que el campo debe aplicar a su control. */
export interface FieldControlProps {
  id: string
  'aria-invalid': true | undefined
  'aria-describedby': string | undefined
  'aria-required': true | undefined
}

export interface FormFieldProps {
  label: string
  error?: string
  hint?: string
  required?: boolean
  counter?: { current: number; max: number }
  className?: string
  /** Recibe los atributos ARIA que debe aplicar al control real. */
  children: (control: FieldControlProps) => ReactNode
}

/**
 * Envoltorio común de los campos: etiqueta asociada, ayuda, mensaje de error
 * (en una región `aria-live`, Req 21.7) y contador de caracteres (Req 17.9).
 */
export function FormField({
  label,
  error,
  hint,
  required,
  counter,
  className,
  children,
}: FormFieldProps) {
  const baseId = useId()
  const controlId = `${baseId}-control`
  const hintId = `${baseId}-hint`
  const errorId = `${baseId}-error`

  const describedBy =
    [hint ? hintId : null, error ? errorId : null].filter(Boolean).join(' ') ||
    undefined

  return (
    <div className={[styles.field, className].filter(Boolean).join(' ')}>
      <label htmlFor={controlId} className={styles.label}>
        {label}
        {required && (
          <span className={styles.required} aria-hidden="true">
            {' '}
            *
          </span>
        )}
      </label>
      {hint && (
        <p id={hintId} className={styles.hint}>
          {hint}
        </p>
      )}
      {children({
        id: controlId,
        'aria-invalid': error ? true : undefined,
        'aria-describedby': describedBy,
        'aria-required': required ? true : undefined,
      })}
      <div className={styles.footer}>
        {/* La región existe siempre para que el cambio de contenido se anuncie. */}
        <div aria-live="polite">
          {error && (
            <p id={errorId} className={styles.error}>
              {error}
            </p>
          )}
        </div>
        {counter && (
          <span className={styles.counter}>
            {counter.current}/{counter.max}
          </span>
        )}
      </div>
    </div>
  )
}
