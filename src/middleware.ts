import * as v from 'valibot'

import type { IResponse } from './constant'
import { factory } from './factory'

export const cache = factory.createMiddleware(async (c, next) => {
  // キャッシュを適用させて、あれば取ってくる、なければ保存する
  const cachedResponse = await caches.default.match(c.req.raw)
  if (cachedResponse) return cachedResponse
  await next()
  // if (c.res.ok) {
  //   const response = c.res.clone()
  //   c.executionCtx.waitUntil(caches.default.put(c.req.raw, response))
  // }
})

export const validator = factory.createMiddleware<{
  out: { query: { url: URL; q: string } }
}>(async (c, next) => {
  try {
    const { q, t } = c.req.query()

    // q チェック
    const urlStr = v.parse(
      v.pipe(
        v.string(),
        v.nonEmpty(),
        v.check(q => {
          // URL の形式チェック
          try {
            const url = new URL(q)
            return url.protocol === 'http:' || url.protocol === 'https:'
          } catch {
            return false
          }
        })
      ),
      q
    )
    const url = new URL(urlStr)

    // t チェック
    const token = v.parse(v.pipe(v.string(), v.nonEmpty()), t)
    const savedToken = await c.env.SECRET.get()
    if (token !== savedToken) throw new Error('Invalid token')

    c.req.addValidatedData('query', { q: urlStr, url })

    await next()
  } catch {
    return c.json(
      {
        error: true,
        message: 'Invalid query parameters',
      } satisfies IResponse,
      400
    )
  }
})
