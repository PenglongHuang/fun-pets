// src/renderer/src/lib/block-parser.ts

export type BlockType = 'heading' | 'paragraph' | 'list' | 'code' | 'blockquote' | 'table' | 'hr' | 'html'

export interface Block {
  type: BlockType
  content: string
  startLine: number
  endLine: number
}

const codeFenceRegex = /^(`{3,}|~{3,})/
const headingRegex = /^#{1,6}\s/
const hrRegex = /^(-{3,}|\*{3,}|_{3,})(\s*)$/
const tableRegex = /^\|(.+)\|$/
const blockquoteRegex = /^>\s?/
const listRegex = /^(\s*)([-*+]|\d+\.)\s/

export function parseBlocks(source: string): Block[] {
  const lines = source.split('\n')
  const blocks: Block[] = []
  let i = 0

  while (i < lines.length) {
    const line = lines[i]

    // Empty lines
    if (line.trim() === '') {
      i++
      continue
    }

    // Fenced code block
    const fenceMatch = codeFenceRegex.exec(line)
    if (fenceMatch) {
      const startLine = i
      const fenceChar = fenceMatch[1][0]  // ` or ~
      const fenceLen = fenceMatch[1].length
      i++
      while (i < lines.length) {
        const closingMatch = codeFenceRegex.exec(lines[i])
        if (closingMatch && closingMatch[1][0] === fenceChar && closingMatch[1].length >= fenceLen) break
        i++
      }
      if (i < lines.length) i++ // closing fence
      blocks.push({ type: 'code', content: lines.slice(startLine, i).join('\n'), startLine, endLine: i - 1 })
      continue
    }

    // Heading
    if (headingRegex.test(line)) {
      blocks.push({ type: 'heading', content: line, startLine: i, endLine: i })
      i++
      continue
    }

    // Horizontal rule
    if (hrRegex.test(line)) {
      blocks.push({ type: 'hr', content: line, startLine: i, endLine: i })
      i++
      continue
    }

    // Table (collect consecutive table lines)
    if (tableRegex.test(line)) {
      const startLine = i
      while (i < lines.length && tableRegex.test(lines[i])) i++
      blocks.push({ type: 'table', content: lines.slice(startLine, i).join('\n'), startLine, endLine: i - 1 })
      continue
    }

    // Blockquote
    if (blockquoteRegex.test(line)) {
      const startLine = i
      while (i < lines.length && (blockquoteRegex.test(lines[i]) || lines[i].trim() === '')) i++
      blocks.push({ type: 'blockquote', content: lines.slice(startLine, i).join('\n'), startLine, endLine: i - 1 })
      continue
    }

    // List
    if (listRegex.test(line)) {
      const startLine = i
      while (i < lines.length && (listRegex.test(lines[i]) || (lines[i].trim() !== '' && !headingRegex.test(lines[i]) && !codeFenceRegex.test(lines[i]) && !blockquoteRegex.test(lines[i])))) {
        i++
        // Stop if we hit an empty line followed by a non-list line
        if (i < lines.length && lines[i].trim() === '') {
          if (i + 1 < lines.length && !listRegex.test(lines[i + 1])) break
          i++
        }
      }
      blocks.push({ type: 'list', content: lines.slice(startLine, i).join('\n'), startLine, endLine: i - 1 })
      continue
    }

    // Paragraph (collect until empty line or block element)
    {
      const startLine = i
      while (i < lines.length && lines[i].trim() !== '' && !headingRegex.test(lines[i]) && !codeFenceRegex.test(lines[i]) && !hrRegex.test(lines[i]) && !blockquoteRegex.test(lines[i]) && !listRegex.test(lines[i])) {
        i++
      }
      blocks.push({ type: 'paragraph', content: lines.slice(startLine, i).join('\n'), startLine, endLine: i - 1 })
    }
  }

  return blocks
}

/**
 * Replace a block's content in the source string using line-splice.
 * This avoids stale line-index issues — it operates on the current source
 * and current block positions, then re-parse happens on the next render.
 */
export function replaceBlockInSource(source: string, block: Block, newContent: string): string {
  const lines = source.split('\n')
  const newLines = newContent.split('\n')
  lines.splice(block.startLine, block.endLine - block.startLine + 1, ...newLines)
  return lines.join('\n')
}
