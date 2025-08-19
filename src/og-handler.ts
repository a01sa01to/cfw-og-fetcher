import { CACHE_CONTROL, type IResponse, USER_AGENT } from './constant'
import { factory } from './factory'
import { unescapeHtml } from './util'
import { validator } from './middleware'

export const ogHandler = factory.createHandlers(validator, async c => {
  const { q, url } = c.req.valid('query')

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
    resJson.data.favicon = new URL(resJson.data.favicon, url.origin).toString()

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
