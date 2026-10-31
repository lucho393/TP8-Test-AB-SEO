
import 'server-only'
import { Pool } from 'pg'
import type { ExperimentLog, Variant } from './experiment'
import { emptyLog, parseLog } from './experiment'

const globalForDb = globalThis as typeof globalThis & {
    tp8Pool?: Pool
}

function getPool(): Pool {
    if (!globalForDb.tp8Pool) {
        if (!process.env.DATABASE_URL) {
            throw new Error('Falta DATABASE_URL en .env.local')
        }

        globalForDb.tp8Pool = new Pool({
            connectionString: process.env.DATABASE_URL,
            max: 5,
        })
    }

    return globalForDb.tp8Pool
}

export async function recordImpression(
    visitorId: string,
    variant: Variant
): Promise<boolean> {
    const client = await getPool().connect()

    try {
        await client.query('BEGIN')

        // Bloqueo por visitante para evitar impresiones simultáneas.
        await client.query(
            'SELECT pg_advisory_xact_lock(hashtextextended($1, 0))',
            [visitorId]
        )

        const result = await client.query(
            `
            INSERT INTO events (visitor_id, variant, type)
            SELECT $1, $2, 'impression'
            WHERE NOT EXISTS (
                SELECT 1
                FROM events
                WHERE visitor_id = $1
                  AND type = 'impression'
                  AND created_at > NOW() - INTERVAL '30 minutes'
            )
            RETURNING id
            `,
            [visitorId, variant]
        )

        await client.query('COMMIT')

        return (result.rowCount ?? 0) > 0
    } catch (error) {
        await client.query('ROLLBACK')
        throw error
    } finally {
        client.release()
    }
}

export async function recordConversionEvent(
    visitorId: string,
    variant: Variant
): Promise<boolean> {
    const result = await getPool().query(
        `
        INSERT INTO events (visitor_id, variant, type)
        VALUES ($1, $2, 'conversion')
        ON CONFLICT (visitor_id)
            WHERE type = 'conversion'
        DO NOTHING
        RETURNING id
        `,
        [visitorId, variant]
    )

    return (result.rowCount ?? 0) > 0
}

export async function getExperimentLog(): Promise<ExperimentLog> {
    const result = await getPool().query<{
        variant: Variant
        type: 'impression' | 'conversion'
        total: string
    }>(
        `
        SELECT variant, type, COUNT(*)::text AS total
        FROM events
        GROUP BY variant, type
        `
    )

    const log = emptyLog()

    for (const row of result.rows) {
        if (
            (row.variant !== 'a' && row.variant !== 'b') ||
            (row.type !== 'impression' && row.type !== 'conversion')
        ) {
            continue
        }

        const total = Number(row.total)

        if (!Number.isSafeInteger(total) || total < 0) {
            throw new Error('Conteo inválido en la base de datos')
        }

        if (row.type === 'impression') {
            log[row.variant].impressions = total
        } else {
            log[row.variant].conversions = total
        }
    }

    return parseLog(JSON.stringify(log))
}
