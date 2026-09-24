import type { QuestionType, WordRecord } from '../types'

/**
 * 一道题目。`choices` 为 null 表示需要键盘输入（拼写/填空）。
 */
export interface Question {
  type: QuestionType
  prompt: string
  choices: string[] | null
  answer: string
  wordId: string
  word: string
}

/** Fisher-Yates 洗牌（返回新数组）。 */
function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j] as T, a[i] as T]
  }
  return a
}

/** 根据复习次数与词条字段选择题型。 */
export function pickQuestionType(
  reviewCount: number,
  word: WordRecord,
): QuestionType {
  const hasCollocations = (word.collocations?.length ?? 0) > 0
  const hasExamples = (word.senses[0]?.examples?.length ?? 0) > 0

  if (reviewCount <= 1) return 'cn2en'
  if (reviewCount <= 3) {
    return Math.random() < 0.5 ? 'en2cn' : 'listening'
  }
  // 第 4 次以后：拼写、填空、搭配
  const options: QuestionType[] = ['spelling']
  if (hasExamples) options.push('cloze')
  if (hasCollocations) options.push('collocation')
  return options[Math.floor(Math.random() * options.length)] as QuestionType
}

/** 从同词库池中挑 3 个干扰项（同词性优先，排除同义）。 */
export function pickDistractors(
  target: WordRecord,
  pool: WordRecord[],
  count = 3,
): WordRecord[] {
  const targetCn = target.senses[0]?.definition_cn ?? ''
  const candidates = pool.filter((w) => {
    if (w.id === target.id) return false
    const cn = w.senses[0]?.definition_cn ?? ''
    return cn !== targetCn // 排除高度同义
  })

  const samePos = candidates.filter((w) => w.pos === target.pos)
  const rest = candidates.filter((w) => w.pos !== target.pos)
  const picked = shuffle(samePos).concat(shuffle(rest)).slice(0, count)
  return picked
}

function firstCn(word: WordRecord): string {
  return word.senses[0]?.definition_cn ?? word.word
}

function firstExample(word: WordRecord): { en: string; cn: string } | null {
  return word.senses[0]?.examples?.[0] ?? null
}

/**
 * 生成一道题目。
 * @param type 题型
 * @param word 目标词
 * @param pool 同词库干扰项池（不含目标词者更佳）
 */
export function generateQuestion(
  type: QuestionType,
  word: WordRecord,
  pool: WordRecord[],
): Question {
  const cn = firstCn(word)
  const base = { wordId: word.id, word: word.word }

  switch (type) {
    case 'cn2en': {
      const distractors = pickDistractors(word, pool)
      const choices = shuffle([
        word.word,
        ...distractors.map((w) => w.word),
      ])
      return {
        type,
        prompt: cn,
        choices,
        answer: word.word,
        ...base,
      }
    }
    case 'en2cn': {
      const distractors = pickDistractors(word, pool)
      const choices = shuffle([
        cn,
        ...distractors.map((w) => firstCn(w)),
      ])
      return {
        type,
        prompt: word.word,
        choices,
        answer: cn,
        ...base,
      }
    }
    case 'listening': {
      const distractors = pickDistractors(word, pool)
      const choices = shuffle([
        cn,
        ...distractors.map((w) => firstCn(w)),
      ])
      return {
        type,
        prompt: '听发音，选出正确释义', // 界面同时触发 TTS
        choices,
        answer: cn,
        ...base,
      }
    }
    case 'spelling': {
      return {
        type,
        prompt: cn,
        choices: null,
        answer: word.word,
        ...base,
      }
    }
    case 'cloze': {
      const ex = firstExample(word)
      const sentence = ex
        ? ex.en.replace(new RegExp(`\\b${word.word}\\b`, 'i'), '______')
        : `${cn}（请输入单词）`
      return {
        type,
        prompt: sentence,
        choices: null,
        answer: word.word,
        ...base,
      }
    }
    case 'collocation': {
      const collocations = word.collocations ?? []
      const correct = collocations[0] ?? word.word
      const others = pool
        .flatMap((w) => w.collocations ?? [])
        .filter((c) => c && c !== correct)
      const distractors = shuffle(others).slice(0, 3)
      const choices = shuffle([correct, ...distractors])
      return {
        type,
        prompt: `选出「${word.word}」的正确搭配`,
        choices,
        answer: correct,
        ...base,
      }
    }
  }
}

/** 判断拼写是否匹配（忽略大小写与首尾空格）。 */
export function isSpellingCorrect(input: string, answer: string): boolean {
  return input.trim().toLowerCase() === answer.trim().toLowerCase()
}