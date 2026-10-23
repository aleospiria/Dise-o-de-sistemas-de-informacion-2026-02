import { useContext, type Context } from 'react'

/**
 * Lee un contexto y falla con un mensaje claro si el componente se usa fuera
 * de su provider. Evita repetir el mismo chequeo en cada hook.
 */
export function useRequiredContext<T>(
  context: Context<T | undefined>,
  hookName: string,
  providerName: string,
): T {
  const value = useContext(context)
  if (value === undefined) {
    throw new Error(`${hookName} debe usarse dentro de <${providerName}>.`)
  }
  return value
}
