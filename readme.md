# koishi-plugin-billboard-data

[![npm](https://img.shields.io/npm/v/koishi-plugin-billboard-data?style=flat-square)](https://www.npmjs.com/package/koishi-plugin-billboard-data)

用于查询《Bili Board 术力口周榜》（VOCALOID / 虚拟歌手周榜）的 Koishi 插件。

数据源来自于由 GitHub Actions 自动化每周定时归档的公开数据仓库 [billboard-data](https://github.com/VincentZyu233/billboard-data)。

---

## 🌟 功能特性

- **即开即用**：零数据库配置，直接基于 jsDelivr 全球加速 CDN 读取静态 JSON。
- **两级缓存**：内置内存与单期永久缓存，响应毫秒级，无多余网络开销。
- **支持历史回溯**：不仅可看最新一期，还可查询任意历史期数。
- **曲目反向检索**：支持搜索任意歌曲在近期周榜中的上榜记录与最高名次。
- **新榜自动广播**：可选开启每周三新榜发布自动广播提醒。

---

## 📖 指令列表

| 指令 | 别名 | 描述 | 示例 |
| :--- | :--- | :--- | :--- |
| `周榜 [期数]` | `术力口周榜`, `bb` | 查看最新或指定期数的排行榜（默认展示 TOP 10） | `周榜` / `周榜 120` / `周榜 -n 20` |
| `周榜.历史` | `周榜历史`, `bb.history` | 查看近期收录的周榜期数总览 | `周榜.历史` |
| `周榜.查歌 <歌名>` | `周榜搜歌`, `bb.search` | 检索某首歌曲在近期周榜中的排位战绩 | `周榜.查歌 敌人` |
| `周榜.刷新` | `bb.reload` | 管理员强制刷新远程索引缓存 | `周榜.刷新` |

### 指令选项
- `-n <数量>`：指定展示前几名（1 ~ 20，默认 10）。
- `-c`：附带第一名封面海报大图。
- `-C`：强制不附带图片（纯文本模式）。

---

## ⚙️ 配置项说明

在 Koishi 控制台中可直接进行图形化配置。

### 🌐 数据源设置

| 配置项 | 类型 | 默认值 | 说明 |
|---|---|---|---|
| `dataSources` | `string[]` | jsDelivr + GitHub Raw | 📡 数据源列表（按顺序从前往后依次尝试请求） |

### 🛡️ 网络代理配置

| 配置项 | 类型 | 默认值 | 说明 |
|---|---|---|---|
| `proxyMode` | `"none" \| "custom" \| "ghproxy"` | `"ghproxy"` | 🚀 网络代理模式（直连 / 指定代理 / 公网 GitHub 镜像加速） |
| `customProxyUrl` | `string` | `"http://127.0.0.1:7890"` | 🌐 自定义代理服务器地址（支持 HTTP/HTTPS/SOCKS5） |
| `ghProxyPrefix` | `string` | `"https://gh-proxy.org/"` | 🔗 公网 GitHub 代理前缀（代理模式选为公网加速时生效） |

### 🎨 显示偏好

| 配置项 | 类型 | 默认值 | 说明 |
|---|---|---|---|
| `enableQuote` | `boolean` | `true` | 💬 是否启用引用回复 |
| `defaultTop` | `number` | `10` | 🔢 默认展示前多少名（可在 1 ~ 20 之间调节，亦可通过 `-n` 参数覆盖） |
| `showCover` | `boolean` | `true` | 🖼️ 查询周榜时是否附带第一名的榜单海报图片 |

### 📢 订阅推送

| 配置项 | 类型 | 默认值 | 说明 |
|---|---|---|---|
| `enableBroadcast` | `boolean` | `false` | 🔔 是否启用每周新榜自动广播提醒 |
| `broadcastTargets` | `BroadcastTarget[]` | 默认包含 OneBot 群聊 | 🎯 广播推送目标表格（包含 platform、Bot selfId、群号及启用开关） |
| `checkInterval` | `number` | `15` | ⏱️ 新榜自动检测周期（分钟） |

#### 🎯 广播目标表格 (`broadcastTargets`) 说明

| 字段 | 类型 | 说明 |
|---|---|---|
| `note` | `string` | 📝 备注，仅用于在控制台标记识别目标 |
| `platform` | `string` | 🎯 平台标识，例如 `onebot`、`qq`、`discord` |
| `selfId` | `string` | 🤖 Bot 自身账号 ID。**留空时向该 platform 下所有满足条件的在线 Bot 发送**；填写时精确匹配 |
| `channelId` | `string` | 📡 目标群号或频道 ID，OneBot 填真实 QQ 群号 |
| `enabled` | `boolean` | ✅ 独立启用开关，关闭后跳过该条目标 |

> **默认预设项**：
> - 平台: `onebot`
> - 群号 / 频道 ID: `958366323`
> - selfId: 留空（自动向该平台全部满足条件的在线 Bot 广播）
> - 启用: `true`

---

## 📄 开源许可

[MIT License](LICENSE)
