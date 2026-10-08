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

在 Koishi 控制台中可直接进行图形化配置：

- **数据源列表 (`dataSources`)**：默认包含 jsDelivr CDN 与 GitHub Raw（按顺序从前往后依次尝试）
- **网络代理模式 (`proxyMode`)**：
  - `none`：不走代理（直连访问）
  - `custom`：走指定代理 URL（支持 HTTP/HTTPS/SOCKS5）
  - `ghproxy`：走公网 GitHub 加速代理镜像（默认）
- **自定义代理地址 (`customProxyUrl`)**：默认 `http://127.0.0.1:7890`（代理模式选为指定代理时生效）
- **公网 GitHub 代理前缀 (`ghProxyPrefix`)**：默认 `https://gh-proxy.org/`（代理模式选为公网加速时生效）
- **默认展示数量 (`defaultTop`)**：默认 10，最大 20
- **附带封面海报 (`showCover`)**：默认 `true`
- **引用回复 (`enableQuote`)**：默认 `false`
- **启用新榜广播 (`enableBroadcast`)**：默认 `false`
- **订阅频道列表 (`broadcastChannels`)**：广播目标平台与频道，例如 `onebot:12345678`
- **轮询检测周期 (`checkInterval`)**：默认每 15 分钟检测一次

---

## 📄 开源许可

[MIT License](LICENSE)
