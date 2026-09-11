export interface ReaderTheme {
  key: string
  label: string
  bg: string
  text: string
  dim: string
  border: string
}

/** 阅读器 5 套主题，与主页暖色/朱红基调保持一致视觉层级 */
export const READER_THEMES: ReaderTheme[] = [
  { key: 'light', label: '明亮', bg: '#FFFFFF', text: '#1F2329', dim: '#8A9099', border: '#EDEFF2' },
  { key: 'sepia', label: '羊皮纸', bg: '#F5EFE0', text: '#4A3F2F', dim: '#8A7A5F', border: '#E3D9C4' },
  { key: 'green', label: '护眼', bg: '#E3EDE3', text: '#2F3A2F', dim: '#6B7A6B', border: '#D2E0D2' },
  { key: 'gray', label: '灰调', bg: '#E8E8E8', text: '#2B2B2B', dim: '#7A7A7A', border: '#D6D6D6' },
  { key: 'dark', label: '夜间', bg: '#121212', text: '#B8B8B8', dim: '#7A7A7A', border: '#2A2A2A' },
]

export function getReaderTheme(key: string): ReaderTheme {
  return READER_THEMES.find((t) => t.key === key) ?? READER_THEMES[0]
}