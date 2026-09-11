import jschardet from 'jschardet'

export interface DetectionResult {
  encoding: string
  confidence: number
  usedBom: boolean
}

/** 预览页可手动切换的编码列表 */
export const SUPPORTED_ENCODINGS = [
  'UTF-8',
  'GBK',
  'GB18030',
  'UTF-16LE',
  'UTF-16BE',
  'Big5',
]

const BOM_UTF8 = [0xef, 0xbb, 0xbf]
const BOM_UTF16LE = [0xff, 0xfe]
const BOM_UTF16BE = [0xfe, 0xff]

function startsWith(bytes: Uint8Array, marker: number[]): boolean {
  if (bytes.length < marker.length) return false
  return marker.every((b, i) => bytes[i] === b)
}

/** 把 jschardet 的编码名归一化为 TextDecoder 支持的 label */
function normalizeEncoding(raw: string): string {
  const up = raw.toUpperCase()
  if (up === 'GB2312' || up === 'GBK') return 'GBK'
  if (up === 'GB18030') return 'GB18030'
  if (up === 'BIG5' || up === 'BIG-5') return 'Big5'
  if (up.startsWith('UTF-16')) return 'UTF-16LE'
  if (up.includes('UTF') || up === 'ASCII' || up === 'WINDOWS-1252') return 'UTF-8'
  return 'UTF-8'
}

/** 检测编码：BOM 优先，否则 jschardet 前 4KB，置信度 <0.7 回退 UTF-8 */
export function detectEncoding(bytes: Uint8Array): DetectionResult {
  if (startsWith(bytes, BOM_UTF8)) return { encoding: 'UTF-8', confidence: 1, usedBom: true }
  if (startsWith(bytes, BOM_UTF16LE)) return { encoding: 'UTF-16LE', confidence: 1, usedBom: true }
  if (startsWith(bytes, BOM_UTF16BE)) return { encoding: 'UTF-16BE', confidence: 1, usedBom: true }

  const sample = bytes.slice(0, 4096)
  const result = jschardet.detect(sample)
  const encoding = normalizeEncoding(result.encoding ?? 'UTF-8')
  const confidence = result.confidence ?? 0
  if (confidence < 0.7) return { encoding: 'UTF-8', confidence, usedBom: false }
  return { encoding, confidence, usedBom: false }
}

/** 用指定编码把字节解码为字符串 */
export function decodeBytes(bytes: Uint8Array, encoding: string): string {
  let data = bytes
  if (encoding === 'UTF-16LE' && startsWith(bytes, BOM_UTF16LE)) {
    data = bytes.slice(2)
  } else if (encoding === 'UTF-16BE' && startsWith(bytes, BOM_UTF16BE)) {
    data = bytes.slice(2)
  }
  try {
    return new TextDecoder(encoding).decode(data)
  } catch {
    return new TextDecoder('UTF-8').decode(data)
  }
}