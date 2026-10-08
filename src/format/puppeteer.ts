import { existsSync, readFileSync } from 'node:fs'
import { pathToFileURL } from 'node:url'
import type { Context } from 'koishi'
import { h } from 'koishi'
import type { Config } from '../config'
import { type WeeklyDetail, formatPublishTime } from '../types'
import { ensureLxgwFont, getLxgwFontPath } from '../utils/font'

declare module 'koishi' {
  interface Context {
    puppeteer?: any
  }
}

async function resolveFontCss(ctx: Context, config: Config): Promise<string> {
  const mode = config.puppeteerFontMode || 'npm'

  if (mode === 'none') {
    return `body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "PingFang SC", "Microsoft YaHei", sans-serif; }`
  }

  if (mode === 'custom' && config.puppeteerCustomFontPath?.trim()) {
    const customPath = config.puppeteerCustomFontPath.trim()
    if (existsSync(customPath)) {
      const fileUrl = pathToFileURL(customPath).href
      return `
        @font-face {
          font-family: 'BillboardCustomFont';
          src: url('${fileUrl}');
        }
        body { font-family: 'BillboardCustomFont', sans-serif; }
      `
    }
  }

  if (mode === 'release') {
    try {
      const fontPath = await ensureLxgwFont(ctx)
      if (existsSync(fontPath)) {
        const fileUrl = pathToFileURL(fontPath).href
        return `
          @font-face {
            font-family: 'LXGWWenKaiMono';
            src: url('${fileUrl}');
          }
          body { font-family: 'LXGWWenKaiMono', sans-serif; }
        `
      }
    } catch {
      // 降级使用 npm 或系统字体
    }
  }

  // 默认 npm 模式：尝试解析 lxgw-wenkai-webfont 本地样式
  try {
    const cssPath = require.resolve('lxgw-wenkai-webfont/style.css')
    if (existsSync(cssPath)) {
      const fileUrl = pathToFileURL(cssPath).href
      return `
        @import url('${fileUrl}');
        body { font-family: "LXGW WenKai Mono", sans-serif; }
      `
    }
  } catch {
    // 若未能解析到 npm 路径，尝试从 release 下载
    try {
      const fontPath = await ensureLxgwFont(ctx)
      if (existsSync(fontPath)) {
        const fileUrl = pathToFileURL(fontPath).href
        return `
          @font-face {
            font-family: 'LXGWWenKaiMono';
            src: url('${fileUrl}');
          }
          body { font-family: 'LXGWWenKaiMono', sans-serif; }
        `
      }
    } catch {}
  }

  return `body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "PingFang SC", "Microsoft YaHei", sans-serif; }`
}

export async function renderWeeklyPuppeteer(
  ctx: Context,
  config: Config,
  detail: WeeklyDetail,
  limit: number,
  showCover: boolean
) {
  const logger = ctx.logger('billboard')
  if (!ctx.puppeteer) {
    logger.warn('⚠️ 未检测到已加载的 puppeteer 服务，跳过 Puppeteer 网页出图')
    return null
  }

  const items = detail.items.slice(0, Math.min(limit, detail.items.length))
  const fontCss = await resolveFontCss(ctx, config)

  const top1 = items[0]
  const otherItems = items.slice(1)

  const html = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <style>
    ${fontCss}

    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }

    body {
      width: 960px;
      padding: 40px;
      background: radial-gradient(circle at 10% 10%, #E8F7FD 0%, #FFF0F5 50%, #F5F7FA 100%);
      color: #18191C;
      display: flex;
      flex-direction: column;
      gap: 24px;
    }

    /* 顶部横幅 */
    .header-card {
      background: rgba(255, 255, 255, 0.85);
      backdrop-filter: blur(12px);
      border: 1px solid rgba(255, 255, 255, 0.6);
      border-radius: 20px;
      padding: 24px 32px;
      box-shadow: 0 10px 30px rgba(0, 174, 236, 0.08);
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .title-group h1 {
      font-size: 32px;
      font-weight: 800;
      background: linear-gradient(135deg, #00AEEC 0%, #FB7299 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      margin-bottom: 6px;
    }

    .title-group p {
      font-size: 14px;
      color: #61666D;
      display: flex;
      gap: 12px;
      align-items: center;
    }

    .issue-badge {
      background: linear-gradient(135deg, #FB7299 0%, #FF85A7 100%);
      color: white;
      font-size: 18px;
      font-weight: 700;
      padding: 8px 18px;
      border-radius: 30px;
      box-shadow: 0 4px 14px rgba(251, 114, 153, 0.35);
      letter-spacing: 0.5px;
    }

    /* TOP 1 冠军展示卡片 */
    .top1-hero {
      position: relative;
      background: rgba(255, 255, 255, 0.95);
      border-radius: 24px;
      overflow: hidden;
      border: 2px solid #FFE6AF;
      box-shadow: 0 16px 36px rgba(229, 169, 60, 0.15);
      display: flex;
      flex-direction: column;
    }

    .top1-header {
      padding: 20px 28px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      background: linear-gradient(to right, #FFFDF8, #FFFFFF);
      border-bottom: 1px solid #FFF3DC;
    }

    .top1-badge {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      background: linear-gradient(135deg, #FFC837 0%, #FF8008 100%);
      color: white;
      font-size: 14px;
      font-weight: 800;
      padding: 6px 14px;
      border-radius: 8px;
      box-shadow: 0 4px 10px rgba(255, 128, 8, 0.25);
    }

    .top1-bv {
      font-size: 14px;
      font-weight: 600;
      color: #00AEEC;
      background: #E8F7FD;
      padding: 4px 12px;
      border-radius: 6px;
    }

    .top1-content {
      padding: 24px 28px;
    }

    .top1-title {
      font-size: 26px;
      font-weight: 800;
      color: #18191C;
      margin-bottom: 16px;
      line-height: 1.3;
    }

    .top1-cover-box {
      width: 100%;
      height: 380px;
      border-radius: 16px;
      overflow: hidden;
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1);
      position: relative;
    }

    .top1-cover-box img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      display: block;
    }

    /* TOP 2~N 列表 */
    .ranking-grid {
      display: flex;
      flex-direction: column;
      gap: 10px;
    }

    .rank-row {
      background: rgba(255, 255, 255, 0.9);
      backdrop-filter: blur(8px);
      border: 1px solid rgba(255, 255, 255, 0.8);
      border-radius: 14px;
      padding: 14px 20px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.03);
      transition: all 0.2s;
    }

    .rank-row.top2 {
      border-left: 6px solid #8A9BA8;
      background: linear-gradient(to right, #F9FBFC, #FFFFFF);
    }

    .rank-row.top3 {
      border-left: 6px solid #C27C51;
      background: linear-gradient(to right, #FCFAF9, #FFFFFF);
    }

    .rank-left {
      display: flex;
      align-items: center;
      gap: 16px;
      flex: 1;
      overflow: hidden;
    }

    .rank-tag {
      font-size: 13px;
      font-weight: 700;
      padding: 4px 10px;
      border-radius: 6px;
      white-space: nowrap;
    }

    .tag-gold { background: #FFF4D9; color: #D48806; }
    .tag-silver { background: #EEF2F6; color: #536471; }
    .tag-bronze { background: #FDF0E9; color: #B35824; }
    .tag-normal { background: #E8F7FD; color: #00AEEC; }

    .song-thumb {
      width: 64px;
      height: 38px;
      border-radius: 6px;
      overflow: hidden;
      flex-shrink: 0;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
    }

    .song-thumb img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      display: block;
    }

    .song-title {
      font-size: 16px;
      font-weight: 700;
      color: #18191C;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .bvid-tag {
      font-size: 13px;
      font-weight: 500;
      color: #00AEEC;
      background: #F4F8FA;
      padding: 4px 10px;
      border-radius: 6px;
      white-space: nowrap;
      margin-left: 12px;
    }

    /* 底部水印 */
    .footer {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 8px 12px;
      font-size: 12px;
      color: #9499A0;
    }
  </style>
</head>
<body>

  <!-- Header -->
  <div class="header-card">
    <div class="title-group">
      <h1>🎵 Bili Board 术力口周榜</h1>
      <p>
        <span>📅 ${formatPublishTime(detail)}</span>
        <span>·</span>
        <span>第 ${detail.week || ''} 周</span>
        <span>·</span>
        <span>TOP ${items.length} 特别精选</span>
      </p>
    </div>
    <div class="issue-badge">第 ${detail.issue} 期</div>
  </div>

  <!-- TOP 1 Hero -->
  ${top1 ? `
  <div class="top1-hero">
    <div class="top1-header">
      <div class="top1-badge">🥇 TOP 1 冠军曲目</div>
      ${top1.bvid ? `<div class="top1-bv">BV: ${top1.bvid}</div>` : ''}
    </div>
    <div class="top1-content">
      <div class="top1-title">${top1.title}</div>
      ${showCover && top1.pic_url ? `
      <div class="top1-cover-box">
        <img src="${top1.pic_url}" alt="Cover" />
      </div>
      ` : ''}
    </div>
  </div>
  ` : ''}

  <!-- TOP 2~N 列表 -->
  ${otherItems.length > 0 ? `
  <div class="ranking-grid">
    ${otherItems.map(item => {
      let tagClass = 'tag-normal'
      let rowClass = ''
      let tagText = `【TOP ${item.rank}】`

      if (item.rank === 2) {
        tagClass = 'tag-silver'
        rowClass = 'top2'
        tagText = '🥈 TOP 2'
      } else if (item.rank === 3) {
        tagClass = 'tag-bronze'
        rowClass = 'top3'
        tagText = '🥉 TOP 3'
      }

      const showThumb = config.puppeteerShowAllCovers && showCover && item.pic_url
      const thumbHtml = showThumb ? `<div class="song-thumb"><img src="${item.pic_url}" alt="thumb" /></div>` : ''

      return `
      <div class="rank-row ${rowClass}">
        <div class="rank-left">
          <span class="rank-tag ${tagClass}">${tagText}</span>
          ${thumbHtml}
          <span class="song-title">${item.title}</span>
        </div>
        ${item.bvid ? `<span class="bvid-tag">${item.bvid}</span>` : ''}
      </div>
      `
    }).join('')}
  </div>
  ` : ''}

  <!-- Footer -->
  <div class="footer">
    <span>💡 数据来源于 Bilibili @Bili Board Atel 周榜公开专栏</span>
    <span>Koishi Billboard Data · High-Definition Poster</span>
  </div>

</body>
</html>`

  try {
    const page = await ctx.puppeteer.page()
    await page.setContent(html, { waitUntil: 'networkidle0', timeout: 20000 })
    const bodyHandle = await page.$('body')
    const buffer = await bodyHandle.screenshot({
      type: 'png',
      omitBackground: false,
    })
    await page.close()
    return h.image(buffer, 'image/png')
  } catch (err: any) {
    logger.error(`❌ Puppeteer 截图失败: ${err.message || err}`)
    return null
  }
}
