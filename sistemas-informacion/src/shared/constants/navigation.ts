/**
 * Menú de navegación como tabla de datos (SOLID OCP).
 *
 * Agregar una opción o cambiar quién la ve es editar esta tabla; el `Sidebar`
 * no cambia. Es también la fuente de verdad de qué roles acceden a cada ruta
 * principal, para que el menú y los `RoleGuard` del router no se desincronicen.
 */
import type { IconName } from '@/shared/components/ui/icons'
import { ALL_ROLES } from '@/shared/constants/roles'
import type { UserRole } from '@/shared/types'

export { ALL_ROLES }

export interface NavItem {
  label: string
  to: string
  /** Ícono decorativo del menú. */
  icon: IconName
  /** Roles que ven y pueden entrar a esta opción. */
  roles: UserRole[]
}

export interface NavGroup {
  id: string
  label: string
  items: NavItem[]
}

export const NAV_GROUPS: NavGroup[] = [
  {
    id: 'principal',
    label: 'Principal',
    items: [
      { label: 'Inicio', to: '/dashboard', icon: 'home', roles: ALL_ROLES },
      { label: 'Disponibilidad', to: '/availability', icon: 'search', roles: ALL_ROLES },
    ],
  },
  {
    id: 'prestamos',
    label: 'Préstamos',
    items: [
      {
        label: 'Mis préstamos',
        to: '/loans/my',
        icon: 'clipboard',
        roles: ['Estudiante', 'Docente'],
      },
      { label: 'Notificaciones', to: '/notifications', icon: 'bell', roles: ALL_ROLES },
    ],
  },
  {
    id: 'operaciones',
    label: 'Operaciones',
    items: [
      {
        label: 'Entregas',
        to: '/deliveries',
        icon: 'send',
        roles: ['Técnico_Laboratorio', 'Administrador_Laboratorio'],
      },
      {
        label: 'Devoluciones',
        to: '/returns',
        icon: 'undo',
        roles: ['Técnico_Laboratorio', 'Administrador_Laboratorio'],
      },
      {
        label: 'Sanciones',
        to: '/sanctions',
        icon: 'shield-alert',
        roles: ['Administrador_Laboratorio'],
      },
    ],
  },
  {
    id: 'administracion',
    label: 'Administración',
    items: [
      {
        label: 'Inventario',
        to: '/inventory',
        icon: 'package',
        roles: ['Administrador_Laboratorio'],
      },
      {
        label: 'Reportes',
        to: '/reports',
        icon: 'bar-chart',
        roles: ['Administrador_Laboratorio'],
      },
      {
        label: 'Usuarios',
        to: '/users',
        icon: 'users',
        roles: ['Administrador_Laboratorio'],
      },
    ],
  },
  {
    id: 'cuenta',
    label: 'Cuenta',
    items: [
      {
        label: 'Seguridad',
        to: '/profile/security',
        icon: 'shield-check',
        roles: ALL_ROLES,
      },
    ],
  },
]

/**
 * Roles con acceso a una opción del menú, para alimentar los `RoleGuard` del
 * router con la misma fuente que el `Sidebar`. Lanza si la ruta no está en el
 * menú: es un error de programación y conviene que falle al arrancar.
 */
export function getRolesForRoute(to: string): UserRole[] {
  const item = NAV_GROUPS.flatMap((group) => group.items).find((i) => i.to === to)
  if (!item) {
    throw new Error(`La ruta "${to}" no está registrada en el menú de navegación.`)
  }
  return item.roles
}

/** Grupos y opciones visibles para un rol; omite los grupos que quedan vacíos. */
export function getNavGroupsForRole(role: UserRole): NavGroup[] {
  return NAV_GROUPS.map((group) => ({
    ...group,
    items: group.items.filter((item) => item.roles.includes(role)),
  })).filter((group) => group.items.length > 0)
}
