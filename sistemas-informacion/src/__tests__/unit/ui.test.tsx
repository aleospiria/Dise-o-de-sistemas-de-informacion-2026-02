import { useState } from 'react'
import { act, fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { UIProvider } from '@/contexts/UIProvider'
import { useToast } from '@/contexts/useToast'
import { Breadcrumb } from '@/shared/components/ui/Breadcrumb'
import { Button } from '@/shared/components/ui/Button'
import { Input } from '@/shared/components/ui/Input'
import { Modal } from '@/shared/components/ui/Modal'
import { Select } from '@/shared/components/ui/Select'
import { SkeletonLoader } from '@/shared/components/ui/SkeletonLoader'
import { StatusBadge } from '@/shared/components/ui/StatusBadge'
import { Textarea } from '@/shared/components/ui/Textarea'
import { Toast, TOAST_AUTO_CLOSE_MS } from '@/shared/components/ui/Toast'
import { ToastContainer } from '@/shared/components/ui/ToastContainer'

afterEach(() => {
  vi.useRealTimers()
})

describe('Button', () => {
  it('es type="button" por defecto y ejecuta onClick', () => {
    const onClick = vi.fn()
    render(<Button onClick={onClick}>Guardar</Button>)
    const button = screen.getByRole('button', { name: 'Guardar' })
    expect(button).toHaveAttribute('type', 'button')
    fireEvent.click(button)
    expect(onClick).toHaveBeenCalledTimes(1)
  })

  it('en carga muestra el spinner, se deshabilita y no ejecuta onClick', () => {
    const onClick = vi.fn()
    render(
      <Button loading onClick={onClick}>
        Guardar
      </Button>,
    )
    const button = screen.getByRole('button')
    expect(button).toBeDisabled()
    expect(button).toHaveAttribute('aria-busy', 'true')
    expect(screen.getByText('Cargando…')).toBeInTheDocument()
    fireEvent.click(button)
    expect(onClick).not.toHaveBeenCalled()
  })

  it('respeta disabled sin estar en carga', () => {
    render(<Button disabled>Guardar</Button>)
    expect(screen.getByRole('button')).toBeDisabled()
    expect(screen.queryByText('Cargando…')).not.toBeInTheDocument()
  })
})

describe('Input / Textarea / Select', () => {
  it('asocia la etiqueta con el control y marca el campo requerido', () => {
    render(<Input label="Correo" required />)
    const input = screen.getByLabelText(/Correo/)
    expect(input).toHaveAttribute('aria-required', 'true')
    // Se usa aria-required y NO el atributo nativo, para que la validación
    // propia (y no el globo del navegador) muestre el mensaje (Req 17.6).
    expect(input).not.toHaveAttribute('required')
    expect(screen.getByText('*')).toHaveAttribute('aria-hidden', 'true')
  })

  it('muestra el error y lo vincula al control con aria', () => {
    render(<Input label="Correo" error="Ingresa un correo electrónico válido" />)
    const input = screen.getByLabelText('Correo')
    expect(input).toHaveAttribute('aria-invalid', 'true')
    const error = screen.getByText('Ingresa un correo electrónico válido')
    expect(input.getAttribute('aria-describedby')).toContain(error.id)
  })

  it('sin error no marca aria-invalid ni describedby', () => {
    render(<Input label="Correo" />)
    const input = screen.getByLabelText('Correo')
    expect(input).not.toHaveAttribute('aria-invalid')
    expect(input).not.toHaveAttribute('aria-describedby')
  })

  it('incluye la ayuda en aria-describedby', () => {
    render(<Input label="Nombre" hint="Máximo 100 caracteres" />)
    const hint = screen.getByText('Máximo 100 caracteres')
    expect(screen.getByLabelText('Nombre').getAttribute('aria-describedby')).toContain(hint.id)
  })

  it('cuenta caracteres en un campo no controlado', async () => {
    render(<Input label="Nombre" maxLength={100} showCharCount />)
    expect(screen.getByText('0/100')).toBeInTheDocument()
    await userEvent.type(screen.getByLabelText('Nombre'), 'Hola')
    expect(screen.getByText('4/100')).toBeInTheDocument()
  })

  it('cuenta caracteres en un campo controlado y respeta defaultValue', () => {
    function Controlled() {
      const [value, setValue] = useState('abc')
      return (
        <Input
          label="Nombre"
          maxLength={10}
          showCharCount
          value={value}
          onChange={(e) => setValue(e.target.value)}
        />
      )
    }
    render(<Controlled />)
    expect(screen.getByText('3/10')).toBeInTheDocument()
    render(<Textarea label="Motivo" maxLength={500} showCharCount defaultValue="hola" />)
    expect(screen.getByText('4/500')).toBeInTheDocument()
  })

  it('llama a onChange del consumidor además de contar', async () => {
    const onChange = vi.fn()
    render(<Input label="Nombre" maxLength={10} showCharCount onChange={onChange} />)
    await userEvent.type(screen.getByLabelText('Nombre'), 'ab')
    expect(onChange).toHaveBeenCalledTimes(2)
  })

  it('Select muestra el placeholder y las opciones', () => {
    render(
      <Select
        label="Tipo"
        placeholder="Selecciona un tipo"
        options={[
          { value: 'Equipo', label: 'Equipo' },
          { value: 'Material', label: 'Material' },
        ]}
      />,
    )
    const select = screen.getByLabelText('Tipo')
    expect(select).toHaveValue('')
    expect(screen.getAllByRole('option')).toHaveLength(3)
  })
})

describe('Modal', () => {
  function Harness({ onClose = () => undefined }: { onClose?: () => void }) {
    return (
      <>
        <button>abrir</button>
        <Modal open onClose={onClose}>
          <Modal.Header>Confirmar entrega</Modal.Header>
          <Modal.Body>
            <input aria-label="observaciones" data-autofocus />
          </Modal.Body>
          <Modal.Footer>
            <button>Cancelar</button>
            <button>Confirmar</button>
          </Modal.Footer>
        </Modal>
      </>
    )
  }

  it('expone role dialog, aria-modal y se nombra con su título', () => {
    render(<Harness />)
    const dialog = screen.getByRole('dialog', { name: 'Confirmar entrega' })
    expect(dialog).toHaveAttribute('aria-modal', 'true')
  })

  it('no renderiza nada cuando está cerrado', () => {
    render(
      <Modal open={false} onClose={() => undefined}>
        <Modal.Header>Oculto</Modal.Header>
      </Modal>,
    )
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('se cierra con la tecla Escape', async () => {
    const onClose = vi.fn()
    render(<Harness onClose={onClose} />)
    await userEvent.keyboard('{Escape}')
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('se cierra con el botón × y con clic en el fondo', async () => {
    const onClose = vi.fn()
    render(<Harness onClose={onClose} />)
    await userEvent.click(screen.getByRole('button', { name: 'Cerrar' }))
    expect(onClose).toHaveBeenCalledTimes(1)

    const backdrop = screen.getByRole('dialog').parentElement as HTMLElement
    fireEvent.mouseDown(backdrop)
    expect(onClose).toHaveBeenCalledTimes(2)
  })

  it('enfoca el control marcado con data-autofocus al abrir', () => {
    render(<Harness />)
    expect(screen.getByLabelText('observaciones')).toHaveFocus()
  })

  it('atrapa el foco: Tab desde el último pasa al primero y viceversa', async () => {
    render(<Harness />)
    const cerrar = screen.getByRole('button', { name: 'Cerrar' })
    const confirmar = screen.getByRole('button', { name: 'Confirmar' })

    confirmar.focus()
    await userEvent.tab()
    expect(cerrar).toHaveFocus()

    await userEvent.tab({ shift: true })
    expect(confirmar).toHaveFocus()
  })

  it('devuelve el foco al elemento previo al cerrarse', () => {
    function Toggle() {
      const [open, setOpen] = useState(false)
      return (
        <>
          <button onClick={() => setOpen(true)}>abrir</button>
          <Modal open={open} onClose={() => setOpen(false)}>
            <Modal.Header>Título</Modal.Header>
          </Modal>
        </>
      )
    }
    render(<Toggle />)
    const trigger = screen.getByRole('button', { name: 'abrir' })
    trigger.focus()
    fireEvent.click(trigger)
    expect(screen.getByRole('dialog')).toBeInTheDocument()

    fireEvent.keyDown(document, { key: 'Escape' })
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(trigger).toHaveFocus()
  })

  it('bloquea el scroll del fondo mientras está abierto y lo restaura', () => {
    const { unmount } = render(<Harness />)
    expect(document.body.style.overflow).toBe('hidden')
    unmount()
    expect(document.body.style.overflow).not.toBe('hidden')
  })

  it('Modal.Header falla con un mensaje claro fuera de <Modal>', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => undefined)
    expect(() => render(<Modal.Header>x</Modal.Header>)).toThrow(/dentro de <Modal>/)
    spy.mockRestore()
  })
})

describe('Toast', () => {
  it('un toast de éxito se cierra solo a los 3 segundos', () => {
    vi.useFakeTimers()
    const onClose = vi.fn()
    render(<Toast type="success" message="Guardado" onClose={onClose} />)

    act(() => vi.advanceTimersByTime(TOAST_AUTO_CLOSE_MS - 1))
    expect(onClose).not.toHaveBeenCalled()
    act(() => vi.advanceTimersByTime(1))
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('un toast de error no se cierra solo y usa role alert', () => {
    vi.useFakeTimers()
    const onClose = vi.fn()
    render(<Toast type="error" message="Falló" onClose={onClose} />)
    act(() => vi.advanceTimersByTime(60_000))
    expect(onClose).not.toHaveBeenCalled()
    expect(screen.getByRole('alert')).toHaveTextContent('Falló')
  })

  it('el botón × lo cierra y los no-error usan role status', () => {
    const onClose = vi.fn()
    render(<Toast type="info" message="Aviso" onClose={onClose} />)
    expect(screen.getByRole('status')).toHaveTextContent('Aviso')
    fireEvent.click(screen.getByRole('button', { name: 'Cerrar notificación' }))
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('un re-render con otro onClose no reinicia el temporizador', () => {
    vi.useFakeTimers()
    const first = vi.fn()
    const second = vi.fn()
    const { rerender } = render(<Toast type="success" message="x" onClose={first} />)
    act(() => vi.advanceTimersByTime(2000))
    rerender(<Toast type="success" message="x" onClose={second} />)
    act(() => vi.advanceTimersByTime(1000))
    expect(first).not.toHaveBeenCalled()
    expect(second).toHaveBeenCalledTimes(1)
  })
})

describe('ToastContainer', () => {
  function Trigger({ count }: { count: number }) {
    const { showToast } = useToast()
    return (
      <button
        onClick={() => {
          for (let i = 0; i < count; i++) showToast('error', `Error ${i + 1}`)
        }}
      >
        lanzar
      </button>
    )
  }

  it('apila las notificaciones y limita las visibles a las 5 más recientes', () => {
    render(
      <UIProvider>
        <Trigger count={7} />
        <ToastContainer />
      </UIProvider>,
    )
    fireEvent.click(screen.getByRole('button', { name: 'lanzar' }))
    const visibles = screen.getAllByRole('alert')
    expect(visibles).toHaveLength(5)
    expect(visibles[0]).toHaveTextContent('Error 3')
    expect(visibles[4]).toHaveTextContent('Error 7')
  })

  it('cerrar un toast lo quita de la pila', () => {
    render(
      <UIProvider>
        <Trigger count={2} />
        <ToastContainer />
      </UIProvider>,
    )
    fireEvent.click(screen.getByRole('button', { name: 'lanzar' }))
    fireEvent.click(screen.getAllByRole('button', { name: 'Cerrar notificación' })[0])
    expect(screen.getAllByRole('alert')).toHaveLength(1)
    expect(screen.getByRole('alert')).toHaveTextContent('Error 2')
  })
})

describe('SkeletonLoader', () => {
  it('dibuja `count` marcadores y anuncia "Cargando" una sola vez', () => {
    const { container } = render(<SkeletonLoader variant="card" count={3} />)
    expect(container.querySelectorAll('[aria-hidden="true"]')).toHaveLength(3)
    expect(screen.getAllByText('Cargando contenido…')).toHaveLength(1)
    expect(screen.getByRole('status')).toBeInTheDocument()
  })
})

describe('StatusBadge', () => {
  it('muestra la etiqueta legible de cada estado', () => {
    render(
      <>
        <StatusBadge status="En_Préstamo" />
        <StatusBadge status="En_Mantenimiento" />
        <StatusBadge status="Dado_de_Baja" />
        <StatusBadge status="Vencido" />
      </>,
    )
    expect(screen.getByText('En préstamo')).toBeInTheDocument()
    expect(screen.getByText('En mantenimiento')).toBeInTheDocument()
    expect(screen.getByText('Dado de baja')).toBeInTheDocument()
    expect(screen.getByText('Vencido')).toBeInTheDocument()
  })
})

describe('Breadcrumb', () => {
  const items = [
    { label: 'Inicio', href: '/dashboard' },
    { label: 'Inventario', href: '/inventory' },
    { label: 'Editar recurso' },
  ]

  it('enlaza los niveles previos y marca la página actual sin enlace', () => {
    render(
      <MemoryRouter>
        <Breadcrumb items={items} />
      </MemoryRouter>,
    )
    // `hidden: true`: jsdom aplica el display:none base de la lista de
    // escritorio (que solo se muestra con @media), así que se consulta el
    // marcado sin depender de qué versión muestre el CSS.
    const opts = { hidden: true }
    expect(screen.getByRole('navigation', { name: 'Ruta de navegación' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Inicio', ...opts })).toHaveAttribute('href', '/dashboard')
    expect(screen.getByRole('link', { name: 'Inventario', ...opts })).toHaveAttribute('href', '/inventory')

    const actuales = screen.getAllByText('Editar recurso')
    actuales.forEach((el) => expect(el).toHaveAttribute('aria-current', 'page'))
    expect(screen.queryByRole('link', { name: 'Editar recurso', ...opts })).not.toBeInTheDocument()
  })

  it('la versión móvil ofrece "Atrás" hacia la página padre', () => {
    render(
      <MemoryRouter>
        <Breadcrumb items={items} />
      </MemoryRouter>,
    )
    expect(screen.getByRole('link', { name: /Atrás/ })).toHaveAttribute('href', '/inventory')
  })

  it('con un solo nivel no muestra "Atrás" y sin items no renderiza nada', () => {
    const { container, rerender } = render(
      <MemoryRouter>
        <Breadcrumb items={[{ label: 'Panel' }]} />
      </MemoryRouter>,
    )
    expect(screen.queryByRole('link', { name: /Atrás/ })).not.toBeInTheDocument()

    rerender(
      <MemoryRouter>
        <Breadcrumb items={[]} />
      </MemoryRouter>,
    )
    expect(container).toBeEmptyDOMElement()
  })
})
