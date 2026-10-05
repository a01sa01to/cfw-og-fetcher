import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { logger } from 'hono/logger'

import { CACHE_CONTROL_IMMUTABLE, MAX_AGE } from './constant'
import {
  generateNotFoundFaviconImage,
  generateNotFoundImage,
} from './not-found'
import { cache } from './middleware'
import { imgHandler } from './img-handler'
import { ogHandler } from './og-handler'

const app = new Hono<{ Bindings: Env }>()

app
  .use(
    cors({
      allowHeaders: ['Content-Type'],
      allowMethods: ['GET', 'OPTIONS'],
      maxAge: MAX_AGE,
      origin: '*',
    })
  )
  .options('*', c => {
    return c.body(null, 204)
  })
  .use(logger())
  .use(cache)
  .get('/og', ...ogHandler)
  // Twitter, Facebook などは 1200x628 なので ÷4 して 300x157 にする
  .get(
    '/img',
    ...imgHandler({ fallbackUrl: '/nf', outputHeight: 157, outputWidth: 300 })
  )
  .get(
    '/fav',
    ...imgHandler({ fallbackUrl: '/nff', outputHeight: 32, outputWidth: 32 })
  )
  // not found
  .get('/nf', async c => {
    const img = await generateNotFoundImage()
    c.header('Cache-Control', CACHE_CONTROL_IMMUTABLE)
    c.header('Content-Type', 'image/svg+xml')
    return c.body(img, 200)
  })
  // not found favicon
  .get('/nff', async c => {
    const img = await generateNotFoundFaviconImage()
    c.header('Cache-Control', CACHE_CONTROL_IMMUTABLE)
    c.header('Content-Type', 'image/svg+xml')
    return c.body(img, 200)
  })
  .get('/token', c => {
    const rand = crypto.getRandomValues(new Uint8Array(128))
    const token = Array.from(rand, byte =>
      byte.toString(16).padStart(2, '0')
    ).join('')
    c.header('Cache-Control', 'no-store')
    c.header('Pragma', 'no-cache')
    c.header('Expires', '0')
    return c.text(token)
  })

export default app satisfies ExportedHandler<Env>
