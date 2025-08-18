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

const CORS_HEADERS = {
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Origin': '*',
}

const makeResponse = (status: number, response: IResponse): Response => {
  const headers = new Headers(CORS_HEADERS)
  headers.set('Cache-Control', 'public, max-age=3600, s-maxage=3600')

  return new Response(JSON.stringify(response), {
    headers,
    status,
  })
}

export default {
  async fetch(request, env, ctx): Promise<Response> {
    if (request.method === 'OPTIONS')
      return new Response(null, {
        headers: CORS_HEADERS,
        status: 204,
      })

    const url = new URL(request.url)
    const requestTo = url.searchParams.get('q')

    if (!requestTo || !URL.canParse(requestTo))
      return makeResponse(400, {
        error: true,
        message: 'Bad Request',
      })

    const page = new URL(requestTo)

    const cachedResponse = await env.OG_CACHE.get<IResponse>(
      page.toString(),
      'json'
    )
    if (cachedResponse) return makeResponse(200, cachedResponse)

    const resJson = {} as IResponse
    ctx.waitUntil(
      env.OG_CACHE.put(page.toString(), JSON.stringify(resJson), {
        expirationTtl: 3600,
      })
    )

    return makeResponse(200, resJson)
  },
} satisfies ExportedHandler<Env>
