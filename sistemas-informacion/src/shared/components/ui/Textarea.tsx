import type { ComponentProps } from 'react'
import { FormField } from '@/shared/components/ui/FormField'
import controlStyles from '@/shared/components/ui/formControl.module.css'
import { useCharCount } from '@/shared/hooks/useCharCount'

export interface TextareaProps
  extends Omit<ComponentProps<'textarea'>, 'required'> {
  label: string
  error?: string
  hint?: string
  required?: boolean
  /** Muestra "n/max" si el campo tiene `maxLength` (Req 17.9). */
  showCharCount?: boolean
}

/** Campo multilínea para descripciones, motivos y observaciones. */
export function Textarea({
  label,
  error,
  hint,
  required,
  showCharCount,
  className,
  onChange,
  ...rest
}: TextareaProps) {
  const { count, handleChange } = useCharCount<HTMLTextAreaElement>(
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
        <textarea
          {...rest}
          {...control}
          onChange={handleChange}
          className={[controlStyles.control, className].filter(Boolean).join(' ')}
        />
      )}
    </FormField>
  )
}
