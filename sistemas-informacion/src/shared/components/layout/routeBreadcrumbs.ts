import { matchPath } from 'react-router-dom'
import type { BreadcrumbItem } from '@/shared/components/ui/Breadcrumb'

const HOME: BreadcrumbItem = { label: 'Inicio', href: '/dashboard' }

/**
 * Migas de pan por ruta (Req 20.2). Es una tabla de datos: una página nueva
 * agrega una fila. El último elemento es siempre la página actual, sin `href`.
 */
const ROUTE_BREADCRUMBS: Array<{ pattern: string; crumbs: BreadcrumbItem[] }> = [
  { pattern: '/dashboard', crumbs: [{ label: 'Inicio' }] },
  { pattern: '/availability', crumbs: [HOME, { label: 'Disponibilidad' }] },
  {
    pattern: '/loans/new/:resourceId',
    crumbs: [
      HOME,
      { label: 'Disponibilidad', href: '/availability' },
      { label: 'Solicitar préstamo' },
    ],
  },
  { pattern: '/loans/my', crumbs: [HOME, { label: 'Mis préstamos' }] },
  { pattern: '/deliveries', crumbs: [HOME, { label: 'Entregas' }] },
  { pattern: '/returns', crumbs: [HOME, { label: 'Devoluciones' }] },
  { pattern: '/inventory', crumbs: [HOME, { label: 'Inventario' }] },
  {
    pattern: '/inventory/new',
    crumbs: [
      HOME,
      { label: 'Inventario', href: '/inventory' },
      { label: 'Nuevo recurso' },
    ],
  },
  {
    pattern: '/inventory/:id/edit',
    crumbs: [
      HOME,
      { label: 'Inventario', href: '/inventory' },
      { label: 'Editar recurso' },
    ],
  },
  { pattern: '/access-denied', crumbs: [HOME, { label: 'Acceso denegado' }] },
]

/**
 * Migas de pan de una URL. Devuelve `[]` si la ruta no está registrada
 * (p. ej. la página 404), en cuyo caso no se muestra ninguna.
 */
export function getRouteBreadcrumbs(pathname: string): BreadcrumbItem[] {
  const match = ROUTE_BREADCRUMBS.find(({ pattern }) => matchPath(pattern, pathname))
  return match ? match.crumbs : []
}
