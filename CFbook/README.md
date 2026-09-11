# CFbook · 陈风的书架

个人小说发布与阅读站（纯前端 / 移动端优先）。作者原创小说随构建打包进站，读者打开即读；另保留读者导入本地 TXT 的附加能力。数据仅保存在本地浏览器，无后端、无在线书源。

## 关于本站

这是陈风的个人小说发布站。所有小说为作者原创，读者打开即读，无需注册、无需导入。

### 阅读方式

首页选书 → 详情页 → 「开始阅读」。支持 5 套主题、4 种翻页方式、字号 / 行距 / 字体等自定义；阅读进度自动保存在浏览器，下次打开自动恢复。

### 导入自己的 TXT（可选）

本站支持导入你合法拥有的 TXT，数据仅存本地浏览器，不上传服务器。

- 支持：TXT（推荐 UTF-8 或 GBK）；不支持 EPUB / PDF / MOBI。
- 步骤：书架页右上「导入」→ 选文件（建议 ≤20MB，最大 50MB）→ 自动或手选编码 → 预览章节可改元信息 → 确认 → 自动加入书架。
- 分章：优先识别「第一章 风起」「第 12 节」「第三卷」「第十二回」；识别不到按每 3000 字兜底并在预览页提示。
- 存储：设置 / 进度 / 书架存 localStorage；导入书正文存 IndexedDB；换设备 / 清缓存 / 无痕会丢失。

### 免责声明

本站为个人原创小说发布，不提供任何在线书源。导入功能仅供读者导入自己合法拥有的文本，作者不承担因读者导入内容产生的任何责任。

## 技术栈

| 依赖 | 版本 | 用途 |
|-|-|-|
| node | ≥18.18 | engines |
| react / react-dom | ^18.3.1 | UI 框架 |
| react-router-dom | ^6.26.2 | createHashRouter |
| zustand | ^4.5.5 | 状态管理（persist） |
| tailwindcss | ^3.4.13 | 样式（含 postcss / autoprefixer） |
| lucide-react | ^0.441.0 | 图标 |
| clsx | ^2.1.1 | 类名拼接 |
| idb | ^8.0.0 | IndexedDB 封装 |
| jschardet | ^3.1.4 | 编码检测 |
| vite | ^5.4.8 | 构建（含 @vitejs/plugin-react） |
| vite-plugin-static-copy | ^1.0.6 | 复制预置 TXT / 封面到 dist |
| typescript | ^5.6.2 | strict |

约束：不引入 UI 库 / 动画库 / Dexie / EPUB 库；样式统一 Tailwind；别名 `@/` → `src/`。

## 本地开发

```bash
cd CFbook
npm install
npm run dev       # 本地开发
npm run build     # 类型检查 + 构建（无类型错误方可通过）
npm run preview   # 预览构建产物
npm run lint      # ESLint（--max-warnings 0）
```

## 如何添加 / 更新小说

1. 新 TXT 放到 `src/novels/texts/`（如 `my-novel.txt`）。
2. 在 `src/novels/manifest.json` 增加条目（`textFile` 指向 TXT 文件名）。
3. （可选）封面放到 `src/novels/covers/`，`manifest.json` 填 `coverFile`；推荐 600×800 的 WebP/JPG，单张 <200KB。
4. `git add . && git commit && git push`。
5. Actions 自动构建部署，1~2 分钟生效，读者刷新即可见。

预置 TXT 不进入 JS bundle，运行时按需 `fetch`；资源 URL 一律用 `import.meta.env.BASE_URL` 拼接，禁止硬编码 `/novels/...`。

## 如何部署 GitHub Pages

- 仓库 `chenf888.github.io` 为 GitHub 用户页，主页静态文件在根，CFbook 部署在 `/CFbook/` 子路径。
- 工作流 `.github/workflows/deploy.yml` 会构建 CFbook 并把主页与 `/CFbook/` 合并部署。
- 仓库设置 `Settings → Pages → Source` 选择 **GitHub Actions**。
- 推送 `main` 后自动构建部署，访问 `https://chenf888.github.io/CFbook/`。
- HashRouter 保证刷新子路径不 404；`public/404.html` 提供兜底跳转。

## 目录说明

```
CFbook/
  src/
    main.tsx / App.tsx         入口与根组件
    router/index.tsx           createHashRouter + 路由级代码分割
    types/index.ts             类型定义
    constants/index.ts         常量（分类 / 存储键 / 主题 / 导入限制）
    db/                        IndexedDB（bookRepo / chapterRepo / estimate）
    services/
      importer/                TXT 导入（编码 / 解析 / 分章 / 元信息 / 进度）
      preset/loader.ts         预置书按需加载
    store/                     readerStore / bookStore / uiStore（zustand）
    data/index.ts              唯一数据出口（preset / demo / imported 分流）
    data/builtin/              demo 演示书（确定性生成）
    novels/                    ★ 作者小说：manifest.json + texts/ + covers/
    hooks/                     useSwipe / useReadingProgress / useKeyboardPage 等
    components/                common/ book/ import/ reader/
    pages/                     ShelfPage / NovelDetailPage / ReaderPage /
                               ImportedBooksPage / NotFoundPage
    utils/                     格式化 / 分页 / 文本 / ID / 存储
    styles/                    globals.css + themes.ts
  public/404.html
  index.html / vite.config.ts / tsconfig*.json / tailwind.config.js / ...
```

## 功能清单

- 书架：7 分类筛选、搜索（300ms 防抖）、继续阅读、网格 / 列表视图、下拉刷新。
- 详情：封面信息、简介展开收起、加 / 移书架、章节目录（折叠 / 正倒序 / 定位高亮）。
- 阅读：4 种翻页模式（滚动 / 滑动 / 3D 翻页 / 无）、11 项设置实时生效并持久化、5 套主题、点击分区与键盘 / 手势翻页、进度自动保存恢复。
- 导入：UTF-8 / GBK / GB18030 / UTF-16 自动检测、手动切编码重解码、章节识别与兜底分章、元信息编辑、每批 20 章写库、失败回滚。
- 管理：导入书列表、存储占用、删除 / 清空、备份导出 / 恢复（缺正文提示重新导入）。

## 关键实现

- **分页** `utils/pagination.ts`：离屏容器测量段落高度，超页段落按标点切分；`useMemo` 缓存。
- **进度** `useReadingProgress` + `bookStore.saveProgress`：切章 / 滚动停（500ms 防抖）/ 翻页 / 卸载多处触发，`scrollPercent` 与 `pageIndex` 双轨恢复。
- **主题** `styles/themes.ts`：5 套阅读主题用 CSS 变量注入；列表 / 详情深色用 Tailwind `dark:` + 全局 class。
- **IndexedDB** `db/`：`idb` Promise 化，配额不足抛 `QUOTA_EXCEEDED`，隐私模式不崩溃。
- **预置加载** `services/preset/loader.ts`：`viteStaticCopy` 复制 TXT，运行时 `fetch` + 内存缓存，不进首屏 JS。

## 开源致谢

| 名称 | 版本 | 用途 | 许可证 | 仓库 |
|-|-|-|-|-|
| react | 18.3.1 | UI 框架 | MIT | https://github.com/facebook/react |
| react-router-dom | 6.26.2 | 路由 | MIT | https://github.com/remix-run/react-router |
| zustand | 4.5.5 | 状态管理 | MIT | https://github.com/pmndrs/zustand |
| tailwindcss | 3.4.13 | 样式 | MIT | https://github.com/tailwindlabs/tailwindcss |
| lucide-react | 0.441.0 | 图标 | ISC | https://github.com/lucide-icons/lucide |
| clsx | 2.1.1 | 类名拼接 | MIT | https://github.com/lukeed/clsx |
| idb | 8.0.0 | IndexedDB 封装 | ISC | https://github.com/jakearchibald/idb |
| jschardet | 3.1.4 | 编码检测 | LGPL-2.1 | https://github.com/aadsm/jschardet |
| vite | 5.4.8 | 构建工具 | MIT | https://github.com/vitejs/vite |
| vite-plugin-static-copy | 1.0.6 | 静态资源复制 | MIT | https://github.com/sapphi-red/vite-plugin-static-copy |
| typescript | 5.6.2 | 类型系统 | Apache-2.0 | https://github.com/microsoft/TypeScript |

### 参考实现（未复制代码）

- koodo-reader（MIT）：导入流程设计
- foliate-js（MIT）：分页离屏测量思路

### 许可证声明

本项目采用 MIT。所有依赖为宽松许可证，不含 GPL/AGPL 代码。

## 扩展点

EPUB 导入（JSZip + OPF/NCX）、书签 / 笔记 / 划线、全文搜索（含 IDB 索引）、阅读时长统计、书架分组、多端同步（`data/index.ts` + `db/` 预留）、字体本地化、评论（Giscus 等）。

## 已知限制

- 换设备 / 清缓存 / 无痕模式下，导入书正文与阅读进度会丢失。
- 超大文件（>50MB）拒绝导入；20~50MB 导入较慢并有警告。
- 章节识别依赖标题正则，非标准排版会走每 3000 字兜底分章。