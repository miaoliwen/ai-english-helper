import MarkdownIt from 'markdown-it'
import katex from 'katex'
import DOMPurify from 'dompurify'

const md = new MarkdownIt({
  html: false,
  linkify: true,
  typographer: true,
  breaks: true
})

// 注意：之前曾注册一个空的 uponSanitizeElement hook（误以为在配置白名单），
// 该 hook 没有任何作用但造成维护困惑，故移除。DOMPurify 默认会保留 ALLOWED_ATTR
// 中显式允许的 class（KaTeX 渲染的 .katex/.math-normal 等会保留）。

const PURIFY_CONFIG: DOMPurify.Config = {
  ALLOWED_TAGS: [
    'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
    'p', 'br', 'hr',
    'ul', 'ol', 'li',
    'blockquote', 'pre', 'code',
    'strong', 'em', 'del', 's',
    'a', 'img',
    'table', 'thead', 'tbody', 'tr', 'th', 'td',
    'span', 'div',
    'sub', 'sup', 'abbr',
    'details', 'summary'
  ],
  ALLOWED_ATTR: [
    'href', 'target', 'rel',
    'src', 'alt', 'title',
    'class', 'id',
    'aria-*',
    'style',
    'align',
    'colspan', 'rowspan'
  ],
  ALLOW_DATA_ATTR: false
}

const defaultValidateLink = md.validateLink
md.validateLink = (url: string) => {
  const normalized = url.trim().toLowerCase()
  // 显式禁止的协议：javascript / vbscript / data / file
  if (normalized.startsWith('javascript:')) return false
  if (normalized.startsWith('vbscript:')) return false
  if (normalized.startsWith('data:')) return false
  if (normalized.startsWith('file:')) return false
  return defaultValidateLink(url)
}

// 为所有外链强制加上安全属性，防止 target=_blank 时的 tabnabbing
// 与 referrer 泄漏。markdown-it 默认不强制这些。
const defaultLinkOpen = md.renderer.rules.link_open ||
  function (tokens, idx, options, _env, self) {
    return self.renderToken(tokens, idx, options)
  }
md.renderer.rules.link_open = function (tokens, idx, options, env, self) {
  const token = tokens[idx]
  const href = token.attrGet('href') || ''
  // 内部锚点 / 相对路径不强制新窗口
  if (/^https?:\/\//i.test(href)) {
    token.attrSet('rel', 'noopener noreferrer nofollow')
    token.attrSet('target', '_blank')
  }
  return defaultLinkOpen(tokens, idx, options, env, self)
}

// 渲染前限制单次渲染长度，防止超大文档阻塞主线程
const MAX_RENDER_LENGTH = 200_000 // ~200KB

export function renderMarkdown(content: string): string {
  let processed = content || ''

  if (processed.length > MAX_RENDER_LENGTH) {
    processed = processed.slice(0, MAX_RENDER_LENGTH) + '\n\n*（内容过长，已截断）*'
  }

  processed = processed.replace(/\$\$([\s\S]*?)\$\$/g, (match, latex) => {
    try {
      return katex.renderToString(latex.trim(), { displayMode: true, throwOnError: false })
    } catch {
      return match
    }
  })

  processed = processed.replace(/\$([^$\n]+)\$/g, (match, latex) => {
    try {
      return katex.renderToString(latex.trim(), { displayMode: false, throwOnError: false })
    } catch {
      return match
    }
  })

  const html = md.render(processed)
  // 使用 DOMPurify 清理 HTML，替代手写正则
  return DOMPurify.sanitize(html, { ALLOWED_TAGS: PURIFY_CONFIG.ALLOWED_TAGS, ALLOWED_ATTR: PURIFY_CONFIG.ALLOWED_ATTR, ALLOW_DATA_ATTR: false })
}

export function extractTextFromMarkdown(markdown: string): string {
  return markdown
    .replace(/<[^>]+>/g, '')
    .replace(/#{1,6}\s/g, '')
    .replace(/\*\*|\*|__|\_/g, '')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/!\[([^\]]*)\]\([^)]+\)/g, '')
    .replace(/`{3}[\s\S]*?`{3}/g, '')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/\$\$?[\s\S]*?\$\$?/g, '')
    .trim()
}
