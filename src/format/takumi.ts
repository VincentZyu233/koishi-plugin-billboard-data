import { existsSync, readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { join } from 'node:path'
import { container, text, image, type Node } from '@takumi-rs/helpers'
import type { Context } from 'koishi'
import { h } from 'koishi'
import type { Config } from '../config'
import { type WeeklyDetail, formatPublishTime, formatCount, formatDuration } from '../types'
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

function renderAvatarFallback(initial: string, size: number = 24): Node {
  return container({
    style: {
      width: size,
      height: size,
      borderRadius: Math.round(size / 2),
      backgroundColor: '#E3E5E7',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 8,
    },
    children: [
      text(initial || '?', {
        fontSize: Math.round(size * 0.55),
        fontWeight: 600,
        color: '#61666D',
      }),
    ],
  })
}

function renderAvatar(buffer: Uint8Array | null, initial: string, size: number = 24): Node {
  if (buffer) {
    return container({
      style: {
        width: size,
        height: size,
        borderRadius: Math.round(size / 2),
        overflow: 'hidden',
        marginRight: 8,
        display: 'flex',
      },
      children: [
        image({
          src: buffer,
          width: size,
          height: size,
          style: {
            width: size,
            height: size,
            borderRadius: Math.round(size / 2),
            objectFit: 'cover',
          },
        }),
      ],
    })
  }
  return renderAvatarFallback(initial, size)
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
  const showDetailed = config.takumiShowDetailedInfo ?? true

  // 并发加载封面图与上传者头像
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

  const avatarPromises = items.map(async (item) => {
    if (!showDetailed || !item.video_meta?.uploader?.face) return null
    return await fetchImageBuffer(ctx, item.video_meta.uploader.face)
  })

  const [itemCovers, itemAvatars] = await Promise.all([
    Promise.all(coverPromises),
    Promise.all(avatarPromises),
  ])

  const top1CoverBuffer = itemCovers[0] || null
  const rootChildren: Node[] = []

  // 1. 顶部 Header
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
        text(`发布时间: ${formatPublishTime(detail)} · 第 ${detail.week || ''} 周`, {
          fontSize: 13,
          fontWeight: 400,
          color: palette.textSub,
        }),
      ],
    })
  )

  // 2. TOP 1 冠军展示卡片
  if (items.length > 0) {
    const top1 = items[0]
    const top1Avatar = itemAvatars[0]
    const top1Inner: Node[] = []

    // 冠军胶囊 & BV
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

    // 歌名
    top1Inner.push(
      text(top1.title, {
        fontSize: 22,
        fontWeight: 600,
        color: palette.textMain,
        marginBottom: top1CoverBuffer ? 12 : 6,
      })
    )

    // 海报封面
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
            marginBottom: showDetailed && top1.video_meta ? 12 : 0,
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

    // TOP 1 详细信息行 (视频上传者与指标)
    if (showDetailed && top1.video_meta) {
      const meta = top1.video_meta
      const uploaderName = meta.uploader?.name || '未知'
      const initial = uploaderName.trim().charAt(0) || '?'
      const dur = formatDuration(meta.duration)
      const s = meta.stat || ({} as any)

      // 上传者与时长行
      top1Inner.push(
        container({
          style: {
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'center',
            marginBottom: 8,
          },
          children: [
            renderAvatar(top1Avatar, initial, 28),
            text(`视频上传者: ${uploaderName}`, {
              fontSize: 14,
              fontWeight: 500,
              color: palette.textMain,
              marginRight: 12,
            }),
            text(`时长: ${dur}`, {
              fontSize: 13,
              fontWeight: 400,
              color: palette.textMuted,
            }),
          ],
        })
      )

      // 6项指标行
      top1Inner.push(
        container({
          style: {
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: '#F9FAFB',
            borderRadius: 8,
            padding: '8px 14px',
            border: `1px solid ${palette.border}`,
          },
          children: [
            text(`播放 ${formatCount(s.view)}`, { fontSize: 13, color: palette.textSub, marginRight: 16 }),
            text(`弹幕 ${formatCount(s.danmaku)}`, { fontSize: 13, color: palette.textSub, marginRight: 16 }),
            text(`点赞 ${formatCount(s.like)}`, { fontSize: 13, color: palette.textSub, marginRight: 16 }),
            text(`投币 ${formatCount(s.coin)}`, { fontSize: 13, color: palette.textSub, marginRight: 16 }),
            text(`收藏 ${formatCount(s.favorite)}`, { fontSize: 13, color: palette.textSub, marginRight: 16 }),
            text(`分享 ${formatCount(s.share)}`, { fontSize: 13, color: palette.textSub }),
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

  // 3. TOP 2 ~ N 排行榜单项
  for (let i = 1; i < items.length; i++) {
    const item = items[i]
    const coverBuf = itemCovers[i]
    const avatarBuf = itemAvatars[i]
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

    if (showDetailed && item.video_meta) {
      const meta = item.video_meta
      const uploaderName = meta.uploader?.name || '未知'
      const initial = uploaderName.trim().charAt(0) || '?'
      const dur = formatDuration(meta.duration)
      const s = meta.stat || ({} as any)

      // 多行流式卡片模式
      const cardInner: Node[] = []

      // 行 1: 排名 + 歌曲标题 + BV
      const line1Children: Node[] = [
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
        text(item.title, {
          fontSize: 15,
          fontWeight: 600,
          color: palette.textMain,
        }),
      ]

      cardInner.push(
        container({
          style: {
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 8,
          },
          children: [
            container({
              style: {
                display: 'flex',
                flexDirection: 'row',
                alignItems: 'center',
                flex: 1,
              },
              children: line1Children,
            }),
            text(item.bvid || '', {
              fontSize: 13,
              color: palette.biliBlue,
              fontWeight: 400,
            }),
          ],
        })
      )

      // 行 2: 视频上传者 + 头像 + 时长
      const line2Children: Node[] = [
        renderAvatar(avatarBuf, initial, 22),
        text(`视频上传者: ${uploaderName}`, {
          fontSize: 13,
          fontWeight: 400,
          color: palette.textSub,
          marginRight: 12,
        }),
        text(`时长: ${dur}`, {
          fontSize: 12,
          fontWeight: 400,
          color: palette.textMuted,
        }),
      ]

      cardInner.push(
        container({
          style: {
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'center',
            marginBottom: 6,
          },
          children: line2Children,
        })
      )

      // 行 3: 播放/弹幕/点赞/投币/收藏/分享 6项指标
      cardInner.push(
        container({
          style: {
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'center',
            paddingTop: 4,
            borderTop: '1px dashed #F0F1F2',
          },
          children: [
            text(`播放 ${formatCount(s.view)}`, { fontSize: 12, color: palette.textMuted, marginRight: 14 }),
            text(`弹幕 ${formatCount(s.danmaku)}`, { fontSize: 12, color: palette.textMuted, marginRight: 14 }),
            text(`点赞 ${formatCount(s.like)}`, { fontSize: 12, color: palette.textMuted, marginRight: 14 }),
            text(`投币 ${formatCount(s.coin)}`, { fontSize: 12, color: palette.textMuted, marginRight: 14 }),
            text(`收藏 ${formatCount(s.favorite)}`, { fontSize: 12, color: palette.textMuted, marginRight: 14 }),
            text(`分享 ${formatCount(s.share)}`, { fontSize: 12, color: palette.textMuted }),
          ],
        })
      )

      // 如果有封面图，把封面放在卡片左侧或上层
      if (coverBuf) {
        rootChildren.push(
          container({
            style: {
              width: CONTENT_WIDTH,
              backgroundColor: palette.cardBg,
              borderRadius: 10,
              padding: '12px 16px',
              marginBottom: 8,
              border: `1px solid ${palette.border}`,
              display: 'flex',
              flexDirection: 'row',
              alignItems: 'center',
            },
            children: [
              container({
                style: {
                  width: 80,
                  height: 50,
                  borderRadius: 6,
                  overflow: 'hidden',
                  marginRight: 14,
                  display: 'flex',
                },
                children: [
                  image({
                    src: coverBuf,
                    width: 80,
                    height: 50,
                    style: {
                      width: 80,
                      height: 50,
                      borderRadius: 6,
                      objectFit: 'cover',
                    },
                  }),
                ],
              }),
              container({
                style: {
                  display: 'flex',
                  flexDirection: 'column',
                  flex: 1,
                },
                children: cardInner,
              }),
            ],
          })
        )
      } else {
        rootChildren.push(
          container({
            style: {
              width: CONTENT_WIDTH,
              backgroundColor: palette.cardBg,
              borderRadius: 10,
              padding: '12px 16px',
              marginBottom: 8,
              border: `1px solid ${palette.border}`,
              display: 'flex',
              flexDirection: 'column',
            },
            children: cardInner,
          })
        )
      }
    } else {
      // 传统单行模式
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
