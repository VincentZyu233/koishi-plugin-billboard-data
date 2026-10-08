import { Context } from 'koishi'
import type { Config } from '../config'
import type { BillboardService } from '../service'
import { sendReply } from '../utils'

export function registerSearchCommand(ctx: Context, config: Config, service: BillboardService) {
  ctx.command('周榜.查歌 <keyword:string>', '🔍 在近期周榜中搜索歌曲排位')
    .alias('周榜搜歌', 'bb.search')
    .action(async ({ session }, keyword) => {
      if (!keyword || !keyword.trim()) {
        return '请输入要搜索的歌曲名称关键词，例如「周榜.查歌 敌人」'
      }

      try {
        await session?.send(`🔍 正在检索近 20 期周榜数据中...`)
        const result = await service.searchSong(keyword.trim())

        if (result.records.length === 0) {
          return `未在最近收录的周榜中检索到包含「${keyword}」的曲目。`
        }

        const lines = [
          `🔍【「${keyword}」周榜历史战绩】`,
          `共在 ${result.records.length} 期周榜中取得名次:`,
          '━━━━━━━━━━━━━━━',
        ]

        for (const rec of result.records.slice(0, 8)) {
          lines.push(`• 第 ${rec.issue} 期: 第 ${rec.rank} 名 - 《${rec.title}》`)
        }

        if (result.records.length > 8) {
          lines.push(`...等共 ${result.records.length} 次上榜`)
        }

        lines.push('━━━━━━━━━━━━━━━')
        lines.push('💡 发送「周榜 <期号>」可直达对应完整期数')

        await sendReply(session, config, lines.join('\n'))
      } catch (err: any) {
        await session?.send(`❌ 搜索失败: ${err.message || err}`)
      }
    })
}
