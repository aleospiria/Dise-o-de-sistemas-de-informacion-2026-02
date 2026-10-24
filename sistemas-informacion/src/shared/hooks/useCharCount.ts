import { useState, type ChangeEvent } from 'react'

type TextControl = HTMLInputElement | HTMLTextAreaElement

/**
 * Lleva la cuenta de caracteres de un campo de texto (Req 17.9).
 *
 * Funciona con campos controlados (`value`) y no controlados (`defaultValue`,
 * como los que registra react-hook-form): en el segundo caso cuenta a partir
 * de los eventos `change`.
 */
export function useCharCount<E extends TextControl>(
  value: unknown,
  defaultValue: unknown,
  onChange?: (event: ChangeEvent<E>) => void,
) {
  const [uncontrolledCount, setUncontrolledCount] = useState(
    () => String(defaultValue ?? '').length,
  )
  const count = value !== undefined ? String(value).length : uncontrolledCount

  const handleChange = (event: ChangeEvent<E>) => {
    setUncontrolledCount(event.target.value.length)
    onChange?.(event)
  }

  return { count, handleChange }
}
