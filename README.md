# cf-raw-mirror

用 Cloudflare Workers / Pages 自建的 **GitHub raw 加速镜像**。单文件、不需要服务器、不需要构建。

配合 [音源猎手](https://github.com/zlyon/lx-hunter) 插件的「自定义镜像」使用 —— 拉取音源脚本不再超时。

[![Deploy to Cloudflare](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/zlyon/cf-raw-mirror)

---

## 为什么需要它

`raw.githubusercontent.com` 在国内经常连不上或极慢。公共镜像站虽然方便，但会限速、会关站、会跑路。自建一个只有你自己用，稳定可控，而且**免费**（一个域名约 ¥5/年，域名怎么弄见 [TUTORIAL.md](./TUTORIAL.md) 第 2 步）。

## 部署方式（三选一）

同一份 [`_worker.js`](./_worker.js) 三种方式都能用，**部署完功能完全一样**。但有一个区别，**选之前务必看一眼**：

| 方式 | 以后怎么更新 | 能否配「优选 IP」（国内才快） |
|---|---|---|
| **Workers**（推荐） | 重新复制粘贴 | ✅ **可以** |
| Pages | 点一下 `Sync fork` 自动重部署 | ❌ **不行** ⚠️ |

> **只想要个能用的镜像** → 随便选。
> **在意国内速度** → **建议用 Workers**。Pages 绑域名时强制走 Cloudflare 自己的代理，代理开关不能自己控制，没法做优选 IP（原因见方式二下方）。

### 方式一：Workers（复制粘贴，最省事）

1. 打开 [`_worker.js`](./_worker.js)，点右上角 **`Raw`**，全选复制
2. Cloudflare 后台 → **`Workers & Pages`** → **`Create`** → **`Create Worker`** → 起个名字（如 `cf-raw-mirror`）→ **`Deploy`**
3. 点 **`Edit code`** → **把编辑器里默认代码全选删掉** → 粘贴刚才复制的内容 → 右上角 **`Deploy`**

> 只按 Ctrl+S 只存在编辑器里，**必须点 `Deploy` 才生效**。

### 方式二：Pages（Fork 后连 Git，日后好更新）

1. 点本仓库右上角 **`Fork`**
2. Cloudflare 后台 → **`Workers & Pages`** → **`Create`** → **`Pages`** → **`Connect to Git`** → 选你 Fork 的仓库
3. 构建设置**全部留空**：

   | 设置项 | 填什么 |
   |---|---|
   | Framework preset | `None` |
   | Build command | **留空** |
   | Build output directory | **留空**（或填 `/`） |

4. 点 **`Save and Deploy`**

> Pages 会自动识别根目录的 `_worker.js`（advanced mode）并用它接管所有请求，所以不需要构建、不用改任何文件。
> 以后上游更新了，在你 Fork 的仓库点一次 **`Sync fork`** 就会自动重新部署。

> [!IMPORTANT]
> **Pages 部署做不了「优选 IP」。** Cloudflare 给 Pages 绑域名时不允许你关掉代理（橙云），而优选 IP 的前提正是「DNS 记录改成灰云 + 用 Workers 路由接管」。所以 Pages 部署**只能走 Cloudflare 分配的默认线路**，国内访问可能不快。想提速请改用 Workers 方式（或在第三方 DNS 上做分线路解析，很折腾，不推荐）。

### 方式三：命令行

```bash
npm i -g wrangler
wrangler login
wrangler deploy
```

或直接点上面的 **Deploy to Cloudflare** 按钮。

## ⚠️ 部署完国内打不开？这是正常的

`*.workers.dev` 和 `*.pages.dev` 在国内 **DNS 被污染**，直连基本打不开。**必须绑自己的域名**，并且做完「优选 IP」才真正好用。

完整步骤见 **[TUTORIAL.md](./TUTORIAL.md)**（从注册 Cloudflare 账号到优选 IP，一步步带做）。核心就三条：

1. 先绑一个自定义域（Custom Domain），确认能用
2. 删掉自定义域，**改用「路由（Route）」** —— 因为自定义域自带橙云，橙云会忽略你填的 IP
3. DNS 改成**灰色云**，CNAME 到社区优选域名，或干脆**固定 A 记录**填一个扫出来的快 IP

## 怎么用

### 直接访问

```text
https://你的域名/https://raw.githubusercontent.com/owner/repo/ref/path/to/file.js
```

例如：

```text
https://gh.example.com/https://raw.githubusercontent.com/zlyon/lx-hunter/main/plugin.json
```

### 填进「音源猎手」

`设置` → `网络` → **raw 加速镜像** 选 **`自定义…`** → 输入框填 `https://你的域名` → 点右边 `测试`。

> **1.4.22 起**写不写 `https://` 都可以；**1.4.21 及更早**必须自己写全 `https://`（老版本的「测试」按钮会自动补协议，但真正爬取时不会，会出现「测试通过、爬取静默失败」）。

## 行为说明

| 行为 | 说明 |
|---|---|
| 协议兼容 | `/<完整URL>`；省略 `https://` 也认（`/raw.githubusercontent.com/...`） |
| 路径兼容 | 支持中文、空格、括号等，会自动 `decodeURIComponent` |
| 主机白名单 | 只放行 GitHub 相关域名（见 `_worker.js` 的 `ALLOW_HOSTS`），其他一律 `403` |
| 缓存 | 分支名 / tag → **5 分钟**；commit sha → **1 天**。命中缓存时响应头 `X-Mirror-Cache: HIT` |
| 404 透传 | 文件不存在时**如实返回 404**，不伪造 200（插件靠这个判定文件是否存在） |
| 根路径 | 返回一段自检文本，说明部署成功和用法 |
| 鉴权 | 可选。设环境变量 `TOKEN` 后需带 `?token=xxx`。**给插件用就别设**（插件只做前缀拼接，带不了 token） |

## 常见问题

| 现象 | 原因 / 解决 |
|---|---|
| 部署完打不开 | `workers.dev` / `pages.dev` 国内被污染 → 绑自定义域名 |
| 子路径全部 404 | 用的是「自定义域」而不是「路由」，或路由规则漏了末尾的 `/*` |
| 绑了域名还是慢 | 没做优选 IP，或优选域名解析到的 IP 不好 → 见 TUTORIAL 第 6 步 |
| `403 不允许的主机` | 目标不是 GitHub 域名。**不要**把白名单改成任意站点 |
| 拿到的是旧脚本 | 分支缓存 5 分钟，等一会儿；或改用 commit sha 访问 |
| `Error 1027` | 当天请求超过 10 万次（免费版上限） |

## 配额与风险

- **免费版额度**：请求 **10 万次 / 天**、CPU **10ms / 次**（等回源不计入）、**流量不限**。个人自用绰绰有余；公开给大量用户用会被打满，需要 Workers Paid（$5/月）。
- **别改成开放代理**：白名单是故意留的。转发任意站点是被 Cloudflare 封号的头号原因。
- **别拿它代理视频 / 大文件**：Cloudflare 免费版条款限制把 CDN 用于非 HTML 内容的过度分发。代理代码文件和 JSON 完全没问题。

## 相关

- 📖 **[零基础教程：搭一个自己的 GitHub 加速镜像](./TUTORIAL.md)**
- 🔌 [音源猎手插件](https://github.com/zlyon/lx-hunter)

## 许可

[GPL-3.0-or-later](./LICENSE)
