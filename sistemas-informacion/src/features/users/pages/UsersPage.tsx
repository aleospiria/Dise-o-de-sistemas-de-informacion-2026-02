import { useMemo, useState } from 'react'
import { useAuth } from '@/contexts/useAuth'
import { useToast } from '@/contexts/useToast'
import { useUsers } from '@/contexts/useUsers'
import { apiErrorMessage } from '@/services/api/errors'
import { Alert } from '@/shared/components/ui/Alert'
import styles from '@/shared/components/ui/DataPage.module.css'
import { Input } from '@/shared/components/ui/Input'
import { Select } from '@/shared/components/ui/Select'
import { ROLE_LABELS, ALL_ROLES } from '@/shared/constants/roles'
import { formatDate } from '@/shared/utils/dateUtils'
import type { User, UserRole } from '@/shared/types'

const ROLE_OPTIONS = ALL_ROLES.map((role) => ({
  value: role,
  label: ROLE_LABELS[role],
}))

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

  return (
    <div className={styles.page}>
      <header className={styles.pageHeader}>
        <div className={styles.pageHeading}>
          <p className={styles.eyebrow}>Administración de cuentas</p>
          <p className={styles.lead} aria-live="polite">
            {filtered.length} de {users.length} usuarios visibles con los filtros
            actuales.
          </p>
        </div>
      </header>

      <section className={styles.panel} aria-label="Filtros de usuarios">
        <div className={styles.filters}>
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
        </div>
      </section>

      {error && <Alert type="error">{error}</Alert>}

      {filtered.length === 0 ? (
        <div className={styles.empty}>
          <span className={styles.emptyTitle}>Sin coincidencias</span>
          <span>No hay usuarios que coincidan con la búsqueda.</span>
        </div>
      ) : (
        <section className={styles.panel}>
          <div className={styles.tableWrapper}>
            <table className={styles.table}>
              <caption className="sr-only">Usuarios registrados</caption>
              <thead>
                <tr>
                  <th scope="col">Nombre</th>
                  <th scope="col">Correo</th>
                  <th scope="col">Cédula</th>
                  <th scope="col">Carnet</th>
                  <th scope="col">Registro</th>
                  <th scope="col">2FA</th>
                  <th scope="col">Rol</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((user) => (
                  <tr key={user.idUsuario}>
                    <th scope="row">{user.nombre}</th>
                    <td>{user.correo}</td>
                    <td>{user.cedula}</td>
                    <td>{user.carnet ?? '—'}</td>
                    <td>{formatDate(user.fechaRegistro)}</td>
                    <td>
                      <span
                        className={`${styles.badge} ${
                          user.totpEnabled ? styles.badgeSuccess : styles.badgeExpired
                        }`}
                      >
                        {user.totpEnabled ? 'Activada' : 'Desactivada'}
                      </span>
                    </td>
                    <td>
                      <Select
                        label={`Rol de ${user.nombre}`}
                        options={ROLE_OPTIONS}
                        value={user.idRol}
                        disabled={savingId === user.idUsuario}
                        onChange={(event) =>
                          void changeRole(user, event.target.value as UserRole)
                        }
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  )
}
