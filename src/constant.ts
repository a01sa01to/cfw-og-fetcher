export interface IResponse {
  error: boolean
  message?: string
  data?: {
    title: string
    description?: string
    image?: string
    favicon?: string
  }
}

export const MAX_AGE = 3600

export const CACHE_CONTROL = `public, max-age=${MAX_AGE.toString()}, s-maxage=${MAX_AGE.toString()}`

export const CACHE_CONTROL_IMMUTABLE =
  'public, max-age=31536000, s-maxage=31536000, immutable'

export const USER_AGENT =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:142.0) Gecko/20100101 Firefox/142.0'
