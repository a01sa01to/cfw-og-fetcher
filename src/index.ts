import * as v from 'valibot'
import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { vValidator } from '@hono/valibot-validator'

interface IResponse {
  error: boolean
  message?: string
  data?: {
    title?: string
    description?: string
    image?: string
    favicon?: string
  }
}

const MAX_AGE = 3600

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
  .get(
    '/',
    vValidator(
      'query',
      v.pipe(
        v.object({
          q: v.pipe(v.string(), v.nonEmpty(), v.url()),
        }),
        v.check(({ q }) => {
          const url = new URL(q)
          return url.protocol === 'http:' || url.protocol === 'https:'
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
    async c => {
      const { q } = c.req.valid('query')
      const url = new URL(q)

      const cachedResponse = await c.env.OG_CACHE.get<IResponse>(
        url.toString(),
        'json'
      )
      if (cachedResponse) return c.json(cachedResponse, 200)

      const resJson = {} as IResponse
      c.executionCtx.waitUntil(
        c.env.OG_CACHE.put(url.toString(), JSON.stringify(resJson), {
          expirationTtl: 3600,
        })
      )
    }
  )

export default app satisfies ExportedHandler<Env>
