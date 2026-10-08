import { existsSync, readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { join } from 'node:path'
import { container, text, image, type Node } from '@takumi-rs/helpers'
import type { Context } from 'koishi'
import { h } from 'koishi'
import type { Config } from '../config'
import type { WeeklyDetail, SongItem } from '../types'
import { ensureLxgwFont } from '../utils/font'

const nodeRequire = createRequire(
  typeof __filename === 'string' ? __filename : join(process.cwd(), 'index.js')
)
const takumiModule: typeof import('@takumi-rs/wasm/node') = nodeRequire('@takumi-rs/wasm/node')

const WIDTH = 920

// B 站经典粉蓝配色看板调色盘
const palette = {
  biliBlue: '#00AEEC',
  biliPink: '#FB7299',
  biliPinkLight: '#FFF0F5',
  biliBlueLight: '#E8F7FD',
  gold: '#E5A93C',
  silver: '#8A9BA8',
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

export async function renderWeeklyTakumi(
  ctx: Context,
  config: Config,
  detail: WeeklyDetail,
  limit: number,
  showCover: boolean
) {
  const logger = ctx.logger('billboard')
  const fontBuffer = await loadFontBuffer(ctx, config)
  const renderer = new takumiModule.Renderer(fontBuffer ? { fonts: [fontBuffer] } : {})

  const items = detail.items.slice(0, Math.min(limit, detail.items.length))
  let top1CoverBuffer: Uint8Array | null = null

  if (showCover && items.length > 0 && items[0].pic_url) {
    top1CoverBuffer = await fetchImageBuffer(ctx, items[0].pic_url)
  }

  const rootChildren: Node[] = []

  // 1. 顶部 Header (B站粉蓝标题条)
  rootChildren.push(
    container({
      style: {
        backgroundColor: palette.cardBg,
        borderRadius: 16,
        padding: 24,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: palette.border,
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
            marginBottom: 8,
          },
          children: [
            text('🎵 Bili Board 术力口周榜', {
              fontSize: 28,
              fontWeight: 700,
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
                  fontSize: 16,
                  fontWeight: 700,
                  color: '#FFFFFF',
                }),
              ],
            }),
          ],
        }),
        container({
          style: {
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'center',
          },
          children: [
            text(`📅 发布日期: ${detail.date || '近期'} · 第 ${detail.week || ''} 周`, {
              fontSize: 14,
              color: palette.textSub,
            }),
          ],
        }),
      ],
    })
  )

  // 2. TOP 1 大卡片特写
  if (items.length > 0) {
    const top1 = items[0]
    const top1Inner: Node[] = []

    // 头部信息
    top1Inner.push(
      container({
        style: {
          display: 'flex',
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 12,
        },
        children: [
          container({
            style: {
              backgroundColor: palette.gold,
              borderRadius: 8,
              padding: '4px 10px',
            },
            children: [
              text('🥇 TOP 1 冠军曲目', {
                fontSize: 15,
                fontWeight: 700,
                color: '#FFFFFF',
              }),
            ],
          }),
          text(top1.bvid ? `BV: ${top1.bvid}` : '', {
            fontSize: 14,
            fontWeight: 600,
            color: palette.biliBlue,
          }),
        ],
      })
    )

    top1Inner.push(
      text(top1.title, {
        fontSize: 24,
        fontWeight: 700,
        color: palette.textMain,
        marginBottom: top1CoverBuffer ? 14 : 4,
      })
    )

    // 如果下载到了第一名海报封面，展示高清封面
    if (top1CoverBuffer) {
      top1Inner.push(
        image({
          src: top1CoverBuffer,
          width: 872,
          height: 380,
          style: {
            width: 872,
            height: 380,
            borderRadius: 12,
            objectFit: 'cover',
          },
        })
      )
    }

    rootChildren.push(
      container({
        style: {
          backgroundColor: palette.cardBg,
          borderRadius: 16,
          padding: 20,
          marginBottom: 16,
          borderWidth: 2,
          borderColor: '#FCE7C8',
        },
        children: top1Inner,
      })
    )
  }

  // 3. TOP 2 ~ N 排行榜单项
  const listItems: Node[] = []
  for (let i = 1; i < items.length; i++) {
    const item = items[i]
    let badgeColor = palette.biliBlueLight
    let badgeTextColor = palette.biliBlue
    let rankText = `【TOP ${item.rank}】`

    if (item.rank === 2) {
      badgeColor = '#EEF2F6'
      badgeTextColor = palette.silver
      rankText = '🥈 TOP 2'
    } else if (item.rank === 3) {
      badgeColor = '#FDF0E9'
      badgeTextColor = palette.bronze
      rankText = '🥉 TOP 3'
    }

    listItems.push(
      container({
        style: {
          backgroundColor: palette.cardBg,
          borderRadius: 10,
          padding: '12px 16px',
          marginBottom: 8,
          borderWidth: 1,
          borderColor: palette.border,
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
            children: [
              container({
                style: {
                  backgroundColor: badgeColor,
                  borderRadius: 6,
                  padding: '4px 8px',
                  marginRight: 12,
                },
                children: [
                  text(rankText, {
                    fontSize: 13,
                    fontWeight: 700,
                    color: badgeTextColor,
                  }),
                ],
              }),
              text(item.title, {
                fontSize: 16,
                fontWeight: 600,
                color: palette.textMain,
              }),
            ],
          }),
          text(item.bvid || '', {
            fontSize: 13,
            color: palette.biliBlue,
            fontWeight: 500,
          }),
        ],
      })
    )
  }

  if (listItems.length > 0) {
    rootChildren.push(
      container({
        style: {
          display: 'flex',
          flexDirection: 'column',
          marginBottom: 12,
        },
        children: listItems,
      })
    )
  }

  // 4. 底栏 Footer
  rootChildren.push(
    container({
      style: {
        display: 'flex',
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '8px 12px 0 12px',
      },
      children: [
        text('💡 数据来源于 Bilibili @Bili Board Atel 周榜公开专栏', {
          fontSize: 12,
          color: palette.textMuted,
        }),
        text('Generated by Koishi Takumi-rs', {
          fontSize: 12,
          color: palette.textMuted,
        }),
      ],
    })
  )

  // 根节点
  const root = container({
    style: {
      width: WIDTH,
      backgroundColor: palette.bg,
      padding: 24,
      display: 'flex',
      flexDirection: 'column',
    },
    children: rootChildren,
  })

  const imageBuffer = await renderer.render(root, { width: WIDTH, format: 'png' })
  return h.image(imageBuffer, 'image/png')
}
