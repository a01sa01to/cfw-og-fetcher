import { optimizeImage } from 'wasm-image-optimization'
import satori from 'satori'

import notoSans from './_NotoSans-400'

const base64ToArraybuffer = (base64: string): ArrayBuffer => {
  return new Uint8Array(Buffer.from(base64, 'base64')).buffer
}

export const generateNotFoundImage = async () => {
  const svg = await satori(<div style={{ color: 'black' }}>hello, world</div>, {
    fonts: [
      {
        data: base64ToArraybuffer(notoSans),
        name: 'Noto Sans',
        style: 'normal',
      },
    ],
    height: 157,
    width: 300,
  })

  const img = await optimizeImage({
    format: 'webp',
    height: 157,
    image: Buffer.from(svg),
    quality: 75,
    width: 300,
  })

  return img ?? svg
}

export const generateNotFoundFaviconImage = async () => {
  const svg = await satori(<div style={{ color: 'black' }}>hello, world</div>, {
    fonts: [
      {
        data: base64ToArraybuffer(notoSans),
        name: 'Noto Sans',
        style: 'normal',
      },
    ],
    height: 32,
    width: 32,
  })

  const img = await optimizeImage({
    format: 'webp',
    height: 32,
    image: Buffer.from(svg),
    quality: 75,
    width: 32,
  })

  return img ?? svg
}
