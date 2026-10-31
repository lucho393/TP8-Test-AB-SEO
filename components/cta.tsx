
'use client'

import { useState, useTransition } from 'react'
import { recordConversion } from '@/app/practica/actions'

type ConversionStatus =
  | 'recorded'
  | 'duplicate'
  | 'ignored'
  | 'error'
  | null

export function Cta({
  label,
  preview = false,
}: {
  label: string
  preview?: boolean
}) {
  const [status, setStatus] = useState<ConversionStatus>(null)
  const [pending, startTransition] = useTransition()

  function handleClick() {
    if (preview) {
      setStatus('ignored')
      return
    }

    startTransition(async () => {
      try {
        const result = await recordConversion()
        setStatus(result.status)
      } catch {
        setStatus('error')
      }
    })
  }

  const messages = {
    recorded: 'Conversión registrada correctamente.',
    duplicate: 'La conversión ya estaba registrada.',
    ignored: preview
      ? 'El preview no registra conversiones.'
      : 'No hay una asignación válida para registrar.',
    error: 'No se pudo registrar la conversión.',
  }

  return (
    <div className="flex flex-col items-start gap-2">
      <button
        type="button"
        disabled={pending}
        onClick={handleClick}
        className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50"
      >
        {pending ? 'Registrando...' : label}
      </button>

      <p className="max-w-md text-sm text-muted-foreground">
        {status
          ? messages[status]
          : preview
            ? 'Vista previa: no se registran eventos.'
            : 'La conversión se registra solo al hacer clic.'}
      </p>
    </div>
  )
}
