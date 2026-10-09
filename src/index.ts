import { Context } from 'koishi'
import type { Config } from './config'
import { Config as ConfigSchema } from './config'
import { BillboardService } from './service'
import { registerCommands } from './commands'
import { applyBroadcast } from './broadcast'
import { applyDatabaseModel } from './database/schema'
import { BackfillService } from './sync/backfill'

export const name = 'billboard-data'
export const inject = {
  required: ['http'],
  optional: ['database', 'cron'],
}

export { ConfigSchema as Config }
export * from './usage'

export function apply(ctx: Context, config: Config) {
  // 规范等待可选数据库服务注入并挂载模型
  ctx.inject(['database'], (dbCtx) => {
    applyDatabaseModel(dbCtx)
  })

  const service = new BillboardService(ctx, config)
  const backfillService = new BackfillService(ctx, config, service.cacheService, service.backupService)

  // 注册指令集
  registerCommands(ctx, config, service)

  // 挂载自动广播
  applyBroadcast(ctx, config, service)

  // 挂载周三 19:00 智能失效 Cron（如果可选 cron 服务就绪）
  ctx.inject(['cron'], (cronCtx: any) => {
    if (config.enableWeeklyInvalidation && config.weeklyInvalidationCron?.trim()) {
      cronCtx.cron(config.weeklyInvalidationCron.trim(), () => {
        ctx.logger('billboard').info('🕒 触发周三智能失效 Cron，正在刷新最新周榜缓存...')
        service.clearCache()
      })
    }
  })

  // 启动后异步检查是否执行冷启动回溯
  ctx.on('ready', () => {
    backfillService.runBackfill().catch((err) => {
      ctx.logger('billboard').warn(`冷启动全量回溯过程异常: ${err.message || err}`)
    })
  })
}
