
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import {
  assignVariant,
  cookieOptions,
  COOKIE,
  isVariant,
  SESSION_WINDOW,
  THIRTY_DAYS,
} from './lib/experiment'
import { recordImpression } from './lib/db'

const CRAWLER_PATTERN =
  /googlebot|bingbot|duckduckbot|baiduspider|yandexbot|applebot|slurp/i

export async function proxy(request: NextRequest) {
  const preview = request.nextUrl.searchParams.get('preview')

  // Las vistas preview no participan del experimento.
  if (isVariant(preview)) {
    return NextResponse.next()
  }

  const userAgent = request.headers.get('user-agent') ?? ''

  // Los crawlers reciben siempre A y no generan eventos.
  if (CRAWLER_PATTERN.test(userAgent)) {
    const headers = new Headers(request.headers)
    headers.set('x-lab-variant', 'a')

    return NextResponse.next({
      request: { headers },
    })
  }

  const existingVisitor = request.cookies.get(COOKIE.visitor)?.value
  const visitorId = existingVisitor || crypto.randomUUID()
  const variant = assignVariant(visitorId)

  const headers = new Headers(request.headers)
  headers.set('x-lab-variant', variant)

  const response = NextResponse.next({
    request: { headers },
  })

  const secure = request.nextUrl.protocol === 'https:'
  const options = cookieOptions(secure, THIRTY_DAYS)

  if (!existingVisitor) {
    response.cookies.set(COOKIE.visitor, visitorId, options)
  }

  const savedVariant = request.cookies.get(COOKIE.variant)?.value

  if (savedVariant !== variant) {
    response.cookies.set(COOKIE.variant, variant, options)
  }

  // La cookie de sesión evita repetir el registro.
  const impressed = request.cookies.get(COOKIE.impressed)?.value

  if (impressed !== visitorId) {
    await recordImpression(visitorId, variant)

    response.cookies.set(
      COOKIE.impressed,
      visitorId,
      cookieOptions(secure, SESSION_WINDOW)
    )
  }

  return response
}

export const config = {
  matcher: ['/practica'],
}
