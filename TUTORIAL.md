# 零基础教程：搭一个自己的 GitHub 加速镜像

> 面向「音源猎手」插件的用户。**唯一的开销是一个域名（约 ¥5/年，也可以白嫖）**，其余全程免费；不需要服务器，不需要写代码。
> 动手前请先读完开头的「你需要准备什么」。
>
> 代码仓库：<https://github.com/zlyon/cf-raw-mirror> —— 它的代码只有一份 `_worker.js`，**三种部署方式**（Workers 复制粘贴 / Deploy 按钮一键部署 / Pages Fork 连 Git）都能用，见第 4 步。

---

## 目录

- [你会得到什么](#你会得到什么)
- [你需要准备什么](#你需要准备什么)
- [第 1 步：注册 Cloudflare 账号](#第-1-步注册-cloudflare-账号)
- [第 2 步：搞一个域名](#第-2-步搞一个域名)
- [第 3 步：把域名交给 Cloudflare 托管](#第-3-步把域名交给-cloudflare-托管)
- [第 4 步：部署（三种方式）](#第-4-步部署三种方式)
- [第 5 步：绑域名，先让它跑通](#第-5-步绑域名先让它跑通)
- [第 6 步：换成「路由 + 优选 IP」（关键的一步）](#第-6-步换成路由--优选-ip关键的一步)
- [第 7 步：填进插件](#第-7-步填进插件)
- [第 8 步：出问题了对号入座](#第-8-步出问题了对号入座)
- [附录：额度、注意事项、日常维护](#附录额度注意事项日常维护)

---

## 你会得到什么

一个属于你自己的加速地址，长这样：

```
https://gh.你的域名/https://raw.githubusercontent.com/owner/repo/main/xxx.js
```

把它填进插件后：

- **不再看公共镜像站的脸色** —— 别人哪天关站、限速、跑路，都跟你无关。
- **国内直连也快** —— 配好后拉一个几百 KB 的脚本通常几百毫秒。
- **成本几乎为零** —— Cloudflare 账号和 Worker 都免费（额度见附录），**唯一要花钱的是一个域名：纯数字 `.xyz` 约 ¥5/年**。

在插件里的位置：`设置 → 网络 → raw 加速镜像 → 自定义…`

---

## 你需要准备什么

| 项目 | 说明 |
|---|---|
| 时间 | 30~60 分钟（其中大半是在等 DNS 生效，不用一直盯着） |
| 一个邮箱 | 注册 Cloudflare 用 |
| **一个域名** | 唯一的必要开销。第 2 步给了三种拿法：**最推荐花 ¥5 买个纯数字 `.xyz`**，也可以完全白嫖 |
| 一台电脑 | 能上网、能打开网页就行，不需要服务器 |

> **总花费**：域名约 **¥5/年**（用免费域名则 ¥0），其余全免费。没有服务器费用、没有流量费。

> **为什么必须要域名？**
> Cloudflare 白送的 `xxx.workers.dev` 地址，在国内 **DNS 被污染，直连根本打不开**。
> 想让它在国内能用、能用上优选 IP，就必须绑一个自己的域名。绕不过去。

---

## 第 1 步：注册 Cloudflare 账号

1. 打开 <https://dash.cloudflare.com/sign-up>
2. 填**邮箱 + 密码** → 点 `Sign Up`
3. 去邮箱收验证邮件，点里面的链接激活

几分钟搞定，不需要信用卡。注册完停在后台首页别关，后面还要用。

> 界面是英文的。建议装个浏览器翻译插件，或者对照本文的中英文提示找按钮。

---

## 第 2 步：搞一个域名

三种拿法，按你的情况选一个。**只是想自用的话，选方案 A 就够了。**

### 方案 A：买个纯数字 `.xyz`（**推荐**，约 ¥5/年）

[Spaceship](https://www.spaceship.com)（域名注册商 Namecheap 旗下，ICANN 认证）对 **6~9 位纯数字的 `.xyz` 域名**有全网最低价：

| 项目 | 价格 |
|---|---|
| 首年 | **$0.67**（约 ¥5） |
| 续费 | 同样是几毛美元，**可以一次买 10 年锁定，总价约 $6.7** |
| 支付方式 | **支持支付宝** |

> ⚠️ **关键：必须是 6~9 位纯数字**，比如 `483920.xyz`。
> 带字母的普通 `.xyz` 首年也便宜（约 $1~2），但**续费会跳到 $12.52/年**，别买错。

**操作**：

1. 打开 <https://www.spaceship.com>，右上角注册账号
   > ⚠️ **注册时不要挂代理 / VPN** —— Spaceship 风控较严，挂代理可能被要求上传证件验证。
2. 搜索框输入一个 6~9 位数字（比如 `483920`），看到 `483920.xyz` 显示 **$0.67** 就对了
3. 加入购物车，**年限直接选 10 年** —— 总共约 $6.7，一劳永逸不用担心以后涨价
4. 结账时支付方式选 **Alipay（支付宝）**，扫码付款
5. 买完后**什么都别配**，直接进第 3 步（我们要把它的 DNS 交给 Cloudflare）

> 数字域名看着不体面，但这个地址**只有你自己用**，不用记、也不用发给人看 —— **便宜、不折腾才是重点**。

### 方案 B：白嫖免费域名（0 元）

[DigitalPlat FreeDomain](https://dash.domain.digitalplat.org) 提供免费二级域名，支持托管到 Cloudflare。

1. 打开 <https://dash.domain.digitalplat.org>，用 **GitHub 账号登录**（推荐，省一步验证）
2. 左侧菜单点 **`注册 / Register`**
3. 想一个前缀（比如 `ghraw`），选一个后缀，点 `检查可用性`
   - 可选后缀：`.dpdns.org`、`.qzz.io`、`.xx.kg`、`.us.kg`、`.qd.je`
   - 举例：`ghraw.dpdns.org`
4. 可注册的话，会弹出让你填 **NS 服务器** —— **先别填，去做第 3 步**，拿到 Cloudflare 给你的两个 NS 地址再回来填。
5. 填好后点 `注册`，等 5~30 分钟生效。

> 几个实话：
> - 这域名**不是你的资产**，是别人区域下的子域名，平台不做转让。**适合自用，不适合当品牌。**
> - 有效期 180 天，**到期前要手动续期**（免费）。平台一般会发邮件提醒 —— **忘了续期域名就没了，镜像跟着失效**。
> - 注册时如果你用了 `.us.kg` / `.xx.kg`，平台可能额外要一个密钥，按提示操作即可。
> - 免费平台**没有服务保证**，哪天停止运营也只能认。想省心还是选方案 A。

### 方案 C：在 Cloudflare 直接买（最省事，但需信用卡）

<https://dash.cloudflare.com> → 左侧 `Domain Registration` → `Register Domains`。

按成本价卖（`.com` 约 $10.46/年），**自动托管、省掉第 3 步**。缺点是**不支持支付宝**，需要信用卡或 PayPal，也比方案 A 贵不少。

买完直接跳到**第 4 步**。

---

## 第 3 步：把域名交给 Cloudflare 托管

> 用方案 C 的跳过这步。

1. 回到 Cloudflare 后台，点右上角 **`+ Add`** → **`Connect a domain`**（或左侧 `Websites` → `Add a site`）
2. 输入你的域名（**只填主域名**，不要 `www.` —— 比如填 `483920.xyz`；用免费域名则是 `ghraw.dpdns.org`）
3. 计划选 **`Free`**（免费计划，$0）→ `Continue`
4. 它会扫描一遍现有解析记录，直接点 `Continue` 跳过
5. **重点来了**：页面会给你两个地址，长这样

   ```
   xxxx.ns.cloudflare.com
   yyyy.ns.cloudflare.com
   ```

   **复制这两个地址。**

6. 去**域名的购买/注册平台**把它们填进 NS（名称服务器）设置：

   | 你的域名从哪来 | 去哪填 NS |
   |---|---|
   | DigitalPlat 免费域名 | 注册那个弹窗里的 `NS1` / `NS2` 输入框 |
   | Spaceship / NameSilo / Porkbun | 域名管理页找 `Nameservers` / `自定义 DNS`，选「使用自定义名称服务器」 |
   | 阿里云 / 腾讯云 | 域名控制台 → `DNS 修改` → 改成这两个地址 |

7. 回到 Cloudflare，点 `Done, check nameservers`。

**等生效**：一般 5~30 分钟，慢的话几个小时。期间 Cloudflare 域名的状态是 `Pending`，变成 **`Active`** 才算好。

> 能不能继续往下做？**可以**。第 4 步部署不依赖域名生效，你可以先把镜像搭好。

---

## 第 4 步：部署（三种方式）

**选一种就行，三种方式部署完效果完全一样**，区别只在「要不要 GitHub 账号」和「以后怎么更新代码」。

- **方式一：Workers** —— 复制粘贴，**只需要 Cloudflare 账号**，最省事，适合只想跑通就完事的人。
- **方式二：Pages** —— Fork 后连 Git，以后上游更新了点一下 `Sync fork` 就自动重部署。
- **方式三：Deploy 按钮** —— **一键部署**，需要 **GitHub + Cloudflare** 两个账号；不用复制粘贴、不用装东西，部署出来同样是 Worker。

> **为什么推荐方式一或方式三？** 因为第 6 步的「优选 IP」**只对 Workers 部署有效**，而方式一、方式三部署出来的都是 Worker —— **只有方式二（Pages）做不了优选**，国内可能不快。

### 方式一：Workers（复制粘贴）

1. 打开 **[Cloudflare 后台的 Workers & Pages](https://dash.cloudflare.com/?to=/:account/workers-and-pages)**（左侧菜单也叫 `Workers & Pages` / `Compute (Workers)`；**未登录会先让你登录，没有账号会引导你注册**）
2. 点 **`Create`** → 选 **`Create Worker`**（**不是** Pages）
3. 名字随便起，比如 `gh-raw-mirror` → 点 `Deploy`
4. 部署完点右上角 **`Edit code`**，进入在线编辑器
5. **把编辑器里原来的代码全选删掉**，粘贴下面这一整段：

```js
/**
 * cf-raw-mirror —— GitHub raw 加速镜像
 *
 * 同一份文件支持两种部署：
 *   · Cloudflare Workers：复制本文件全部内容，粘贴到 Workers 在线编辑器，Deploy。
 *   · Cloudflare Pages  ：Fork 仓库后连接 Git，构建命令 / 输出目录都留空。
 *                         Pages 会自动识别根目录的 _worker.js（advanced mode）并用它接管所有请求，
 *                         所以文件名必须是 _worker.js（这就是本文件这样命名的原因）。
 *
 * 用法（前缀式）：
 *   https://<你的域名>/https://raw.githubusercontent.com/owner/repo/ref/path/to/file.js
 *   也兼容省略协议：https://<你的域名>/raw.githubusercontent.com/owner/repo/ref/path/to/file.js
 *
 * 设计要点：
 *  - 流式转发（response.body 直接透传），不把文件读进内存 → CPU 占用极低，免费版 10ms 限制绰绰有余。
 *  - 用 Cache API 缓存 GET 结果：命中缓存时不再回源，既快又省回源带宽。
 *    · ref 是 40 位 commit sha（不可变）→ 长缓存 1 天
 *    · 分支名/tag（可变）→ 短缓存 5 分钟，避免拿到旧脚本
 *  - 只允许白名单主机，防止被当成任意站点的开放代理（这是被 Cloudflare 封号的主要原因）。
 *  - 可选：设置环境变量 TOKEN，则请求需带 ?token=xxx 或 X-Mirror-Token 头。
 *    （注意：「音源猎手」插件只做前缀拼接、带不了 token，给它用就别设 TOKEN。）
 */

const ALLOW_HOSTS = new Set([
  'raw.githubusercontent.com',
  'gist.githubusercontent.com',
  'gist.github.com',
  'objects.githubusercontent.com',
  'github.com'
])

const BRANCH_TTL = 300 // 秒：分支 / tag，可变
const SHA_TTL = 86400 // 秒：commit sha，不可变

function cors(h) {
  const o = new Headers(h)
  o.set('Access-Control-Allow-Origin', '*')
  o.set('Access-Control-Allow-Methods', 'GET,HEAD,OPTIONS')
  o.set('Access-Control-Allow-Headers', '*')
  return o
}

function text(msg, status) {
  return new Response(msg, { status, headers: cors({ 'Content-Type': 'text/plain; charset=utf-8' }) })
}

/** 判断 ref 是否是不可变的 commit sha（7~40 位十六进制） */
function isImmutableRef(ref) {
  return /^[0-9a-f]{7,40}$/i.test(ref)
}

export default {
  async fetch(request, env, ctx) {
    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors({}) })
    if (request.method !== 'GET' && request.method !== 'HEAD') return text('只支持 GET / HEAD', 405)

    // 鉴权（可选）
    if (env && env.TOKEN) {
      const u = new URL(request.url)
      const t = u.searchParams.get('token') || request.headers.get('X-Mirror-Token') || ''
      if (t !== env.TOKEN) return text('Forbidden', 403)
    }

    const raw = new URL(request.url)
    // 取出路径里内嵌的原始 URL：/https://raw.githubusercontent.com/...
    // 注意：不能把 Worker 自己的 query（如 ?token=）拼进目标地址
    let target = raw.pathname.replace(/^\/+/, '')

    // 打开首页 = 部署成功，给个自检提示（方便第一次部署时确认）
    if (!target) {
      return text([
        '✅ cf-raw-mirror 已部署成功',
        '',
        '用法： <本站域名>/<完整的 GitHub raw URL>',
        '示例： ' + raw.origin + '/https://raw.githubusercontent.com/zlyon/lx-hunter/main/plugin.json',
        '',
        '填进「音源猎手」插件：设置 → 网络 → raw 加速镜像 → 自定义… → ' + raw.origin,
        '注意：若本站是 *.workers.dev / *.pages.dev，国内直连大概率打不开，需要绑定自己的域名。'
      ].join('\n'), 200)
    }

    try { target = decodeURIComponent(target) } catch (e) { /* 已是明文则忽略 */ }
    if (!/^https?:\/\//i.test(target)) {
      // 也兼容不带协议的写法：/raw.githubusercontent.com/owner/repo/ref/path
      if (/^[a-z0-9.-]+\.[a-z]{2,}\//i.test(target)) target = 'https://' + target
      else return text('用法：/<完整的 GitHub raw URL>', 400)
    }

    let t
    try { t = new URL(target) } catch (e) { return text('目标 URL 无法解析', 400) }
    if (!ALLOW_HOSTS.has(t.hostname)) return text('不允许的主机：' + t.hostname, 403)

    // 缓存键：只按「目标 URL」缓存，忽略本 Worker 域名与鉴权参数
    const cacheKey = new Request(t.toString(), { method: 'GET' })
    const cache = caches.default

    let hit = null
    try { hit = await cache.match(cacheKey) } catch (e) { hit = null }
    if (hit) {
      const h = cors(hit.headers)
      h.set('X-Mirror-Cache', 'HIT')
      return new Response(hit.body, { status: hit.status, headers: h })
    }

    let upstream
    try {
      upstream = await fetch(t.toString(), {
        method: 'GET',
        headers: {
          'User-Agent': 'cf-raw-mirror/1.0',
          Accept: request.headers.get('Accept') || '*/*'
        },
        redirect: 'follow'
      })
    } catch (e) {
      return text('回源失败：' + (e && e.message ? e.message : e), 502)
    }

    const headers = cors(upstream.headers)
    headers.set('X-Mirror-Cache', 'MISS')

    // 只缓存成功且非流式内容；上游若已带 no-store 则尊重它
    const isFile = typeof t.pathname === 'string' && t.pathname.length > 1
    const ccUpstream = (upstream.headers.get('Cache-Control') || '').toLowerCase()
    if (request.method === 'GET' && upstream.ok && isFile && ccUpstream.indexOf('no-store') === -1) {
      const parts = t.pathname.split('/') // /owner/repo/ref/...
      const ref = parts.length > 3 ? parts[3] : ''
      const ttl = isImmutableRef(ref) ? SHA_TTL : BRANCH_TTL
      headers.set('Cache-Control', 'public, max-age=' + ttl)
      headers.set('CDN-Cache-Control', 'max-age=' + ttl)

      const toCache = new Response(upstream.body, { status: upstream.status, headers })
      ctx.waitUntil(cache.put(cacheKey, toCache.clone()).catch(() => {}))
      return toCache
    }

    // 不缓存的分支：直接透传
    return new Response(upstream.body, { status: upstream.status, headers })
  }
}
```

6. 点右上角 **`Deploy`**

> **改代码后一定要点 `Deploy`**，光按 Ctrl+S 只保存在编辑器里，不生效。

### 方式二：Pages（Fork 后连 Git）

1. 打开 <https://github.com/zlyon/cf-raw-mirror>，点右上角 **`Fork`**
2. Cloudflare 后台 → **`Workers & Pages`** → **`Create`** → **`Pages`** → **`Connect to Git`**
3. 授权后，选中你刚 Fork 的 `cf-raw-mirror` 仓库
4. 构建设置**全部留空**：

   | 设置项 | 填什么 |
   |---|---|
   | Framework preset（框架预设） | `None` |
   | Build command（构建命令） | **留空** |
   | Build output directory（输出目录） | **留空**（或填 `/`） |

5. 点 **`Save and Deploy`**，十几秒就完成

> **为什么不用构建？** 仓库根目录的 `_worker.js` 就是成品代码。Cloudflare Pages 有个「advanced mode」：只要输出目录里有 `_worker.js`，它会自动拿这个文件接管所有请求 —— 所以既不用编译，也不用改任何配置。**文件名必须叫 `_worker.js`，改名就不生效了。**
>
> **好处**：以后上游更新了，在你自己 Fork 的仓库点一下 **`Sync fork`**，Cloudflare 会自动重新部署，不用再复制粘贴。
>
> ⚠️ **但 Pages 有一个硬限制：做不了第 6 步的「优选 IP」。** Cloudflare 给 Pages 绑域名时不允许你关掉代理（橙云），而优选 IP 的前提正是「DNS 记录改成灰云 + 用 Workers 路由接管」。所以 **Pages 部署只能走 Cloudflare 分配的默认线路，国内访问可能不快**。如果你在意速度，**请用方式一（Workers）或方式三（Deploy 按钮）**。

### 方式三：Deploy 按钮（一键部署）

**前提：你需要有一个 [GitHub 账号](https://github.com/signup) 和一个 Cloudflare 账号。** 这是三种方式里**最省事**的 —— 不用复制粘贴、不用装任何东西，而且**部署出来同样是 Worker，第 6 步的优选 IP 照样能做**。

1. 打开仓库 <https://github.com/zlyon/cf-raw-mirror>，页面顶部就有一个 **Deploy to Cloudflare** 按钮，点它
   > 也可以直接用这个链接：<https://deploy.workers.cloudflare.com/?url=https://github.com/zlyon/cf-raw-mirror>
2. 按页面引导**登录 / 注册 Cloudflare**，并**授权 Cloudflare 访问你的 GitHub**
   > 没有 GitHub 账号的话，这一步会先让你去注册一个。
3. Cloudflare 会自动把仓库**复制一份到你的 GitHub 账号下**，并让你改仓库名 / Worker 名（随便起，比如 `cf-raw-mirror`）
4. 点 **`Deploy`** —— 它用 Cloudflare 的构建服务自动部署，**十几秒就完成**

**怎么确认成功**：回到 `Workers & Pages`，能看到一个新建好的 Worker 就成功了。后面的第 5 步（绑域名）、第 6 步（优选 IP）和方式一**完全一样**。

> **好处**：它在你 GitHub 里建的那份仓库**连着 Cloudflare**。以后想改代码，直接在 GitHub 上编辑提交，Cloudflare 会自动重新部署 —— 不用再复制粘贴。
>
> **代价**：必须有 GitHub 账号，并且要同意 Cloudflare 在**你的 GitHub 里建一个仓库**。不想给这个授权，就用方式一。

### 自测一下

用浏览器打开（把域名换成你实际拿到的）：

```
https://你的域名/https://raw.githubusercontent.com/zlyon/lx-hunter/main/plugin.json
```

- 返回一段 JSON → ✅ 正常
- 返回「✅ cf-raw-mirror 已部署成功」→ ✅ 正常（你打开的是首页，说明部署成功）
- **打不开也不用慌** —— 这正是国内直连 `workers.dev` / `pages.dev` 不通的表现，下一步绑域名就好了

---

## 第 5 步：绑域名，先让它跑通

先按「最简单的方式」跑通，再去做优选 —— 出问题时好定位。

1. `Workers & Pages` → 点进你刚建的项目 → **`Settings`（设置）** → **`Domains & Routes`（域和路由）**
   > Pages 部署的话，这一项叫 **`Custom domains`（自定义域）**，在 Pages 项目主页的标签栏里。
2. 点 **`Add`（添加）** → 选 **`Custom Domain`（自定义域）**
3. 填你想要的完整地址，比如 `gh.你的域名`（不是 `你的域名/gh`，是 `gh.xxx.com` 这种形式）
4. 点 `Add domain`，等 **1~5 分钟**（Cloudflare 要签证书）

**验证**：用浏览器打开

```
https://gh.你的域名/https://raw.githubusercontent.com/zlyon/lx-hunter/HEAD/plugin.json
```

- 能返回 JSON → **镜像和域名都没问题**，继续第 6 步提速。
- 报错 522 / 523 / 证书错误 → 再等几分钟；超过 10 分钟还有问题，回第 3 步确认域名状态是不是 `Active`。
- 返回 `不允许的主机：…` → 你测的 URL 不是 GitHub 的，属正常防护。
- 返回 `用法：/<完整的 GitHub raw URL>` → 少了 `/https://` 那一段，检查地址拼写。

**顺便验证一下 404 行为**（插件靠它判断文件存不存在，很关键）：把 URL 里的文件名改成一个不存在的，比如 `__nope__.json`，应该返回 **404** 和一行 `404: Not Found` 纯文本。**如果它返回 200 或一段 HTML，说明有问题，来反馈。**

---

## 第 6 步：换成「路由 + 优选 IP」（关键的一步）

到这一步，镜像已经能用了，但大概率**不快**：Cloudflare 默认分配给国内用户的入口 IP 经常很慢（实测同一域名、同一个 Worker，只换入口 IP，325KB 文件从 13 秒变成 0.5 秒）。

> **这一步只适用于 Workers 部署 —— 也就是方式一（复制粘贴）和方式三（Deploy 按钮）。**
> **方式二（Pages）做不了优选** —— Cloudflare 给 Pages 绑域名时强制走它自己的代理，代理开关不能自己控制，没有「路由」这个入口。想提速就得改用方式一或方式三（或者在第三方 DNS 上做分线路解析，很折腾，不推荐）。
> 另外提醒：可以先做完第 5 步、确认能用，再做这一步。

要提速就得换 IP。这里有两个坑必须先讲明白，否则你会白折腾：

### 坑一：橙色云会忽略你填的 IP

Cloudflare 里 **记录开着橙色云（代理）时，会忽略你写的 IP**，强行返回它自己的 IP —— 优选直接失效。

→ **必须用灰色云（仅 DNS / DNS only）。**

### 坑二：所以「自定义域」不能用，得换成「路由」

但第 5 步那个「自定义域」会自动建一条**橙色云**记录，跟灰色云冲突。

→ **把自定义域删掉，改用「路由（Route）」。**

**灰云 + 路由为什么还能跑？** 因为优选域名本身就解析到 Cloudflare 的机器，请求最终仍落到 Cloudflare 边缘；边缘看到请求里的 `Host: gh.你的域名`，认出这是你托管在 Cloudflare 的域名，再按路由规则交给你的 Worker。**前提是 CNAME 目标必须是 Cloudflare 网络里的域名**，指到别处就不会触发 Worker 了。

### 6.1 删掉自定义域

`Workers & Pages` → 你的 Worker → `Settings` → **`Domains & Routes`** → 在 **Custom Domains** 里把刚才那条 **删掉（Remove）**。

### 6.2 添加路由

同一页面 → **`Add` → `Route`（路由）**：

| 字段 | 填什么 |
|---|---|
| **Zone（区域）** | 选你的主域名，如 `ghraw.dpdns.org` |
| **Route（路由）** | `gh.你的域名/*`　← **末尾的 `/*` 必须带！** |

> 漏掉 `/*` 的话，只有根路径能通、子路径全 404，而插件走的就是子路径。

保存。

### 6.3 改 DNS，指向优选 IP

左侧菜单进你的域名 → **`DNS` → `Records`（记录）**：

1. **删掉**刚才自定义域留下的那条 `gh` 记录
2. **新增记录**，代理状态**必须关掉**（点一下那个橙色云图标，让它变成**灰色**，显示 `DNS only`）

内容有两种填法，见下。

#### 方法一：CNAME 到社区优选域名（省事，但靠运气）

类型选 `CNAME`，目标填社区维护的优选域名（**不要带 `https://`**）：

```
cdn.090227.xyz
```

同类还有 `cdn.091224.xyz` 等。这类域名会失效或变更，失效就换一个。

> **实测警告**：优选域名返回的是**一组 IP 的轮询池，好 IP 和坏 IP 混在一起**。同一域名、同一个 Worker，只换解析到的 IP，325KB 文件耗时能从 **0.45 秒** 到 **12 秒超时**不等。
> 所以这个方法属于「碰运气」—— 命中了飞快，运气差就卡死。**想要稳定，用方法二。**

#### 方法二：固定 A 记录（推荐，结果确定）

先加 **3 条 A 记录**提高冗余，解析时会随机命中其中之一：

| 类型 | 名称 | 内容 | 代理状态 |
|---|---|---|---|
| A | `gh` | `104.26.14.26` | 灰色（DNS only） |
| A | `gh` | `104.26.12.84` | 灰色（DNS only） |
| A | `gh` | `172.67.73.167` | 灰色（DNS only） |

这三个 IP 是 2026-10 实测**稳定快**的 Cloudflare 边缘 IP（325KB 文件 0.45 秒）。

> ⚠️ **这是别人线路上测出来的。Cloudflare 按客户端就近选点，你那里可能不一样。**
> 所以**填完一定要自己复测**（见 6.5）。如果你的网络下这几个 IP 也慢，就用 6.4 的方法自己扫几个。

### 6.4 自己扫出「你这台机器」的快 IP

**最准的办法**：在**跑 Songloft 的那台机器**上运行社区工具
[`XIU2/CloudflareSpeedTest`](https://github.com/XIU2/CloudflareSpeedTest)，
它会扫出你线路下最快的 Cloudflare IP，把结果里的**前 3 个**填成 A 记录即可。

**懒得装工具**的话，用下面的命令粗测（把域名和 IP 换成你的，多试几个 IP 挑快的）。

Windows（PowerShell，注意用 `curl.exe` 而不是 `curl`）：

```powershell
curl.exe -sS -o NUL -w "total=%{time_total}s size=%{size_download}\n" --resolve "gh.你的域名:443:104.26.14.26" "https://gh.你的域名/https://raw.githubusercontent.com/fengyvle/yyt-music-sources/main/sixyin.js"
```

Linux / NAS（把 `gh.你的域名` 换成你的，一次测一批）：

```bash
for ip in 104.26.14.26 104.26.12.84 172.67.73.167; do
  curl -o /dev/null -s -w "$ip  total=%{time_total}s  size=%{size_download}\n" \
    --resolve gh.你的域名:443:$ip \
    "https://gh.你的域名/https://raw.githubusercontent.com/fengyvle/yyt-music-sources/main/sixyin.js"
done
```

判断标准：**total 小于 2 秒、size 是完整大小（约 333000 字节）** 就是好 IP。
出现 12 秒超时、或者 size 明显偏小（截断），就是坏 IP，别用。

### 6.5 等生效 + 核验

等 **1~5 分钟**，然后检查解析：

```bash
nslookup gh.你的域名
```

- 方法一：解析结果**不再是** `104.21.14.38` / `172.67.157.179` 这类默认段，就说明生效了。
- 方法二：解析结果应该是你填的那三个 IP 之一。

再用插件本身的「测试」按钮复测一遍（第 7 步），那是最贴近真实使用场景的数据。

---

## 第 7 步：填进插件

「音源猎手」→ **设置** → **网络**：

1. **raw 加速镜像** 下拉选 **`自定义…`**
   > ⚠️ 别选「不使用镜像」—— 那样插件根本不会去读下面的输入框。
2. 下面出现的 **自定义镜像** 输入框，填 **`https://gh.你的域名`**
   - 建议带上 `https://`，末尾**不要**带斜杠
   - 只是自建镜像用的话，**别开 `强制代理`**，链路顺序保持：直连 → 代理 → 镜像
3. 点右边的 **`测试`** 按钮
   - 显示一个延迟数字就对了，这个数字就是真实拉取耗时
   - 几百毫秒 ~ 2 秒属正常；超过 3 秒或报错，回第 6 步换个 IP
4. 点 **保存**

---

## 第 8 步：出问题了对号入座

| 现象 | 原因 / 怎么办 |
|---|---|
| 浏览器打不开 `xxx.workers.dev` | 正常，国内被污染。绑了域名用自己域名访问 |
| 域名一直 `Pending` | NS 没填对，或还没生效。回第 3 步核对两个 NS 地址 |
| 访问报 522 / 523 / 证书错误 | 刚添加完，等 1~5 分钟；仍不行，确认域名状态是 `Active` |
| **改了代码不生效** | 没点 `Deploy` |
| **时快时慢、有时 12 秒超时** | 解析到了优选 IP 池里的坏 IP → 改用 **6.3 方法二：固定 A 记录** |
| 优选完全不起作用、还是老 IP | ① 用了「自定义域」而不是「路由」；② 记录忘了关橙色云 |
| 子路径全 404、只有根路径通 | 路由规则漏了末尾的 `/*` |
| 插件里点「测试」通过，但爬取没效果 | 你用的是 1.4.21 或更早，输入框没写 `https://`。补上或升级插件 |
| 返回 `不允许的主机：xxx` | 正常防护。你访问的 URL 不是 GitHub 的 |
| 某天突然变慢或不通 | ① 用了 CNAME 优选域名 → 它失效了，换一个；② 用了固定 IP → 该 IP 被限速了，重扫一个换上 |

---

## 附录：额度、注意事项、日常维护

### 总共要花多少钱

| 项目 | 费用 |
|---|---|
| Cloudflare 账号 | ¥0 |
| Worker（免费版） | ¥0 |
| Worker 流量 / 请求数 | ¥0（10 万次/天内，见下） |
| **域名** | **约 ¥5/年**（Spaceship 纯数字 `.xyz`，一次买 10 年约 $6.7）<br>用免费域名则是 ¥0 |
| **合计** | **约 ¥5/年**（摊下来每月 3 毛） |

**没有任何隐藏费用**：不需要服务器、不按流量计费、不用备案。

### 免费额度够不够用

Cloudflare Workers 免费版：**10 万次请求 / 天**（整个账号所有 Worker 合计，UTC 0 点重置）。

- **流量/带宽不限制、不计费**，响应体没有硬性上限。
- **CPU 时间限制 10 毫秒/次**，但**等待回源（下载文件）的时间不算**；纯转发的 Worker 只花 1~3 毫秒，绰绰有余。

换算一下：插件爬一轮大约向镜像发 **100~400 次**请求。

| 使用场景 | 每天请求数 | 结论 |
|---|---|---|
| 只有你自己用 | 几千次 | ✅ 完全够 |
| 公开做成插件内置镜像，100 个用户各爬 3 轮 | 3~12 万次 | ❌ 会打满，超限后当天报 `Error 1027` |

**所以：自己用放心用；想公开给别人用，得先上 Workers Paid（$5/月，1000 万次/月）或自建服务器。**

### 三个必须知道的安全提醒

1. **不要设 `TOKEN` 环境变量**。插件的拼接方式是「镜像域名 + 完整原始 URL」，**带不了 token**，你一设就是全部请求 403。代码里的鉴权功能留着备用就行。
2. **不要把它改成转发任意网站的代理**。代码里的 `ALLOW_HOSTS` 白名单是故意加的 —— 变成开放代理是被 Cloudflare 封号的头号原因。
3. **别拿它代理视频 / 大文件**。Cloudflare 免费版条款限制把 CDN 用于非 HTML 内容的过度分发。代理代码文件（脚本、JSON）完全没问题，代理影视资源有风险。

### 日常维护（几乎不用管）

- **免费域名记得续期**：DigitalPlat 的域名 180 天到期，免费续，但**要手动点**，别让它过期。
- **固定 A 记录的 IP 会随时间劣化**（CF 调线路、运营商改路由）。**建议一两个月重测一次**，慢了就换。
- **代码更新**：方式一（复制粘贴）→ 从仓库复制新版 `_worker.js` 粘贴后点 `Deploy`；方式二（Pages）→ 在你自己 Fork 的仓库点一次 `Sync fork` 就自动重部署；方式三（Deploy 按钮）→ 在你账号下那份仓库里改完提交，Cloudflare 会自动重部署。
- **脚本缓存**：Worker 内对**分支名/tag** 缓存 5 分钟，对**commit sha** 缓存 1 天。所以刚推送的新脚本可能 5 分钟后才拿到，属正常。
- **想看用量**：Cloudflare 后台 → `Workers & Pages` → 你的 Worker → `Metrics`，能看到请求数和命中率。

---

## 一句话总结

**注册 Cloudflare → 弄个域名并交给 Cloudflare 托管 → 部署（方式一复制粘贴；有 GitHub 就用方式三一键部署）→ 删自定义域、加路由、把 DNS 改成灰色云并指向快 IP → 填进插件。**

> **方式一 和 方式三 都是 Worker 部署，都能做优选 IP。** 只有方式二（Pages）做不了优选、国内可能不快，取舍见第 4 步的说明。

卡在哪一步都可以直接把现象发出来，附上当时的截图。
