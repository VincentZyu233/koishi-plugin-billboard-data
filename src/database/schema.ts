import { Context } from 'koishi'

declare module 'koishi' {
  interface Tables {
    billboard_cache: BillboardCacheRecord
  }
}

export interface BillboardCacheRecord {
  id: number
  source: 'bilibili' | 'niconico'
  issue: number
  isLatest: boolean
  title: string
  data: any
  updatedAt: Date
}

export function applyDatabaseModel(ctx: Context) {
  ctx.model.extend('billboard_cache', {
    id: 'unsigned',
    source: 'string',
    issue: 'integer',
    isLatest: 'boolean',
    title: 'string',
    data: 'json',
    updatedAt: 'timestamp',
  }, {
    primary: 'id',
    autoInc: true,
    unique: [['source', 'issue']],
  })
}
