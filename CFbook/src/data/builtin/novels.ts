import type { Novel } from '@/types'

interface DemoSeed {
  id: string
  title: string
  author: string
  category: string
  tags: string[]
  intro: string
  status: Novel['status']
  rating: number
  chapterCount: number
  updatedAt: string
}

/** demo 书种子：覆盖 5 大分类，≥2 本已完结，每本 ≥30 章 */
const SEEDS: DemoSeed[] = [
  {
    id: 'demo-shenwu',
    title: '神武纪元',
    author: '陈风',
    category: '玄幻',
    tags: ['热血', '成长'],
    intro: '旧神陨落千年后，一个被视作废物的少年，在废弃祭坛上唤醒了沉睡的神武血脉。自此，他踏上一条逆天改命的修行之路。',
    status: 'serializing',
    rating: 9.1,
    chapterCount: 40,
    updatedAt: '2026-08-30T00:00:00.000Z',
  },
  {
    id: 'demo-yecheng',
    title: '夜城旧事',
    author: '陈风',
    category: '都市',
    tags: ['现实', '治愈'],
    intro: '失意的青年回到阔别十年的故乡小城，在一间深夜书店里，遇见了形形色色的人，也重新拾起了被遗忘的旧时光。',
    status: 'completed',
    rating: 8.7,
    chapterCount: 35,
    updatedAt: '2026-07-12T00:00:00.000Z',
  },
  {
    id: 'demo-chunri',
    title: '春日迟迟',
    author: '陈风',
    category: '言情',
    tags: ['双向奔赴', '慢热'],
    intro: '她是名不见经传的古画修复师，他是光环加身的建筑设计师。一场意外的合作，让两颗原本相隔遥远的心，慢慢靠近。',
    status: 'completed',
    rating: 8.9,
    chapterCount: 32,
    updatedAt: '2026-06-05T00:00:00.000Z',
  },
  {
    id: 'demo-anwu',
    title: '暗雾追凶',
    author: '陈风',
    category: '悬疑',
    tags: ['推理', '复仇'],
    intro: '雾都连续发生离奇命案，唯一的线索是一枚多年前的旧怀表。刑警队长抽丝剥茧，却发现自己正一步步走进别人布下的局。',
    status: 'serializing',
    rating: 8.6,
    chapterCount: 38,
    updatedAt: '2026-09-02T00:00:00.000Z',
  },
  {
    id: 'demo-xinghai',
    title: '星海彼岸',
    author: '陈风',
    category: '科幻',
    tags: ['星际', '冒险'],
    intro: '人类首艘曲率飞船启航，目的地是四百光年外的宜居行星。漫长的航程中，船员们发现这趟旅程远比想象中更加危险。',
    status: 'completed',
    rating: 9.0,
    chapterCount: 36,
    updatedAt: '2026-05-22T00:00:00.000Z',
  },
  {
    id: 'demo-cangming',
    title: '苍冥之上',
    author: '陈风',
    category: '玄幻',
    tags: ['修仙', '传奇'],
    intro: '天道崩坏，苍冥界陷入动乱。一个被逐出师门的剑修，带着半卷残缺剑诀，在乱世中辟出一条属于自己的通天之路。',
    status: 'serializing',
    rating: 8.8,
    chapterCount: 41,
    updatedAt: '2026-08-18T00:00:00.000Z',
  },
]

/** 单章字数估算（用于书架展示，实际正文按确定性算法生成） */
const WORDS_PER_CHAPTER = 1200

function buildNovel(seed: DemoSeed): Novel {
  return {
    id: seed.id,
    title: seed.title,
    author: seed.author,
    cover: '',
    intro: seed.intro,
    tags: seed.tags,
    category: seed.category,
    status: seed.status,
    wordCount: seed.chapterCount * WORDS_PER_CHAPTER,
    chapterCount: seed.chapterCount,
    updatedAt: seed.updatedAt,
    rating: seed.rating,
    source: 'demo',
  }
}

export const DEMO_NOVELS: Novel[] = SEEDS.map(buildNovel)

const MAP = new Map(DEMO_NOVELS.map((n) => [n.id, n]))

export function getDemoNovel(id: string): Novel | null {
  return MAP.get(id) ?? null
}

export function getDemoChapterCount(id: string): number {
  return MAP.get(id)?.chapterCount ?? 0
}