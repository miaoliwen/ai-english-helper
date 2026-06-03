import MarkdownIt from 'markdown-it'
import katex from 'katex'

const md = new MarkdownIt({
  html: true,
  linkify: true,
  typographer: true,
  breaks: true
})

export function renderMarkdown(content: string): string {
  let processed = content

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

  return md.render(processed)
}

export function extractTextFromMarkdown(markdown: string): string {
  return markdown
    .replace(/#{1,6}\s/g, '')
    .replace(/\*\*|\*|__|\_/g, '')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/!\[([^\]]*)\]\([^)]+\)/g, '')
    .replace(/`{3}[\s\S]*?`{3}/g, '')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/\$\$?[\s\S]*?\$\$?/g, '')
    .trim()
}