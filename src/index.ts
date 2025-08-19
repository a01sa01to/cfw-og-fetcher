import * as v from 'valibot'
import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { vValidator } from '@hono/valibot-validator'

interface IResponse {
  error: boolean
  message?: string
  data?: {
    title: string
    description?: string
    image?: string
    favicon?: string
  }
}

const MAX_AGE = 3600
const CACHE_CONTROL = `public, max-age=${MAX_AGE.toString()}, s-maxage=${MAX_AGE.toString()}`

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
  .use(async (c, next) => {
    // キャッシュを適用させて、あれば取ってくる、なければ保存する
    const cachedResponse = await caches.default.match(c.req.raw)
    if (cachedResponse) return cachedResponse
    await next()
    if (c.res.ok) {
      const response = c.res.clone()
      c.executionCtx.waitUntil(caches.default.put(c.req.raw, response))
    }
  })
  .get(
    '/',
    vValidator(
      'query',
      v.pipe(
        v.object({
          q: v.pipe(v.string(), v.nonEmpty()),
        }),
        v.check(({ q }) => {
          try {
            const url = new URL(q)
            return url.protocol === 'http:' || url.protocol === 'https:'
          } catch {
            return false
          }
        })
      ),
      (res, c) => {
        if (!res.success)
          return c.json(
            {
              error: true,
              message: 'Bad Request',
            } satisfies IResponse,
            400
          )
      }
    ),
    c => {
      const { q } = c.req.valid('query')
      // const url = new URL(q)

      const resJson: IResponse = {
        data: {
          title: q,
        },
        error: false,
      }

      c.header('Cache-Control', CACHE_CONTROL)
      return c.json(resJson, 200)
    }
  )

export default app satisfies ExportedHandler<Env>
