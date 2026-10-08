import { Context } from 'koishi'
import type { Config } from './config'
import { Config as ConfigSchema } from './config'
import { BillboardService } from './service'
import { registerCommands } from './commands'
import { applyBroadcast } from './broadcast'

export const name = 'billboard-data'
export const inject = ['http']
export { ConfigSchema as Config }

export function apply(ctx: Context, config: Config) {
  const service = new BillboardService(ctx, config)

  // 注册指令集
  registerCommands(ctx, config, service)

  // 挂载自动广播
  applyBroadcast(ctx, config, service)
}
