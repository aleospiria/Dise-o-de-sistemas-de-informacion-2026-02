import type { ComponentProps } from 'react'
import { FormField } from '@/shared/components/ui/FormField'
import controlStyles from '@/shared/components/ui/formControl.module.css'
import { useCharCount } from '@/shared/hooks/useCharCount'

export interface InputProps extends Omit<ComponentProps<'input'>, 'required'> {
  label: string
  error?: string
  hint?: string
  required?: boolean
  /** Muestra "n/max" si el campo tiene `maxLength` (Req 17.9). */
  showCharCount?: boolean
}

export function Input({
  label,
  error,
  hint,
  required,
  showCharCount,
  className,
  onChange,
  ...rest
}: InputProps) {
  const { count, handleChange } = useCharCount<HTMLInputElement>(
    rest.value,
    rest.defaultValue,
    onChange,
  )
  const counter =
    showCharCount && rest.maxLength ? { current: count, max: rest.maxLength } : undefined

  return (
    <FormField
      label={label}
      error={error}
      hint={hint}
      required={required}
      counter={counter}
    >
      {(control) => (
        <input
          {...rest}
          {...control}
          onChange={handleChange}
          className={[controlStyles.control, className].filter(Boolean).join(' ')}
        />
      )}
    </FormField>
  )
}
