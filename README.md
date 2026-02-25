# 钙钛矿光伏资讯网 · PSCs Intelligence Hub

> 一站式钙钛矿太阳能电池行业情报平台，聚合国内外最新资讯、招投标公告、企业数据库、效率记录与学术前沿，支持每日自动抓取更新。

[![Tech Stack](https://img.shields.io/badge/Stack-React%2019%20%2B%20tRPC%20%2B%20MySQL-blue)](https://github.com/fudabao666/PSCs)
[![License](https://img.shields.io/badge/License-MIT-green)](LICENSE)
[![Data](https://img.shields.io/badge/Data-Daily%20Auto%20Update-orange)](https://github.com/fudabao666/PSCs)

---

## 目录

- [项目简介](#项目简介)
- [功能模块](#功能模块)
- [技术架构](#技术架构)
- [数据库设计](#数据库设计)
- [快速开始](#快速开始)
- [自动化数据抓取](#自动化数据抓取)
- [管理后台](#管理后台)
- [项目结构](#项目结构)

---

## 项目简介

**钙钛矿光伏资讯网**（PSCs Intelligence Hub）是面向钙钛矿太阳能电池行业的垂直情报聚合平台。平台采用报纸风格设计，以深色海军蓝与暖米色为主色调，融合 Playfair Display 衬线字体，营造专业、严肃的行业媒体气质。

平台核心价值在于**数据的真实性与时效性**：所有行业资讯、招投标信息均来自北极星光伏网、采招网、中国国际招标网等权威来源的真实抓取，每条记录均附带原文链接，并通过每日定时任务自动更新。

---

## 功能模块

### 公开门户

| 模块 | 路由 | 说明 |
|------|------|------|
| 首页 | `/` | 报纸式不对称双栏布局，头条新闻 + 滚动资讯条 + 快速入口 |
| 行业资讯 | `/news` | 21 条真实钙钛矿新闻，支持分类筛选、关键词搜索，详情页附"查看原文"链接 |
| 招投标 | `/tenders` | 20 条真实招标公告（华能、国家电投、中国电建等），附原始公告来源链接 |
| 厂家数据库 | `/manufacturers` | 国内外主要钙钛矿企业，支持置顶展示（鹑火光电等重点企业） |
| 效率记录 | `/efficiency` | 各类钙钛矿电池效率世界纪录追踪，含认证机构与日期 |
| 技术前沿 | `/tech` | 学术论文与专利数据库，LLM 自动生成中文摘要 |
| 全站搜索 | `/search` | 跨模块关键词搜索 |

### 管理后台

管理后台入口经过刻意隐藏：**页脚"数据每日自动更新"文字末尾的"·"符号**即为入口，点击后跳转登录，管理员身份验证后进入后台。

---

## 技术架构

```
前端                    后端                    数据层
─────────────────────   ─────────────────────   ─────────────────
React 19                Express 4               MySQL / TiDB
Tailwind CSS 4          tRPC 11                 Drizzle ORM
shadcn/ui               Manus OAuth             S3 文件存储
Wouter (路由)           node-cron (定时任务)
Vite 6                  内置 LLM API
```

**类型安全全链路**：tRPC 确保前后端接口类型共享，Drizzle ORM 提供类型安全的数据库操作，Superjson 序列化保证 `Date` 等类型在网络传输中不丢失。

---

## 数据库设计

共 8 张数据表，覆盖平台全部业务场景：

| 表名 | 用途 | 关键字段 |
|------|------|---------|
| `users` | 用户与权限 | `role` (admin\|user), `openId` |
| `news` | 行业资讯 | `sourceUrl`, `sourceName`, `category`, `isImportant` |
| `tenders` | 招投标公告 | `sourceUrl` (NOT NULL), `sourcePlatform`, `status`, `deadline` |
| `manufacturers` | 企业数据库 | `isPinned`, `sortOrder`, `techAchievements` (JSON) |
| `efficiency_records` | 效率记录 | `cellType`, `efficiency`, `certifiedBy`, `isCurrentRecord` |
| `research_papers` | 学术论文 | `doi`, `keyFindings` (JSON), `summary` (LLM 生成) |
| `patents` | 专利数据 | `patentNumber`, `ipcCode`, `status` |
| `job_logs` | 抓取任务日志 | `jobType`, `status`, `itemsProcessed`, `startedAt`, `completedAt` |

---

## 快速开始

### 环境要求

- Node.js 18+
- pnpm 8+
- MySQL 8.0+ 或 TiDB

### 安装与运行

```bash
# 克隆仓库
git clone https://github.com/fudabao666/PSCs.git
cd PSCs

# 安装依赖
pnpm install

# 配置环境变量（复制示例文件后填写）
cp .env.example .env

# 推送数据库 Schema
pnpm db:push

# 启动开发服务器
pnpm dev
```

### 必要环境变量

```env
DATABASE_URL=mysql://user:password@host:3306/dbname
JWT_SECRET=your-jwt-secret
VITE_APP_ID=your-oauth-app-id
OAUTH_SERVER_URL=https://api.manus.im
BUILT_IN_FORGE_API_URL=https://...
BUILT_IN_FORGE_API_KEY=your-api-key
```

### 可用命令

| 命令 | 说明 |
|------|------|
| `pnpm dev` | 启动开发服务器（前后端同时） |
| `pnpm build` | 构建生产版本 |
| `pnpm test` | 运行 Vitest 单元测试（24 个测试用例） |
| `pnpm db:push` | 同步 Schema 变更到数据库 |

---

## 自动化数据抓取

平台内置每日定时抓取系统，服务启动后自动注册定时任务：

- **执行时间**：每天 08:00（北京时间）
- **抓取来源**：采招网、北极星光伏网、全国公共资源交易平台、中国国际招标网等
- **解析方式**：将原始 HTML 传入 LLM，通过 JSON Schema 约束提取结构化字段
- **去重机制**：基于 `(title, sourceUrl)` 组合判断，避免重复入库
- **日志记录**：每次任务写入 `job_logs` 表，记录状态、新增条数、耗时与错误信息

管理员可在后台「数据更新」标签页手动触发全量抓取或仅抓取招投标，并实时查看历史日志。

---

## 管理后台

后台采用**隐秘入口设计**，不在导航栏暴露登录按钮：

1. 滚动到页面底部，找到"数据每日自动更新"文字
2. 点击其末尾的"·"符号
3. 完成 OAuth 登录后自动跳转管理后台

后台功能包括：资讯管理（CRUD + LLM 摘要生成）、招投标管理、企业置顶排序、学术数据管理、数据抓取触发与日志查看。

---

## 项目结构

```
PSCs/
├── client/
│   ├── src/
│   │   ├── pages/          # 各功能页面组件
│   │   ├── components/     # 公共 UI 组件（SiteHeader, SiteFooter 等）
│   │   ├── lib/trpc.ts     # tRPC 客户端绑定
│   │   └── App.tsx         # 路由配置
│   └── index.html
├── server/
│   ├── routers.ts          # tRPC 路由（所有 API 接口）
│   ├── db.ts               # 数据库查询函数
│   ├── dataFetcher.ts      # 真实网页抓取 + LLM 解析
│   ├── scheduler.ts        # node-cron 定时任务
│   └── _core/              # 框架核心（OAuth, LLM, 上下文）
├── drizzle/
│   └── schema.ts           # 数据库表结构定义
├── storage/                # S3 文件存储工具
└── shared/                 # 前后端共享类型与常量
```

---

## 数据来源声明

本平台展示的行业资讯与招投标信息均来自公开互联网，原始来源包括：

- [北极星光伏网](https://guangfu.bjx.com.cn)
- [采招网](https://www.bidcenter.com.cn)
- [中国国际招标网](https://chinabidding.mofcom.gov.cn)
- [全国公共资源交易平台](https://ggzy.gov.cn)
- 各企业官方公告

所有内容仅供行业研究参考，版权归原作者所有。

---

## License

MIT License © 2026 fudabao666
