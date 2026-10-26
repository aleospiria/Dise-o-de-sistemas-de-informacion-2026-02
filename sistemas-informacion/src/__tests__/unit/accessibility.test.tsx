import { screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { renderApp } from '@/test/renderApp'
import {
  ALL_ROLES,
  getRolesForRoute,
  NAV_GROUPS,
} from '@/shared/constants/navigation'
import { LS_KEYS } from '@/shared/constants/lsKeys'
import type { Resource, UserRole } from '@/shared/types'

// Auditoría de accesibilidad (Req 21) de las páginas reales. Lo visual (foco,
// contraste, tamaños táctiles, breakpoints) no se evalúa en jsdom: se revisa
// en navegador (ver docs/guia-de-pruebas-manuales.md, sección 9).

const GENERIC_NAME = /^(click aquí|clic aquí|haz clic aquí|haz click aquí|aquí|click|clic)$/i

const INTERACTIVE = 'a[href], button, input:not([type="hidden"]), select, textarea, summary'

type RenderResult = ReturnType<typeof renderApp>

/** Abre el menú móvil si existe, para auditar también sus enlaces. */
async function openMenu({ user }: RenderResult) {
  const burger = screen.queryByRole('button', { name: 'Abrir menú' })
  if (burger) await user.click(burger)
}

function auditPage() {
  const elements = Array.from(document.body.querySelectorAll<HTMLElement>(INTERACTIVE))
  expect(elements.length).toBeGreaterThan(0)

  // Req 21.1, 21.6, 21.11: todo control tiene nombre accesible y no es genérico.
  for (const element of elements) {
    expect(element, element.outerHTML.slice(0, 120)).toHaveAccessibleName()
    const name = element.getAttribute('aria-label') ?? element.textContent ?? ''
    expect(name.trim()).not.toMatch(GENERIC_NAME)
  }

  // Req 21.5: toda imagen declara su alternativa.
  for (const image of Array.from(document.querySelectorAll('img'))) {
    expect(image).toHaveAttribute('alt')
    expect(image.getAttribute('alt')?.trim()).not.toBe('')
  }

  // Orden de tabulación natural (Req 21.3): nadie fuerza un orden con tabindex > 0.
  for (const element of Array.from(document.querySelectorAll('[tabindex]'))) {
    expect(Number(element.getAttribute('tabindex'))).toBeLessThanOrEqual(0)
  }

  // Los ids son únicos y toda referencia ARIA apunta a un elemento existente.
  const ids = Array.from(document.querySelectorAll('[id]')).map((e) => e.id)
  expect(ids.filter((id, i) => ids.indexOf(id) !== i)).toEqual([])
  for (const attribute of ['aria-describedby', 'aria-labelledby', 'aria-controls']) {
    for (const element of Array.from(document.querySelectorAll(`[${attribute}]`))) {
      for (const id of (element.getAttribute(attribute) ?? '').split(/\s+/).filter(Boolean)) {
        expect(document.getElementById(id), `${attribute}="${id}"`).not.toBeNull()
      }
    }
  }

  // Un único <h1> por página (Req 20.10).
  expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1)
}

const MENU_ROUTES = NAV_GROUPS.flatMap((group) => group.items).flatMap((item) =>
  ALL_ROLES.filter((role) => getRolesForRoute(item.to).includes(role)).map((role) => ({
    role,
    to: item.to,
  })),
)

const EXTRA_ROUTES: { role: UserRole; to: string }[] = [
  { role: 'Estudiante', to: '/loans/new/r-0002' },
  { role: 'Administrador_Laboratorio', to: '/inventory/new' },
  { role: 'Administrador_Laboratorio', to: '/inventory/r-0005/edit' },
  { role: 'Estudiante', to: '/inventory' }, // termina en /access-denied
]

describe('auditoría de páginas autenticadas (Req 21.1, 21.5, 21.6, 21.11)', () => {
  it.each([...MENU_ROUTES, ...EXTRA_ROUTES])('$role → $to', async ({ role, to }) => {
    const app = renderApp(to, { role })
    await openMenu(app)
    auditPage()
  })
})

describe('auditoría de páginas públicas', () => {
  it.each(['/login', '/register', '/ruta-que-no-existe'])('%s', (path) => {
    renderApp(path)
    auditPage()
  })
})

describe('landmarks y salto al contenido (Req 21.8, 21.3)', () => {
  it('el enlace "Saltar al contenido" es el primer elemento enfocable y apunta al <main>', async () => {
    const { user } = renderApp('/dashboard', { role: 'Estudiante' })
    await user.tab()

    const skip = screen.getByRole('link', { name: 'Saltar al contenido' })
    expect(skip).toHaveFocus()
    expect(document.querySelector(skip.getAttribute('href') as string)).toBe(
      screen.getByRole('main'),
    )
  })

  it('el menú lateral es una navegación con nombre y los grupos exponen su estado expandido', async () => {
    const app = renderApp('/dashboard', { role: 'Administrador_Laboratorio' })
    await openMenu(app)

    const menu = within(screen.getByRole('navigation', { name: 'Navegación principal' }))
    const toggles = menu.getAllByRole('button')
    expect(toggles.length).toBeGreaterThan(0)
    for (const toggle of toggles) {
      expect(toggle).toHaveAttribute('aria-expanded', 'true')
      expect(toggle).toHaveAttribute('aria-controls')
    }
    expect(menu.getByRole('link', { name: 'Inicio' })).toHaveAttribute('aria-current', 'page')
  })
})

describe('orden de tabulación del formulario de acceso (Req 21.3)', () => {
  it('recorre los campos, la acción principal y los enlaces en orden visual', async () => {
    const { user } = renderApp('/login')
    const expected = [
      screen.getByLabelText(/^Correo electrónico/),
      screen.getByLabelText(/^Contraseña/),
      screen.getByRole('button', { name: 'Iniciar sesión' }),
      screen.getByRole('button', { name: '¿Olvidaste tu contraseña?' }),
      screen.getByText('Cuentas de demostración'),
      screen.getByRole('button', { name: /^Estudiante/ }),
      screen.getByRole('button', { name: /^Técnico/ }),
      screen.getByRole('button', { name: /^Administrador/ }),
      screen.getByRole('link', { name: 'Crear cuenta' }),
    ]

    for (const element of expected) {
      await user.tab()
      expect(element).toHaveFocus()
    }
  })
})

describe('errores de formulario accesibles (Req 21.7, 17.2)', () => {
  it('cada campo inválido queda marcado y apunta a su mensaje dentro de una región aria-live', async () => {
    const { user } = renderApp('/register')
    await user.click(screen.getByRole('button', { name: 'Crear cuenta' }))

    const invalid = await screen.findAllByRole('textbox', { description: /requerido/i })
    expect(invalid.length).toBeGreaterThan(0)

    for (const field of Array.from(document.querySelectorAll('[aria-invalid="true"]'))) {
      const messageId = (field.getAttribute('aria-describedby') ?? '').split(/\s+/).pop()
      const message = document.getElementById(messageId ?? '')
      expect(message, 'mensaje de error enlazado').not.toBeNull()
      expect(message?.closest('[aria-live="polite"]')).not.toBeNull()
    }
  })

  it('las regiones aria-live existen desde el inicio para que el primer error se anuncie', () => {
    renderApp('/login')
    expect(document.querySelectorAll('[aria-live="polite"]').length).toBeGreaterThanOrEqual(2)
  })
})

describe('imágenes de recursos (Req 21.5)', () => {
  it('la foto de una tarjeta lleva un alt con el nombre del recurso; sin foto no hay <img>', () => {
    renderApp('/availability', {
      role: 'Estudiante',
      prepare: (repo) => {
        const resources = repo.get<Resource[]>(LS_KEYS.RESOURCES) ?? []
        repo.set(
          LS_KEYS.RESOURCES,
          resources.map((r) =>
            r.idRecurso === 'r-0002' ? { ...r, imagenUrl: 'data:image/png;base64,AAAA' } : r,
          ),
        )
      },
    })

    const images = screen.getAllByRole('img')
    expect(images).toHaveLength(1)
    expect(images[0]).toHaveAccessibleName('Imagen de Multímetro Fluke 117')
  })
})

describe('tabla de inventario (Req 16.4, 21.1)', () => {
  it('conserva la semántica de tabla y nombra cada "Ver detalles" con su recurso', () => {
    renderApp('/inventory', { role: 'Administrador_Laboratorio' })

    const table = screen.getByRole('table', { name: 'Recursos del inventario' })
    expect(within(table).getAllByRole('columnheader').map((h) => h.textContent)).toEqual([
      'Nombre',
      'Tipo',
      'Estado',
      'Disponibles',
      'Acciones',
    ])
    expect(within(table).getAllByRole('rowheader')).toHaveLength(8)

    const summaries = Array.from(table.querySelectorAll('summary'))
    expect(summaries).toHaveLength(8)
    expect(summaries[0]).toHaveTextContent(/^Ver detalles/)
    expect(summaries[0]).toHaveAccessibleName(/^Ver detalles de .+/)
    expect(new Set(summaries.map((s) => s.textContent)).size).toBe(8)
  })
})
