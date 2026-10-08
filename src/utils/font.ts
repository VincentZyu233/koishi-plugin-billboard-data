import path from 'path'
import { readFile, writeFile, mkdir } from 'fs/promises'
import { existsSync, statSync } from 'fs'
import { createHash } from 'crypto'
import type { Context } from 'koishi'

export const LXGW_WENKAI_FILE_NAME = 'LXGWWenKaiMono-Regular.ttf'

const GITEE_RELEASE_URL = `https://gitee.com/vincent-zyu/koishi-plugin-awa-quote-image/releases/download/fonts/${LXGW_WENKAI_FILE_NAME}`
const GITHUB_RELEASE_URL = `https://github.com/VincentZyuApps/koishi-plugin-awa-quote-image/releases/download/fonts/${LXGW_WENKAI_FILE_NAME}`

export const LXGW_FONT_INTEGRITY = {
  size: 24755236,
  md5: '90e75a25cca0e8868977b880352c6a53',
  sha256: 'ee9faa6479c5b2434f9bceca8e2e7b643f699f4f3d067aac9609261e07c6be61',
}

export function getFontDirByBaseDir(baseDir: string): string {
  return path.join(baseDir, 'data', 'fonts')
}

export function getLxgwFontPath(baseDir: string): string {
  return path.join(getFontDirByBaseDir(baseDir), LXGW_WENKAI_FILE_NAME)
}

export async function verifyFontIntegrity(filePath: string): Promise<boolean> {
  if (!existsSync(filePath)) return false
  try {
    const stats = statSync(filePath)
    if (stats.size !== LXGW_FONT_INTEGRITY.size) return false

    const content = await readFile(filePath)
    const md5 = createHash('md5').update(content).digest('hex')
    if (md5 !== LXGW_FONT_INTEGRITY.md5) return false

    const sha256 = createHash('sha256').update(content).digest('hex')
    if (sha256 !== LXGW_FONT_INTEGRITY.sha256) return false

    return true
  } catch {
    return false
  }
}

async function downloadFileWithFallback(ctx: Context, destPath: string): Promise<void> {
  const logger = ctx.logger('billboard')
  const dir = path.dirname(destPath)
  if (!existsSync(dir)) {
    await mkdir(dir, { recursive: true })
  }

  const sources = [
    { name: 'Gitee Release', url: GITEE_RELEASE_URL },
    { name: 'GitHub Release', url: GITHUB_RELEASE_URL },
  ]

  let lastErr: any = null
  for (const src of sources) {
    try {
      logger.info(`📥 正在从 ${src.name} 下载字体: ${LXGW_WENKAI_FILE_NAME}...`)
      const res = await ctx.http.get(src.url, { responseType: 'arraybuffer', timeout: 30000 })
      const buffer = Buffer.from(res)
      await writeFile(destPath, buffer)
      const valid = await verifyFontIntegrity(destPath)
      if (valid) {
        logger.info(`✅ 字体 ${LXGW_WENKAI_FILE_NAME} 从 ${src.name} 下载并校验成功！`)
        return
      } else {
        throw new Error('下载文件哈希校验失败')
      }
    } catch (err: any) {
      lastErr = err
      logger.warn(`⚠️ 从 ${src.name} 下载字体失败: ${err.message || err}`)
    }
  }

  throw new Error(`字体下载失败，Gitee / GitHub 均不可用: ${lastErr?.message || lastErr}`)
}

let downloadPromise: Promise<string> | null = null

export async function ensureLxgwFont(ctx: Context): Promise<string> {
  const fontPath = getLxgwFontPath(ctx.baseDir)
  if (await verifyFontIntegrity(fontPath)) {
    return fontPath
  }

  if (downloadPromise) return downloadPromise

  downloadPromise = (async () => {
    try {
      await downloadFileWithFallback(ctx, fontPath)
      return fontPath
    } finally {
      downloadPromise = null
    }
  })()

  return downloadPromise
}
