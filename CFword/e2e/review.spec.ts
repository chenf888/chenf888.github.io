import { test, expect } from '@playwright/test'

test('首页加载并显示词库列表', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByText('NGSL 核心英语')).toBeVisible()
  await expect(page.getByText('CET-4 大学英语四级')).toBeVisible()
})

test('从首页进入复习流程', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('button', { name: /NGSL 核心英语/ }).click()

  // 新卡先展示完整词卡与「开始学习」按钮
  await expect(page.getByRole('button', { name: '开始学习' })).toBeVisible()
  await page.getByRole('button', { name: '开始学习' }).click()

  // 进入主动回忆题后应出现选项或输入框
  await expect(page.locator('.review__card button, .review__card input').first()).toBeVisible()
})

test('设置页可打开', async ({ page }) => {
  await page.goto('/#/settings')
  await expect(page.getByText('每日新卡上限')).toBeVisible()
})