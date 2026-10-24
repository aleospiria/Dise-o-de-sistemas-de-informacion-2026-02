import type { ComponentProps } from 'react'
import { FormField } from '@/shared/components/ui/FormField'
import controlStyles from '@/shared/components/ui/formControl.module.css'

export interface SelectOption {
  value: string
  label: string
}

export interface SelectProps extends Omit<ComponentProps<'select'>, 'required'> {
  label: string
  options: SelectOption[]
  error?: string
  hint?: string
  required?: boolean
  /** Opción inicial sin valor, p. ej. "Selecciona un tipo". */
  placeholder?: string
}

export function Select({
  label,
  options,
  error,
  hint,
  required,
  placeholder,
  className,
  ...rest
}: SelectProps) {
  return (
    <FormField label={label} error={error} hint={hint} required={required}>
      {(control) => (
        <select
          {...rest}
          {...control}
          className={[controlStyles.control, className].filter(Boolean).join(' ')}
        >
          {placeholder !== undefined && <option value="">{placeholder}</option>}
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      )}
    </FormField>
  )
}
