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
