/**
 * Pantalla PROVISIONAL de las páginas que aún no se implementan.
 *
 * Existe solo para que el router y las guardias se puedan probar de punta a
 * punta antes de construir cada feature. Cada tarea que implemente una página
 * debe reemplazar su `<PendingPage task="…" />` en `router.tsx` y, cuando ya
 * no quede ninguno, este archivo se elimina.
 */
export function PendingPage({ task }: { task: string }) {
  return (
    <p>
      Pantalla pendiente de implementar (<strong>{task}</strong> del plan de
      tareas).
    </p>
  )
}
