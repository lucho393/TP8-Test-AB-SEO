
'use server'

import { cookies } from 'next/headers'
import {
  assignVariant,
  COOKIE,
  isVariant,
} from '@/lib/experiment'
import { recordConversionEvent } from '@/lib/db'

export async function recordConversion(): Promise<{
  status: 'recorded' | 'duplicate' | 'ignored'
}> {
  const cookieStore = await cookies()

  const visitorId = cookieStore.get(COOKIE.visitor)?.value
  const savedVariant = cookieStore.get(COOKIE.variant)?.value

  if (!visitorId || !isVariant(savedVariant)) {
    return { status: 'ignored' }
  }

  const variant = assignVariant(visitorId)

  if (variant !== savedVariant) {
    return { status: 'ignored' }
  }

  const recorded = await recordConversionEvent(visitorId, variant)

  return {
    status: recorded ? 'recorded' : 'duplicate',
  }
}
