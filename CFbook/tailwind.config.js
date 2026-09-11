/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: 'var(--bg)',
        nav: 'var(--nav-bg)',
        'bg-alt': 'var(--bg-alt)',
        surface: 'var(--surface)',
        ink: 'var(--text)',
        dim: 'var(--text-dim)',
        faint: 'var(--text-faint)',
        line: 'var(--border)',
        'line-hi': 'var(--border-hi)',
        accent: 'var(--accent)',
        'accent-dim': 'var(--accent-dim)',
        'accent-soft': 'var(--accent-bg)',
        'accent-text': 'var(--accent-text)',
      },
      fontFamily: {
        sans: ['Geist', '-apple-system', 'BlinkMacSystemFont', 'PingFang SC', 'Microsoft YaHei', 'sans-serif'],
        serif: ['Newsreader', 'Noto Serif SC', 'Songti SC', 'STSong', 'SimSun', 'Georgia', 'serif'],
        mono: ['Geist Mono', 'JetBrains Mono', 'Menlo', 'monospace'],
      },
      borderRadius: {
        card: '12px',
        btn: '8px',
        tag: '6px',
      },
      boxShadow: {
        card: '0 1px 2px rgba(17,17,17,0.04), 0 8px 24px rgba(17,17,17,0.06)',
        toolbar: '0 8px 32px rgba(17,17,17,0.12)',
        drawer: '0 16px 48px rgba(17,17,17,0.18)',
      },
    },
  },
  plugins: [],
}