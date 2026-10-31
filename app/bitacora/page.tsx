
import type { Metadata } from 'next'
import Link from 'next/link'
import {
  HASH_EXAMPLE_ID,
  TEST_CASE,
  VARIANTS,
  assignVariant,
  conversionRate,
  formatCount,
  formatPoints,
  formatRate,
  rateGap,
  type ExperimentLog,
  type Variant,
} from '@/lib/experiment'
import { getExperimentLog } from '@/lib/db'

export const metadata: Metadata = {
  title: 'Bitácora',
  robots: { index: false, follow: false },
}

export const dynamic = 'force-dynamic'

const ROWS: Variant[] = ['a', 'b']

function ResultsTable({
  log,
}: {
  log: ExperimentLog
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b border-border">
            <th className="py-2">Variante</th>
            <th className="py-2">Impresiones</th>
            <th className="py-2">Conversiones</th>
            <th className="py-2">Tasa</th>
          </tr>
        </thead>
        <tbody>
          {ROWS.map((variant) => (
            <tr key={variant} className="border-b border-border">
              <td className="py-3">
                {variant.toUpperCase()} · {VARIANTS[variant].name}
              </td>
              <td className="py-3 font-mono">
                {formatCount(log[variant].impressions)}
              </td>
              <td className="py-3 font-mono">
                {formatCount(log[variant].conversions)}
              </td>
              <td className="py-3 font-mono">
                {formatRate(conversionRate(log[variant]))}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default async function BitacoraPage() {
  const realLog = await getExperimentLog()

  return (
    <main
      id="contenido"
      className="mx-auto flex max-w-6xl flex-col gap-10 px-6 py-10 md:py-14"
    >
      <div className="flex flex-col gap-3">
        <p className="font-mono text-xs tracking-widest text-muted-foreground uppercase">
          Laboratorio Test A/B y SEO
        </p>

        <h1 className="font-serif text-4xl md:text-5xl">
          Bitácora del experimento
        </h1>

        <p className="text-muted-foreground">
          Impresiones, conversiones y tasas por variante.
          Una diferencia de tasas no demuestra un ganador.
        </p>
      </div>

      <section className="flex flex-col gap-4">
        <h2 className="font-serif text-2xl">
          Eventos reales
        </h2>

        <p className="text-sm text-muted-foreground">
          Datos registrados en PostgreSQL.
        </p>

        <ResultsTable log={realLog} />

        <p className="font-mono text-sm">
          B − A = {formatPoints(rateGap(realLog))}
        </p>
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="font-serif text-2xl">
          Caso de prueba fijo
        </h2>

        <p className="text-sm text-muted-foreground">
          Estos valores se calculan a partir de los conteos
          proporcionados por la cátedra.
        </p>

        <ResultsTable log={TEST_CASE} />

        <p className="font-mono text-sm">
          B − A = {formatPoints(rateGap(TEST_CASE))}
        </p>
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="font-serif text-2xl">
          Prueba de asignación estable
        </h2>

        <p className="font-mono text-sm">
          assignVariant('{HASH_EXAMPLE_ID}') →{' '}
          {assignVariant(HASH_EXAMPLE_ID).toUpperCase()}
        </p>

        <p className="text-sm text-muted-foreground">
          El mismo identificador siempre produce
          la misma variante.
        </p>
      </section>

      <Link
        href="/practica"
        className="text-sm text-muted-foreground underline"
      >
        Volver a la landing
      </Link>
    </main>
  )
}
