# 钙钛矿光伏资讯网 - Project TODO

## Database & Backend
- [x] Design and push database schema (news, tenders, manufacturers, efficiency_records)
- [x] News aggregation API with Data API integration
- [x] Tender information API with search and categorization
- [x] Manufacturer database CRUD API
- [x] Efficiency records API
- [x] LLM-powered news summary generation
- [x] Admin notification system for important tenders/news
- [x] Global site-wide search API
- [x] Admin CRUD procedures (add/edit/delete news, manufacturers)
- [x] Daily scheduled data fetch job endpoint

## Frontend - Design & Layout
- [x] Global design system: cream background, Didone serif typography, geometric lines
- [x] Top navigation with logo, search, and section links
- [x] Footer with site info and links
- [x] Responsive layout (mobile/tablet/desktop)

## Frontend - Pages
- [x] Home page: hero section, featured news, latest tenders, key stats
- [x] News aggregation page with time/source/keyword filters
- [x] News detail page with LLM summary
- [x] Tender information zone with search and category browsing
- [x] Tender detail page
- [x] Global manufacturer database page with company cards
- [x] Manufacturer detail page
- [x] Efficiency records tracking page with world records display
- [x] Global search results page
- [x] Admin backend: news management
- [x] Admin backend: manufacturer management
- [x] Admin backend: tender management
- [x] Admin backend: data update trigger

## Automation & Scheduling
- [x] Daily auto-update scheduled task (08:00 CST, scheduler.ts)
- [x] Admin notification trigger for important content

## Testing
- [x] Vitest tests for news router (perovskite.test.ts)
- [x] Vitest tests for tender router
- [x] Vitest tests for manufacturer router
- [x] Vitest tests for search router
- [x] Vitest tests for admin access control
- [x] Auth logout test (auth.logout.test.ts)

## Future Improvements
- [ ] Bulk import for manufacturer data
- [ ] Bulk import for efficiency records
- [ ] Full edit dialogs for news/tenders
- [x] Efficiency trend chart visualization (in progress)
- [ ] Multi-language support (CN/EN)

## Sprint 2 - 企业数据库 & 效率数据完善
- [x] 网络搜集全球30家主要钙钛矿光伏企业准确信息（含官网URL）
- [x] 从NREL等权威来源获取准确效率历史数据（2009-2025年，5种电池类型）
- [x] 将30家企业写入数据库seed脚本（server/seedManufacturers.ts）
- [x] 用NREL权威效率数据写入seed脚本（server/seedEfficiency.ts）
- [x] 管理后台seed按钮连接到真实tRPC端点
- [x] 厂家卡片添加官网链接图标
- [x] 20个测试全部通过

## Current Sprint
- [x] Backend: efficiency.chartData API (time-series aggregation by cell type)
- [x] Frontend: Recharts line chart in EfficiencyPage.tsx
- [x] Seed sample efficiency data for chart demonstration (35 records, 2012-2024)
- [x] Backend: efficiency.seed API for admin to initialize data

## Sprint 3 - 品牌标识更新
- [x] 首页及导航栏名称添加"鹑火FL内刊"副标题

## Sprint 4 - 页脚版权声明
- [x] 页脚底部添加"© 2026 鹑火FL内刊 · 钙钛矿光伏资讯"版权声明
- [x] 页脚品牌区域同步添加"鹑火FL内刊"标签

## Sprint 5 - 技术前沿板块
- [x] 数据库Schema：research_papers和patents两张表已迁移
- [x] 后端API：论文列表、详情、搜索、创建、删除、seed
- [x] 后端API：专利列表、详情、搜索、创建、删除、seed
- [x] 前端技术前沿列表页TechPage.tsx（论文+专利切换）
- [x] 前端论文详情页TechPaperDetail.tsx
- [x] 前端专利详情页TechPatentDetail.tsx
- [x] 导航栏添加技术前沿链接
- [x] 首页添加技术前沿入口板块
- [x] 管理后台添加技术前沿标签页（论文+专利管理）
- [x] LLM摘要自动生成（创建论文时可选generateSummary）
- [x] 20个测试全部通过

## Sprint 6 - 招投标管理后台查询界面
- [x] 确认tenders表sourceUrl字段存在（已有sourceUrl+sourcePlatform字段）
- [x] 管理后台招投标Tab：完整列表查询（关键词/状态/类型/地区筛选）
- [x] 管理后台招投标Tab：来源网站链接直接展示和跳转（ExternalLink图标）
- [x] 管理后台招投标Tab：支持编辑sourceUrl+sourcePlatform字段（带验证链接）
- [x] 管理后台招投标Tab：支持新增招投标（含来源链接）
- [x] 分页功能（20条/页）
- [x] 20个测试全部通过

## Sprint 7 - 添加湖州市鹑火光电有限公司
- [x] 网络搜索鹑火光电公司信息（成立时间、融资历史、主要产品、技术成就、专利）
- [x] 将鹑火光电添加至厂家数据库seed脚本（置于首位，isPinned=true, sortOrder=1）
- [x] 数据库Schema添加isPinned和sortOrder字段并迁移
- [x] 更新db.ts排序逻辑：优先按isPinned降序、sortOrder升序、名称升序
- [x] 厂家卡片添加鹑火FL金色标签和特殊边框视觉标识
- [x] 20个测试全部通过

## Sprint 8 - 招投标来源网址必填
- [x] 管理后台新增招投标对话框：sourceUrl设为必填（红色边框+错误提示+按钒禁用）
- [x] 管理后台编辑招投标对话框：sourceUrl设为必填（红色边框+错误提示+按钒禁用）
- [x] 后端tenders.create：sourceUrl设为必填（Zod min(1)+url验证）
- [x] 后端tenders.update：sourceUrl如提供则必须为有效URL（Zod url验证）
- [x] 20个测试全部通过，TypeScript零错误

## Sprint 9 - 补充现有招投标记录来源网址
- [x] 查询数据库：9条记录全部缺少sourceUrl（均为示例数据）
- [x] 网络搜索匹配最相关的权威招标平台链接
- [x] SQL批量更新9条记录的sourceUrl和sourcePlatform字段
- [x] 来源平台涵盖：全国公共资源交易平台、中国国际招标网、北极星光伏网、盖锡新能源等
- [x] 保存检查点

## Sprint 10 - 行业资讯更新为真实抓取数据
- [ ] 从北极星光伏网、索比光伏网、盖锡新能源等网站抓取真实钙钛矿资讯
- [ ] 检查news表是否有sourceUrl字段，如无则迁移添加
- [ ] 确保前端新闻列表和详情页展示来源链接
- [ ] 用真实资讯替换数据库示例数据
- [ ] 保存检查点
