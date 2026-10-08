import { Context } from 'koishi'
import type { Config } from '../config'
import type { BillboardService } from '../service'
import { registerWeeklyCommand } from './weekly'
import { registerHistoryCommand } from './history'
import { registerSearchCommand } from './search'
import { registerReloadCommand } from './reload'

export function registerCommands(ctx: Context, config: Config, service: BillboardService) {
  registerWeeklyCommand(ctx, config, service)
  registerHistoryCommand(ctx, config, service)
  registerSearchCommand(ctx, config, service)
  registerReloadCommand(ctx, config, service)
}
