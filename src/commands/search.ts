import { Context } from 'koishi'
import type { Config, BillboardSource } from '../config'
import type { BillboardService } from '../service'
import { sendReply } from '../utils/reply'

export function registerSearchCommand(ctx: Context, config: Config, service: BillboardService) {
  ctx.command('周榜.查歌 <keyword:string>', '🔍 在近期周榜中搜索歌曲排位 (bb.search)')
    .alias('周榜搜歌', 'bb.search')
    .option('source', '-s, --source <source:string> 指定数据源 (bilibili/bili 或 niconico/nico)')
    .action(async ({ session, options }, keyword) => {
      if (!keyword || !keyword.trim()) {
        await sendReply(session, config, '请输入要搜索的歌曲名称关键词，例如「周榜.查歌 敌人」')
        return
      }

      let source: BillboardSource = config.defaultSource
      if (options?.source) {
        const s = String(options.source).trim().toLowerCase()
        if (s === 'bili' || s === 'bilibili') {
          source = 'bilibili'
        } else if (s === 'nico' || s === 'niconico') {
          source = 'niconico'
        } else {
          await sendReply(session, config, `❌ 不支持的数据源「${options.source}」，仅支持 bilibili 或 niconico`)
          return
        }
      }

      if (!source) {
        throw new Error('未在配置中指定 defaultSource 且未提供 -s 参数')
      }

      try {
        const sourceLabel = source === 'niconico' ? 'Niconico' : 'Bilibili'
        await sendReply(session, config, `🔍 正在检索 [${sourceLabel}] 近 20 期周榜数据中...`)
        const result = await service.searchSong(source, keyword.trim())

        if (result.records.length === 0) {
          await sendReply(session, config, `未在 [${sourceLabel}] 最近收录的周榜中检索到包含「${keyword}」的曲目。`)
          return
        }

        const lines = [
          `🔍【「${keyword}」${sourceLabel} 周榜历史战绩】`,
          `共在 ${result.records.length} 期周榜中取得名次:`,
          '━━━━━━━━━━━━━━━',
        ]

        for (const rec of result.records.slice(0, 8)) {
          const authorStr = rec.author ? ` (${rec.author})` : ''
          lines.push(`• 第 ${rec.issue} 期: 第 ${rec.rank} 名 - 《${rec.title}》${authorStr}`)
        }

        if (result.records.length > 8) {
          lines.push(`...等共 ${result.records.length} 次上榜`)
        }

        lines.push('━━━━━━━━━━━━━━━')
        lines.push(`💡 发送「bb -s ${source} <期号>」可直达对应完整期数`)

        await sendReply(session, config, lines.join('\n'))
      } catch (err: any) {
        await sendReply(session, config, `❌ 搜索失败: ${err.message || err}`)
      }
    })
}
