import { useEffect } from 'react'
import { APP_NAME } from '@/shared/constants/app'

/** Fija el título de la pestaña como "<página> · <aplicación>". */
export function useDocumentTitle(title: string): void {
  useEffect(() => {
    document.title = `${title} · ${APP_NAME}`
  }, [title])
}
