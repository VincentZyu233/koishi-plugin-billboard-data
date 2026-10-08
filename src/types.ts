export interface IssueMeta {
  issue: number
  type: string
  opus_id: string
  title: string
  year?: number
  date?: string
  week?: number
  pub_time_str?: string
  pub_ts?: number | null
  total_ranked: number
  source_url: string
  path: string
}

export interface IndexData {
  updated_at: string
  latest_issue: number
  total_issues: number
  issues: IssueMeta[]
}

export interface SongItem {
  rank: number
  title: string
  bvid: string
  url: string
  pic_url: string
}

export interface WeeklyDetail {
  issue: number
  type: string
  opus_id: string
  title: string
  year?: number
  date?: string
  week?: number
  pub_time_str?: string
  pub_ts?: number | null
  source_url: string
  updated_at: string
  total_ranked: number
  items: SongItem[]
}

export function formatPublishTime(detail: { date?: string; pub_ts?: number | null; pub_time_str?: string }): string {
  if (detail.pub_ts) {
    const d = new Date(detail.pub_ts * 1000)
    // 转换为北京时间 (UTC+8)
    const year = d.getUTCFullYear()
    const month = String(d.getUTCMonth() + 1).padStart(2, '0')
    const day = String(d.getUTCDate()).padStart(2, '0')
    const hours = String((d.getUTCHours() + 8) % 24).padStart(2, '0')
    const minutes = String(d.getUTCMinutes()).padStart(2, '0')
    return `${year}-${month}-${day} ${hours}:${minutes}`
  }
  if (detail.pub_time_str) {
    const m = detail.pub_time_str.match(/(\d{4})年(\d{1,2})月(\d{1,2})日\s*(\d{1,2}:\d{2})/)
    if (m) {
      return `${m[1]}-${m[2].padStart(2, '0')}-${m[3].padStart(2, '0')} ${m[4]}`
    }
    return detail.pub_time_str.replace('编辑于 ', '').trim()
  }
  return detail.date || '近期'
}
