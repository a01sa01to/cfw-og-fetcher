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
  const svg = await satori(
    <div
      style={{
        alignItems: 'center',
        color: 'black',
        display: 'flex',
        height: '32px',
        justifyContent: 'center',
        width: '32px',
      }}
    >
      {/* MdOutlineImageNotSupported: TypeError: Cannot destructure property 'children' of 'h2' as it is undefined. が出てしまうので埋め込み */}
      <svg
        xmlns='http://www.w3.org/2000/svg'
        viewBox='0 0 24 24'
        stroke='currentColor'
        fill='currentColor'
        strokeWidth='0'
      >
        <path fill='none' d='M0 0h24v24H0z' />
        <path d='m21.9 21.9-6.1-6.1-2.69-2.69L5 5 3.59 3.59 2.1 2.1.69 3.51 3 5.83V19c0 1.1.9 2 2 2h13.17l2.31 2.31 1.42-1.41zM5 19V7.83l6.84 6.84-.84 1.05L9 13l-3 4h8.17l2 2H5zM7.83 5l-2-2H19c1.1 0 2 .9 2 2v13.17l-2-2V5H7.83z' />
      </svg>
    </div>,
    {
      fonts: [
        {
          data: base64ToArraybuffer(notoSans),
          name: 'Noto Sans',
          style: 'normal',
        },
      ],
      height: 32,
      width: 32,
    }
  )

  return svg
}
