import { Context } from 'koishi'
import type { Config } from '../config'
import type { BillboardService } from '../service'
import { sendReply } from '../utils'

export function registerReloadCommand(ctx: Context, config: Config, service: BillboardService) {
  ctx.command('周榜.刷新', '🔄 强制刷新周榜远程数据缓存 (bb.reload)')
    .alias('bb.reload')
    .action(async ({ session }) => {
      try {
        const index = await service.getIndex(true)
        await sendReply(session, config, `✅ 周榜索引已强制刷新成功！当前最新: 第 ${index.latest_issue} 期。`)
      } catch (err: any) {
        await sendReply(session, config, `❌ 刷新失败: ${err.message || err}`)
      }
    })
}
