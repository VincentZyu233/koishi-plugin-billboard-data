import { existsSync, readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { join } from 'node:path'
import { container, text, image, type Node } from '@takumi-rs/helpers'
import type { Context } from 'koishi'
import { h } from 'koishi'
import type { Config } from '../config'
import type { WeeklyDetail } from '../types'
import { ensureLxgwFont } from '../utils/font'

const nodeRequire = createRequire(
  typeof __filename === 'string' ? __filename : join(process.cwd(), 'index.js')
)
const takumiModule: typeof import('@takumi-rs/wasm/node') = nodeRequire('@takumi-rs/wasm/node')

const WIDTH = 920
const PADDING = 24
const CONTENT_WIDTH = WIDTH - PADDING * 2 // 872
const CARD_PADDING = 20
const INNER_WIDTH = CONTENT_WIDTH - CARD_PADDING * 2 // 832

// B 站经典粉蓝配色看板调色盘
const palette = {
  biliBlue: '#00AEEC',
  biliPink: '#FB7299',
  biliPinkLight: '#FFF0F5',
  biliBlueLight: '#E8F7FD',
  gold: '#E5A93C',
  silver: '#7A8B99',
  bronze: '#C27C51',
  bg: '#F4F5F7',
  cardBg: '#FFFFFF',
  textMain: '#18191C',
  textSub: '#61666D',
  textMuted: '#9499A0',
  border: '#E3E5E7',
}

async function loadFontBuffer(ctx: Context, config: Config): Promise<Uint8Array | null> {
  const logger = ctx.logger('billboard')
  if (config.takumiFontMode === 'none') {
    return null
  }

  if (config.takumiFontMode === 'custom' && config.takumiCustomFontPath?.trim()) {
    const customPath = config.takumiCustomFontPath.trim()
    if (existsSync(customPath)) {
      try {
        return readFileSync(customPath)
      } catch (err: any) {
        logger.warn(`⚠️ 加载自定义字体失败 (${customPath}): ${err.message || err}`)
      }
    } else {
      logger.warn(`⚠️ 自定义字体文件不存在: ${customPath}`)
    }
  }

  // 默认 release 模式
  try {
    const fontPath = await ensureLxgwFont(ctx)
    if (existsSync(fontPath)) {
      return readFileSync(fontPath)
    }
  } catch (err: any) {
    logger.warn(`⚠️ 获取 LXGW 字体失败: ${err.message || err}`)
  }

  return null
}

async function fetchImageBuffer(ctx: Context, url?: string): Promise<Uint8Array | null> {
  if (!url) return null
  try {
    const res = await ctx.http.get(url, { responseType: 'arraybuffer', timeout: 10000 })
    return new Uint8Array(res)
  } catch {
    return null
  }
}

function calculateCoverHeight(buffer: Uint8Array): number {
  try {
    const imageSize = nodeRequire('image-size')
    const dim = imageSize(buffer)
    if (dim && dim.width && dim.height) {
      return Math.min(460, Math.round((INNER_WIDTH * dim.height) / dim.width))
    }
  } catch {}
  return 380
}

export async function renderWeeklyTakumi(
  ctx: Context,
  config: Config,
  detail: WeeklyDetail,
  limit: number,
  showCover: boolean
) {
  const fontBuffer = await loadFontBuffer(ctx, config)
  const renderer = new takumiModule.Renderer(fontBuffer ? { fonts: [fontBuffer] } : {})

  const items = detail.items.slice(0, Math.min(limit, detail.items.length))

  // 并发加载需要的封面图
  const coverPromises = items.map(async (item, index) => {
    if (!showCover || !item.pic_url) return null
    if (index === 0) {
      return await fetchImageBuffer(ctx, item.pic_url)
    }
    if (config.takumiShowAllCovers) {
      return await fetchImageBuffer(ctx, item.pic_url)
    }
    return null
  })

  const itemCovers = await Promise.all(coverPromises)
  const top1CoverBuffer = itemCovers[0] || null

  const rootChildren: Node[] = []

  // 1. 顶部 Header (调细字重与精致边距)
  rootChildren.push(
    container({
      style: {
        width: CONTENT_WIDTH,
        backgroundColor: palette.cardBg,
        borderRadius: 16,
        padding: '18px 24px',
        marginBottom: 14,
        border: `1px solid ${palette.border}`,
        display: 'flex',
        flexDirection: 'column',
      },
      children: [
        container({
          style: {
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 6,
          },
          children: [
            text('Bili Board 术力口周榜', {
              fontSize: 26,
              fontWeight: 600,
              color: palette.biliBlue,
            }),
            container({
              style: {
                backgroundColor: palette.biliPink,
                padding: '4px 12px',
                borderRadius: 12,
              },
              children: [
                text(`第 ${detail.issue} 期`, {
                  fontSize: 15,
                  fontWeight: 600,
                  color: '#FFFFFF',
                }),
              ],
            }),
          ],
        }),
        text(`发布日期: ${detail.date || '近期'} · 第 ${detail.week || ''} 周`, {
          fontSize: 14,
          color: palette.textSub,
          fontWeight: 400,
        }),
      ],
    })
  )

  // 2. TOP 1 大卡片特写 (更细雅精致的字重)
  if (items.length > 0) {
    const top1 = items[0]
    const top1Inner: Node[] = []

    top1Inner.push(
      container({
        style: {
          display: 'flex',
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 10,
        },
        children: [
          container({
            style: {
              backgroundColor: palette.gold,
              borderRadius: 8,
              padding: '4px 10px',
            },
            children: [
              text('TOP 1 冠军', {
                fontSize: 14,
                fontWeight: 600,
                color: '#FFFFFF',
              }),
            ],
          }),
          text(top1.bvid ? `BV: ${top1.bvid}` : '', {
            fontSize: 14,
            fontWeight: 500,
            color: palette.biliBlue,
          }),
        ],
      })
    )

    top1Inner.push(
      text(top1.title, {
        fontSize: 22,
        fontWeight: 600,
        color: palette.textMain,
        marginBottom: top1CoverBuffer ? 12 : 4,
      })
    )

    if (top1CoverBuffer) {
      const coverHeight = calculateCoverHeight(top1CoverBuffer)
      top1Inner.push(
        container({
          style: {
            width: INNER_WIDTH,
            height: coverHeight,
            borderRadius: 12,
            overflow: 'hidden',
            display: 'flex',
          },
          children: [
            image({
              src: top1CoverBuffer,
              width: INNER_WIDTH,
              height: coverHeight,
              style: {
                width: INNER_WIDTH,
                height: coverHeight,
                borderRadius: 12,
                objectFit: 'cover',
              },
            }),
          ],
        })
      )
    }

    rootChildren.push(
      container({
        style: {
          width: CONTENT_WIDTH,
          backgroundColor: palette.cardBg,
          borderRadius: 16,
          padding: CARD_PADDING,
          marginBottom: 14,
          border: '2px solid #FCE7C8',
          display: 'flex',
          flexDirection: 'column',
        },
        children: top1Inner,
      })
    )
  }

  // 3. TOP 2 ~ N 排行榜单项 (支持全曲目微缩封面图 & 细体字排版)
  for (let i = 1; i < items.length; i++) {
    const item = items[i]
    const coverBuf = itemCovers[i]
    let badgeColor = palette.biliBlueLight
    let badgeTextColor = palette.biliBlue
    let rankText = `TOP ${item.rank}`

    if (item.rank === 2) {
      badgeColor = '#EEF2F6'
      badgeTextColor = palette.silver
      rankText = 'TOP 2'
    } else if (item.rank === 3) {
      badgeColor = '#FDF0E9'
      badgeTextColor = palette.bronze
      rankText = 'TOP 3'
    }

    const leftGroupChildren: Node[] = [
      container({
        style: {
          backgroundColor: badgeColor,
          borderRadius: 6,
          padding: '4px 8px',
          marginRight: 10,
        },
        children: [
          text(rankText, {
            fontSize: 13,
            fontWeight: 600,
            color: badgeTextColor,
          }),
        ],
      }),
    ]

    // 如果开启每首歌曲展示封面且成功加载封面图片
    if (coverBuf) {
      leftGroupChildren.push(
        container({
          style: {
            width: 64,
            height: 38,
            borderRadius: 6,
            overflow: 'hidden',
            marginRight: 12,
            display: 'flex',
          },
          children: [
            image({
              src: coverBuf,
              width: 64,
              height: 38,
              style: {
                width: 64,
                height: 38,
                borderRadius: 6,
                objectFit: 'cover',
              },
            }),
          ],
        })
      )
    }

    leftGroupChildren.push(
      text(item.title, {
        fontSize: 15,
        fontWeight: 500,
        color: palette.textMain,
      })
    )

    rootChildren.push(
      container({
        style: {
          width: CONTENT_WIDTH,
          backgroundColor: palette.cardBg,
          borderRadius: 10,
          padding: '10px 16px',
          marginBottom: 8,
          border: `1px solid ${palette.border}`,
          display: 'flex',
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
        },
        children: [
          container({
            style: {
              display: 'flex',
              flexDirection: 'row',
              alignItems: 'center',
              flex: 1,
            },
            children: leftGroupChildren,
          }),
          text(item.bvid || '', {
            fontSize: 13,
            color: palette.biliBlue,
            fontWeight: 400,
          }),
        ],
      })
    )
  }

  // 4. 底栏 Footer
  rootChildren.push(
    container({
      style: {
        width: CONTENT_WIDTH,
        display: 'flex',
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '10px 4px 4px 4px',
      },
      children: [
        text('数据来源于 Bilibili @Bili Board Atel 周榜公开专栏', {
          fontSize: 12,
          color: palette.textMuted,
          fontWeight: 400,
        }),
        text('Generated by Koishi Takumi-rs', {
          fontSize: 12,
          color: palette.textMuted,
          fontWeight: 400,
        }),
      ],
    })
  )

  const root = container({
    style: {
      width: WIDTH,
      backgroundColor: palette.bg,
      padding: PADDING,
      display: 'flex',
      flexDirection: 'column',
    },
    children: rootChildren,
  })

  const imageBuffer = await renderer.render(root, { width: WIDTH, format: 'png' })
  return h.image(imageBuffer, 'image/png')
}
