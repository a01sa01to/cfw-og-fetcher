import { FileTypeParser } from 'file-type'
import { detectXml } from '@file-type/xml'
import imageSize from 'image-size'
import { optimizeImage } from 'wasm-image-optimization'

import { CACHE_CONTROL, USER_AGENT } from './constant'
import { factory } from './factory'
import { validator } from './middleware'

const fileTypeParser = new FileTypeParser({ customDetectors: [detectXml] })

export const imgHandler = ({
  fallbackUrl,
  outputWidth,
  outputHeight,
}: {
  fallbackUrl: string
  outputWidth: number
  outputHeight: number
}) =>
  factory.createHandlers(validator, async c => {
    const { url } = c.req.valid('query')

    const response = await fetch(url, {
      headers: {
        'User-Agent': USER_AGENT,
      },
    }).catch(() => null)

    if (!response) return c.redirect(fallbackUrl, 302)
    if (!response.ok) return c.redirect(fallbackUrl, 302)

    const buffer = await response.arrayBuffer()
    const fileType = await fileTypeParser.fromBuffer(buffer)
    if (!fileType) return c.redirect(fallbackUrl, 302)
    if (!fileType.mime.startsWith('image/')) return c.redirect(fallbackUrl, 302)

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

    const dimension = imageSize(new Uint8Array(buffer))

    // 短辺に合わせる
    const heightTmp = Math.ceil(
      (outputWidth / dimension.width) * dimension.height
    )
    const widthTmp = Math.ceil(
      (outputHeight / dimension.height) * dimension.width
    )
    const height2 = Math.max(heightTmp, outputHeight)
    const width2 = Math.max(widthTmp, outputWidth)

    // 拡大はしない (svg は viewBox が返されるらしいので例外)
    const height =
      fileType.ext === 'svg' ? height2 : Math.min(dimension.height, height2)
    const width =
      fileType.ext === 'svg' ? width2 : Math.min(dimension.width, width2)

    const img = await optimizeImage({
      format: 'webp',
      height,
      image: buffer,
      quality: 75,
      width,
    })

    if (!img) return c.redirect(fallbackUrl, 302)

    c.header('Content-Type', 'image/webp')
    return c.body(img, 200)
  })
