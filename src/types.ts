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
