import * as cheerio from 'cheerio'

export const unescapeHtml = (str: string) => {
  const $ = cheerio.load(str)
  return $('body').text()
}
