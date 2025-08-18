interface IResponse {
  error: boolean;
  message?: string;
  data?: {
    title?: string;
    description?: string;
    image?: string;
    favicon?: string;
  }
}

const makeResponse = (status: number, response: IResponse): Response => {
  return new Response(JSON.stringify(response), {
    headers: {
      'Content-Type': 'application/json',
    },
    status,
  })
}

export default {
  async fetch(request, env, ctx): Promise<Response> {
    const url = new URL(request.url)
    const requestTo = url.searchParams.get('q')

    if (!requestTo || !URL.canParse(requestTo)) {
      return makeResponse(400, {
        error: true,
        message: "Bad Request"
      })
    }

    return new Response('Hello World!')
  },
} satisfies ExportedHandler<Env>
