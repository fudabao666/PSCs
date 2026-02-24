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
- [ ] Efficiency trend chart visualization
- [ ] Multi-language support (CN/EN)
