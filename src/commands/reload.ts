import { Context } from 'koishi'
import type { Config } from '../config'
import type { BillboardService } from '../service'
import { sendReply } from '../utils/reply'

export function registerReloadCommand(ctx: Context, config: Config, service: BillboardService) {
  ctx.command('周榜.刷新', '🔄 强制刷新周榜远程数据缓存 (bb.reload)')
    .alias('bb.reload')
    .action(async ({ session }) => {
      try {
        service.clearCache()
        const biliIndex = await service.getIndex('bilibili')
        const nicoIndex = await service.getIndex('niconico')
        await sendReply(
          session,
          config,
          `✅ 周榜内存缓存已清空，远程索引刷新成功！\n• B站最新: 第 ${biliIndex.latest_issue} 期\n• N站最新: 第 ${nicoIndex.latest_issue} 期`
        )
      } catch (err: any) {
        await sendReply(session, config, `❌ 刷新失败: ${err.message || err}`)
      }
    })
}
