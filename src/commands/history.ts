import { Context } from 'koishi'
import type { Config } from '../config'
import type { BillboardService } from '../service'
import { sendReply } from '../utils/reply'

export function registerHistoryCommand(ctx: Context, config: Config, service: BillboardService) {
  ctx.command('周榜.历史', '📜 查看最近收录的周榜期数列表 (bb.history)')
    .alias('周榜历史', 'bb.history')
    .action(async ({ session }) => {
      try {
        const index = await service.getIndex()
        const recent = index.issues.slice(0, 10)

        const lines = [
          '📜【术力口周榜 · 历史收录一览】',
          `最新期数: 第 ${index.latest_issue} 期 (共收录 ${index.total_issues} 期)`,
          '━━━━━━━━━━━━━━━',
        ]

        for (const meta of recent) {
          lines.push(`• 第 ${meta.issue} 期 (${meta.date || '未知日期'}) - ${meta.total_ranked} 首曲目`)
        }

        lines.push('━━━━━━━━━━━━━━━')
        lines.push('💡 输入「周榜 <期数>」即可快速查看指定期详细排名！')

        await sendReply(session, config, lines.join('\n'))
      } catch (err: any) {
        await sendReply(session, config, `❌ 获取周榜历史失败: ${err.message || err}`)
      }
    })
}
