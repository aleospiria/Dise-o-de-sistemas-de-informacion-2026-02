import { useEffect, useState } from 'react'

/**
 * Hora actual en milisegundos, actualizada cada `intervalMs`. Sirve para que
 * las listas que dependen del reloj (entregas cuya hora ya llegó, devoluciones
 * que se atrasan) se recalculen solas aunque el usuario no haga nada.
 */
export function useNow(intervalMs = 30_000): number {
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), intervalMs)
    return () => clearInterval(timer)
  }, [intervalMs])

  return now
}
