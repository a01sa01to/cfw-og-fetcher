import * as cheerio from 'cheerio'
import * as v from 'valibot'
import { FileTypeParser } from 'file-type'
import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { detectXml } from '@file-type/xml'
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
const USER_AGENT =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:142.0) Gecko/20100101 Firefox/142.0'

const unescapeHtml = (str: string) => {
  const $ = cheerio.load(str)
  return $('body').text()
}

const validator = vValidator(
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
)

const fileTypeParser = new FileTypeParser({ customDetectors: [detectXml] })

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
    // if (c.res.ok) {
    //   const response = c.res.clone()
    //   c.executionCtx.waitUntil(caches.default.put(c.req.raw, response))
    // }
  })
  .get('/og', validator, async c => {
    const { q } = c.req.valid('query')
    const url = new URL(q)

    const response = await fetch(url, {
      headers: {
        'User-Agent': USER_AGENT,
      },
    }).catch(() => null)

    if (!response)
      return c.json(
        {
          error: true,
          message: `Failed to fetch the URL`,
        } satisfies IResponse,
        500
      )

    if (!response.ok)
      return c.json(
        {
          error: true,
          message: `Server Responded with ${response.status.toString()} ${response.statusText}`,
        } satisfies IResponse,
        404
      )

    const resJson: IResponse & { data: NonNullable<IResponse['data']> } = {
      data: {
        title: q,
      },
      error: false,
    }

    const res = new HTMLRewriter()
      .on('title', {
        text(t) {
          if (resJson.data.title === q) resJson.data.title = t.text || q
        },
      })
      .on('meta', {
        element(el) {
          const property = el.getAttribute('property')
          const name = el.getAttribute('name')
          const content = el.getAttribute('content')
          switch (property) {
            case 'og:title':
              if (resJson.data.title === q) resJson.data.title = content ?? q
              break
            case 'og:description':
              resJson.data.description ??= content ?? undefined
              break
            case 'og:image':
              resJson.data.image ??= content ?? undefined
              break
          }
          switch (name) {
            case 'title':
              if (resJson.data.title === q) resJson.data.title = content ?? q
              break
            case 'description':
              resJson.data.description ??= content ?? undefined
              break
            case 'image':
              resJson.data.image ??= content ?? undefined
              break
          }
        },
      })
      .on('link', {
        element(el) {
          const rel = el.getAttribute('rel')
          const href = el.getAttribute('href')
          if (rel === 'icon' || rel === 'shortcut icon')
            resJson.data.favicon ??= href ?? undefined
        },
      })
      .transform(response)

    await res.text()

    if (resJson.data.image?.startsWith('/'))
      resJson.data.image = new URL(resJson.data.image, url.origin).toString()
    if (resJson.data.favicon?.startsWith('/'))
      resJson.data.favicon = new URL(
        resJson.data.favicon,
        url.origin
      ).toString()

    resJson.data.title = unescapeHtml(resJson.data.title)
    resJson.data.description = resJson.data.description
      ? unescapeHtml(resJson.data.description)
      : undefined
    resJson.data.image = resJson.data.image
      ? unescapeHtml(resJson.data.image)
      : undefined
    resJson.data.favicon = resJson.data.favicon
      ? unescapeHtml(resJson.data.favicon)
      : undefined

    c.header('Cache-Control', CACHE_CONTROL)
    return c.json(resJson, 200)
  })
  .get('/img', validator, async c => {
    const { q } = c.req.valid('query')
    const url = new URL(q)

    const response = await fetch(url, {
      headers: {
        'User-Agent': USER_AGENT,
      },
    }).catch(() => null)

    if (!response) return c.redirect('/nf', 302)
    if (!response.ok) return c.redirect('/nf', 302)

    const buffer = await response.arrayBuffer()
    const fileType = await fileTypeParser.fromBuffer(buffer)
    if (!fileType) return c.redirect('/nf', 302)
    if (!fileType.mime.startsWith('image/')) return c.redirect('/nf', 302)

    c.header('Cache-Control', CACHE_CONTROL)

    // svg, jpeg, png, webp, avif のみ対応
    // それ以外はそのままストリームで返す
    if (
      ![
        'image/svg+xml',
        'image/jpeg',
        'image/png',
        'image/webp',
        'image/avif',
      ].includes(fileType.mime)
    ) {
      c.header('Content-Type', fileType.mime)
      return c.body(buffer, 200)
    }

    c.header('Content-Type', 'image/webp')
    return c.json(fileType)
  })
  .get('/fav', validator, async c => {
    const { q } = c.req.valid('query')
    const url = new URL(q)

    const response = await fetch(url, {
      headers: {
        'User-Agent': USER_AGENT,
      },
    }).catch(() => null)

    if (!response) return c.redirect('/nff', 302)
    if (!response.ok) return c.redirect('/nff', 302)

    const buffer = await response.arrayBuffer()
    const fileType = await fileTypeParser.fromBuffer(buffer)
    if (!fileType) return c.redirect('/nf', 302)
    if (!fileType.mime.startsWith('image/')) return c.redirect('/nf', 302)

    c.header('Cache-Control', CACHE_CONTROL)

    // svg, jpeg, png, webp, avif のみ対応
    // それ以外はそのままストリームで返す
    if (
      ![
        'image/svg+xml',
        'image/jpeg',
        'image/png',
        'image/webp',
        'image/avif',
      ].includes(fileType.mime)
    ) {
      c.header('Content-Type', fileType.mime)
      return c.body(buffer, 200)
    }

    c.header('Content-Type', 'image/webp')
    return c.json(fileType, 200)
  })
  // not found
  .get('/nf', c => {
    return c.text('Not Found', 404)
  })
  // not found favicon
  .get('/nff', c => {
    return c.text('Not Found', 404)
  })

export default app satisfies ExportedHandler<Env>
