import { marked } from 'marked'

interface MarkdownPreviewProps {
  content: string
}

export default function MarkdownPreview({ content }: MarkdownPreviewProps) {
  const html = marked.parse(content, { async: false }) as string
  return (
    <div
      className="prose prose-invert prose-xs max-w-none text-xs text-white/70 [&_h1]:text-sm [&_h2]:text-xs [&_h3]:text-xs [&_ul]:list-disc [&_ol]:list-decimal [&_li]:ml-4 [&_code]:text-blue-300/70 [&_pre]:bg-white/5 [&_pre]:rounded [&_blockquote]:border-l-2 [&_blockquote]:border-blue-400/40 [&_blockquote]:pl-3"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  )
}
