import { useMemo, useState } from 'react'
import { useAuth } from '@/contexts/useAuth'
import { useToast } from '@/contexts/useToast'
import { useUsers } from '@/contexts/useUsers'
import styles from '@/features/users/pages/UsersPage.module.css'
import { apiErrorMessage } from '@/services/api/errors'
import { Alert } from '@/shared/components/ui/Alert'
import { Badge } from '@/shared/components/ui/Badge'
import { Button } from '@/shared/components/ui/Button'
import { DataTable, type DataTableColumn } from '@/shared/components/ui/DataTable'
import { EmptyState } from '@/shared/components/ui/EmptyState'
import { FilterBar } from '@/shared/components/ui/FilterBar'
import { Input } from '@/shared/components/ui/Input'
import { PageHeader } from '@/shared/components/ui/PageHeader'
import { Select } from '@/shared/components/ui/Select'
import { ROLE_LABELS, ALL_ROLES } from '@/shared/constants/roles'
import { formatDate } from '@/shared/utils/dateUtils'
import type { User, UserRole } from '@/shared/types'

const ROLE_OPTIONS = ALL_ROLES.map((role) => ({
  value: role,
  label: ROLE_LABELS[role],
}))

function getInitials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0].toUpperCase())
    .join('')
}

export function UsersPage() {
  const { showToast } = useToast()
  const { session, updateSession } = useAuth()
  const { users, updateUser } = useUsers()
  const [search, setSearch] = useState('')
  const [role, setRole] = useState<UserRole | ''>('')
  const [error, setError] = useState<string | null>(null)
  const [savingId, setSavingId] = useState<string | null>(null)

  const filtered = useMemo(() => {
    const term = search.trim().toLocaleLowerCase('es')
    return users.filter((user) => {
      const matchesRole = !role || user.idRol === role
      const matchesSearch =
        !term ||
        user.nombre.toLocaleLowerCase('es').includes(term) ||
        user.correo.toLocaleLowerCase('es').includes(term) ||
        user.cedula.includes(term)
      return matchesRole && matchesSearch
    })
  }, [users, search, role])

  const filtering = search.trim() !== '' || role !== ''

  async function changeRole(user: User, nextRole: UserRole) {
    setError(null)
    setSavingId(user.idUsuario)
    try {
      const result = await updateUser(user.idUsuario, { idRol: nextRole })
      if (!result.success) {
        setError(result.error ?? 'No se pudo actualizar el rol.')
        return
      }
      if (user.idUsuario === session?.userId) updateSession({ role: nextRole })
      showToast('success', `Rol de ${user.nombre} actualizado a ${ROLE_LABELS[nextRole]}.`)
    } catch (caught) {
      setError(apiErrorMessage(caught))
    } finally {
      setSavingId(null)
    }
  }

  const columns: DataTableColumn<User>[] = [
    {
      key: 'nombre',
      header: 'Nombre',
      rowHeader: true,
      render: (user) => (
        <span className={styles.name}>
          <span className={styles.avatar} aria-hidden="true">
            {getInitials(user.nombre)}
          </span>
          {user.nombre}
        </span>
      ),
    },
    {
      key: 'correo',
      header: 'Correo',
      render: (user) => <span className={styles.email}>{user.correo}</span>,
    },
    { key: 'cedula', header: 'Cédula', render: (user) => user.cedula },
    { key: 'carnet', header: 'Carnet', render: (user) => user.carnet ?? '—' },
    { key: 'registro', header: 'Registro', render: (user) => formatDate(user.fechaRegistro) },
    {
      key: 'totp',
      header: '2FA',
      render: (user) =>
        user.totpEnabled ? (
          <Badge tone="green" icon="shield-check">
            Activada
          </Badge>
        ) : (
          <Badge tone="gray" icon="shield-alert">
            Desactivada
          </Badge>
        ),
    },
    {
      key: 'rol',
      header: 'Rol',
      render: (user) => (
        <div className={styles.roleSelect}>
          <Select
            label={`Rol de ${user.nombre}`}
            options={ROLE_OPTIONS}
            value={user.idRol}
            disabled={savingId === user.idUsuario}
            onChange={(event) => void changeRole(user, event.target.value as UserRole)}
          />
        </div>
      ),
    },
  ]

  return (
    <div className={styles.page}>
      <PageHeader
        eyebrow="Administración de cuentas"
        description={
          <span aria-live="polite">
            {filtered.length} de {users.length} usuarios visibles con los filtros
            actuales.
          </span>
        }
      />

      <FilterBar label="Filtros de usuarios" columns={2}>
        <Input
          label="Buscar"
          type="search"
          placeholder="Nombre, correo o cédula"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
        <Select
          label="Rol"
          placeholder="Todos los roles"
          options={ROLE_OPTIONS}
          value={role}
          onChange={(event) => setRole(event.target.value as UserRole | '')}
        />
      </FilterBar>

      {error && <Alert type="error">{error}</Alert>}

      {filtered.length === 0 ? (
        <EmptyState
          icon="users"
          title="Sin coincidencias"
          description="No hay usuarios que coincidan con la búsqueda."
          action={
            filtering ? (
              <Button
                variant="secondary"
                icon="refresh"
                onClick={() => {
                  setSearch('')
                  setRole('')
                }}
              >
                Quitar filtros
              </Button>
            ) : undefined
          }
        />
      ) : (
        <DataTable
          label="Usuarios registrados"
          columns={columns}
          rows={filtered}
          getRowKey={(user) => user.idUsuario}
        />
      )}
    </div>
  )
}
