import { h } from 'koishi'
import type { Config } from '../config'

export async function sendReply(session: any, config: Config, reply: any) {
  if (!session) return
  if (config.enableQuote && session.messageId) {
    if (Array.isArray(reply)) {
      return await session.send([h.quote(session.messageId), ...reply])
    } else {
      return await session.send([h.quote(session.messageId), typeof reply === 'string' ? h.text(reply) : reply])
    }
  } else {
    return await session.send(reply)
  }
}
