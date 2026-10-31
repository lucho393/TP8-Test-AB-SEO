
import type { Metadata } from 'next'
import Link from 'next/link'
import { cookies, headers } from 'next/headers'
import { Landing } from '@/components/landing'
import {
  CANONICAL_PATH,
  COOKIE,
  DESCRIPTION_RANGE,
  TITLE_RANGE,
  VARIANTS,
  assignVariant,
  characterCount,
  inRange,
  isVariant,
  type Variant,
} from '@/lib/experiment'

type PracticaPageProps = {
  searchParams: Promise<{ preview?: string | string[] }>
}

function firstParam(
  value: string | string[] | undefined
): string | undefined {
  return Array.isArray(value) ? value[0] : value
}

async function getVariant(
  searchParams: PracticaPageProps['searchParams']
): Promise<{ variant: Variant; preview: boolean }> {
  const params = await searchParams
  const requested = firstParam(params.preview)

  // El preview muestra el mensaje solicitado sin alterar cookies.
  if (isVariant(requested)) {
    return {
      variant: requested,
      preview: true,
    }
  }

  // El proxy comunica la variante de la solicitud actual.
  // Esto también permite que los crawlers reciban A.
  const requestHeaders = await headers()
  const assignedVariant = requestHeaders.get('x-lab-variant')

  if (isVariant(assignedVariant)) {
    return {
      variant: assignedVariant,
      preview: false,
    }
  }

  // Respaldo: recuperar la asignación desde las cookies.
  const cookieStore = await cookies()
  const visitorId = cookieStore.get(COOKIE.visitor)?.value

  if (visitorId) {
    return {
      variant: assignVariant(visitorId),
      preview: false,
    }
  }

  return {
    variant: 'a',
    preview: false,
  }
}

export async function generateMetadata({
  searchParams,
}: PracticaPageProps): Promise<Metadata> {
  const { variant, preview } = await getVariant(searchParams)
  const copy = VARIANTS[variant]

  return {
    title: {
      absolute: copy.seoTitle,
    },
    description: copy.seoDescription,
    alternates: {
      canonical: CANONICAL_PATH,
    },
    robots: {
      index: !preview,
      follow: true,
    },
  }
}

export default async function PracticaPage({
  searchParams,
}: PracticaPageProps) {
  const { variant, preview } = await getVariant(searchParams)

  const copy = VARIANTS[variant]
  const titleLength = characterCount(copy.seoTitle)
  const descriptionLength = characterCount(copy.seoDescription)

  return (
    <main
      id="contenido"
      className="mx-auto flex max-w-6xl flex-col gap-10 px-6 py-10 md:py-14"
    >
      <p className="font-mono text-[0.7rem] tracking-[0.16em] text-muted-foreground uppercase">
        Laboratorio Test A/B y SEO
      </p>

      <p className="border-b border-border pb-4 text-sm text-muted-foreground">
        {preview
          ? `Vista previa del mensaje ${variant.toUpperCase()}. No modifica la asignación ni registra eventos.`
          : `Variante asignada: ${variant.toUpperCase()}. La asignación se conserva mediante cookies.`}
      </p>

      <Landing variant={variant} preview={preview} />

      <div className="flex flex-wrap gap-2">
        <Link
          href="/practica?preview=a"
          className="rounded-md border border-border px-3 py-1.5 text-sm"
        >
          Ver copy A
        </Link>

        <Link
          href="/practica?preview=b"
          className="rounded-md border border-border px-3 py-1.5 text-sm"
        >
          Ver copy B
        </Link>

        <Link
          href="/bitacora"
          className="rounded-md border border-border px-3 py-1.5 text-sm"
        >
          Bitácora
        </Link>

        <Link
          href="/practica"
          className="rounded-md border border-border px-3 py-1.5 text-sm"
        >
          Volver a mi variante
        </Link>
      </div>

      <section className="flex flex-col gap-4">
        <h2 className="font-serif text-2xl">
          Metadatos SEO de la variante {variant.toUpperCase()}
        </h2>

        <dl className="grid gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-1 border-b border-border pb-3">
            <dt className="font-mono text-[0.7rem] tracking-[0.14em] text-muted-foreground uppercase">
              Title
            </dt>

            <dd>{copy.seoTitle}</dd>

            <dd className="font-mono text-sm text-muted-foreground">
              {titleLength} caracteres ·{' '}
              {inRange(titleLength, TITLE_RANGE)
                ? 'dentro de 50–60'
                : 'fuera de rango'}
            </dd>
          </div>

          <div className="flex flex-col gap-1 border-b border-border pb-3">
            <dt className="font-mono text-[0.7rem] tracking-[0.14em] text-muted-foreground uppercase">
              Description
            </dt>

            <dd>{copy.seoDescription}</dd>

            <dd className="font-mono text-sm text-muted-foreground">
              {descriptionLength} caracteres ·{' '}
              {inRange(descriptionLength, DESCRIPTION_RANGE)
                ? 'dentro de 140–160'
                : 'fuera de rango'}
            </dd>
          </div>
        </dl>

        <p className="text-sm text-muted-foreground">
          Canonical: {CANONICAL_PATH}
        </p>

        {preview && (
          <p className="text-sm text-muted-foreground">
            Esta vista previa tiene noindex.
          </p>
        )}
      </section>
    </main>
  )
}
