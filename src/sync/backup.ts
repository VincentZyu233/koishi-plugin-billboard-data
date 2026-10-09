import { Context } from 'koishi'
import * as fs from 'fs'
import * as path from 'path'
import type { Config } from '../config'
import type { WeeklyDetail, IndexData } from '../types'

export class LocalBackupService {
  constructor(private ctx: Context, private config: Config) {}

  private get baseDir(): string {
    const root = (this.ctx as any).baseDir || process.cwd()
    return path.resolve(root, 'data', 'billboard-data')
  }

  saveIssue(source: 'bilibili' | 'niconico', issue: number, data: WeeklyDetail): void {
    if (!this.config.saveLocalJsonBackup) return

    try {
      const sourceDir = path.join(this.baseDir, source, 'weekly')
      if (!fs.existsSync(sourceDir)) {
        fs.mkdirSync(sourceDir, { recursive: true })
      }

      const filePath = path.join(sourceDir, `issue_${issue}.json`)
      fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8')
    } catch (err: any) {
      this.ctx.logger('billboard').debug(`保存本地 JSON 备份文件失败: ${err.message || err}`)
    }
  }

  saveIndex(source: 'bilibili' | 'niconico', index: IndexData): void {
    if (!this.config.saveLocalJsonBackup) return

    try {
      const sourceDir = path.join(this.baseDir, source)
      if (!fs.existsSync(sourceDir)) {
        fs.mkdirSync(sourceDir, { recursive: true })
      }

      const filePath = path.join(sourceDir, 'index.json')
      fs.writeFileSync(filePath, JSON.stringify(index, null, 2), 'utf-8')
    } catch (err: any) {
      this.ctx.logger('billboard').debug(`保存本地 index.json 备份失败: ${err.message || err}`)
    }
  }
}
