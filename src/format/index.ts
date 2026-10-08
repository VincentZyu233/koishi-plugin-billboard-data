import type { Session, Context } from 'koishi'
import type { Config } from '../config'
import type { WeeklyDetail } from '../types'
import { sendReply } from '../utils/reply'
import { formatWeeklyText } from './text'
import { renderWeeklyTakumi } from './takumi'
import { renderWeeklyPuppeteer } from './puppeteer'
import { sendWeeklyQQMarkdown } from './markdown'

export * from './text'
export * from './markdown'
export * from './takumi'
export * from './puppeteer'

export async function dispatchWeeklyOutput(
  ctx: Context,
  session: Session,
  config: Config,
  detail: WeeklyDetail,
  limit: number,
  showCover: boolean
) {
  const formats = config.outputFormats || ['text', 'takumi', 'puppeteer', 'qq_markdown']

  // 1. 纯文本输出
  if (formats.includes('text')) {
    const textMsg = formatWeeklyText(detail, limit, showCover)
    await sendReply(session, config, textMsg)
  }

  // 2. Takumi WASM 出图输出
  if (formats.includes('takumi')) {
    try {
      const img = await renderWeeklyTakumi(ctx, config, detail, limit, showCover)
      if (img) {
        await sendReply(session, config, img)
      }
    } catch (err: any) {
      ctx.logger('billboard').warn(`⚠️ Takumi 出图失败: ${err.message || err}`)
    }
  }

  // 3. Puppeteer 精美海报出图输出
  if (formats.includes('puppeteer')) {
    try {
      const img = await renderWeeklyPuppeteer(ctx, config, detail, limit, showCover)
      if (img) {
        await sendReply(session, config, img)
      }
    } catch (err: any) {
      ctx.logger('billboard').warn(`⚠️ Puppeteer 出图失败: ${err.message || err}`)
    }
  }

  // 4. QQ 原生 Markdown 表格（仅在 qq 平台生效）
  if (formats.includes('qq_markdown') && session.platform === 'qq') {
    try {
      await sendWeeklyQQMarkdown(ctx, session, config, detail, limit)
    } catch (err: any) {
      ctx.logger('billboard').warn(`⚠️ 发送 QQ Markdown 失败: ${err.message || err}`)
    }
  }
}
