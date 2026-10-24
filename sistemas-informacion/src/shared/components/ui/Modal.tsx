import {
  createContext,
  useContext,
  useEffect,
  useId,
  useRef,
  type ReactNode,
} from 'react'
import { createPortal } from 'react-dom'
import styles from '@/shared/components/ui/Modal.module.css'

const FOCUSABLE_SELECTOR = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(',')

interface ModalContextValue {
  titleId: string
  onClose: () => void
}

const ModalContext = createContext<ModalContextValue | null>(null)

function useModalContext(): ModalContextValue {
  const context = useContext(ModalContext)
  if (!context) {
    throw new Error('Modal.Header debe usarse dentro de <Modal>.')
  }
  return context
}

export interface ModalProps {
  open: boolean
  onClose: () => void
  /** Cerrar al hacer clic fuera del diálogo. Por defecto, sí. */
  closeOnBackdrop?: boolean
  children: ReactNode
}

/**
 * Diálogo modal accesible (Req 21.9, 21.10): cierra con Escape, atrapa el foco
 * mientras está abierto, lo devuelve al elemento previo al cerrar y ocupa la
 * pantalla completa en móvil. Para enfocar un control al abrir, márcalo con
 * `data-autofocus`; si no hay ninguno, el foco va al propio diálogo.
 */
export function Modal({
  open,
  onClose,
  closeOnBackdrop = true,
  children,
}: ModalProps) {
  const titleId = useId()
  const dialogRef = useRef<HTMLDivElement>(null)
  const onCloseRef = useRef(onClose)

  // Mantiene el último `onClose` sin reiniciar los efectos de foco.
  useEffect(() => {
    onCloseRef.current = onClose
  }, [onClose])

  useEffect(() => {
    if (!open) return
    const dialog = dialogRef.current
    if (!dialog) return

    const previouslyFocused = document.activeElement as HTMLElement | null
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    const initial = dialog.querySelector<HTMLElement>('[data-autofocus]')
    ;(initial ?? dialog).focus()

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        event.preventDefault()
        onCloseRef.current()
        return
      }
      if (event.key !== 'Tab' || !dialog) return

      const focusable = Array.from(
        dialog.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR),
      )
      if (focusable.length === 0) {
        event.preventDefault()
        dialog.focus()
        return
      }
      const first = focusable[0]
      const last = focusable[focusable.length - 1]
      const active = document.activeElement

      if (event.shiftKey && (active === first || active === dialog)) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && active === last) {
        event.preventDefault()
        first.focus()
      } else if (!dialog.contains(active)) {
        event.preventDefault()
        first.focus()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = previousOverflow
      if (previouslyFocused && document.contains(previouslyFocused)) {
        previouslyFocused.focus()
      }
    }
  }, [open])

  if (!open) return null

  return createPortal(
    <div
      className={styles.backdrop}
      onMouseDown={(event) => {
        if (closeOnBackdrop && event.target === event.currentTarget) onClose()
      }}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        className={styles.dialog}
      >
        <ModalContext.Provider value={{ titleId, onClose }}>
          {children}
        </ModalContext.Provider>
      </div>
    </div>,
    document.body,
  )
}

/** Título del diálogo (nombre accesible) y botón de cierre. */
function ModalHeader({ children }: { children: ReactNode }) {
  const { titleId, onClose } = useModalContext()
  return (
    <div className={styles.header}>
      <h2 id={titleId} className={styles.title}>
        {children}
      </h2>
      <button
        type="button"
        className={styles.close}
        aria-label="Cerrar"
        onClick={onClose}
      >
        <span aria-hidden="true">×</span>
      </button>
    </div>
  )
}

function ModalBody({ children }: { children: ReactNode }) {
  return <div className={styles.body}>{children}</div>
}

function ModalFooter({ children }: { children: ReactNode }) {
  return <div className={styles.footer}>{children}</div>
}

Modal.Header = ModalHeader
Modal.Body = ModalBody
Modal.Footer = ModalFooter
