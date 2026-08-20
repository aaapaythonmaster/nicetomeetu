# Nicetomeetu 个人简历网站

面向招聘方的桌面端个人主页。后台可分别维护“产品经理版”和“产品运营版”简历，预览后生成中文 PDF，并原子发布其中一个版本。公开页面使用 React Bits 风格的 ColorBends、DotField 和 OptionWheel。

## 技术栈

- Next.js 16 App Router、React 19、TypeScript、Tailwind CSS
- Supabase Auth、Postgres、Storage
- `@react-pdf/renderer` 生成 A4 中文简历
- Vitest 与 Playwright

## 本地启动

需要 Node.js 20+ 和 pnpm 10。

```bash
pnpm install
cp .env.example .env.local
pnpm dev
```

访问 `http://localhost:3000`；后台入口为 `http://localhost:3000/admin`。项目仅针对桌面端设计，验收基准视口为 1440×900。

## 环境变量

```dotenv
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your-publishable-key
SUPABASE_SECRET_KEY=your-server-secret-key
SUPABASE_DATABASE_URL=postgresql://user:password@host:6543/postgres
# Vercel Supabase Marketplace 会自动提供 POSTGRES_URL，可替代上一项。
```

- `NEXT_PUBLIC_*` 仅包含可以发送到浏览器的 Supabase URL 和 publishable key。
- `SUPABASE_SECRET_KEY` 只能配置在服务端，用于私有 DOCX/PDF Storage 操作。
- `SUPABASE_DATABASE_URL` 使用 Supabase pooled connection，供事务发布和迁移验证使用；Vercel Marketplace 自动注入的 `POSTGRES_URL` 可直接替代它。
- 不要提交 `.env.local`、真实简历、手机号、数据库密码或 service-role secret。

## Supabase 初始化

1. 创建 Supabase 项目并安装 Supabase CLI。
2. 将本仓库关联到项目，然后应用迁移：

```bash
supabase link --project-ref <project-ref>
supabase db push
```

3. 迁移会创建数据表、RLS 策略，以及私有的 `resume-source`、`resume-pdf` bucket。
4. 在 Supabase Authentication 中创建唯一的后台用户，复制其 UUID，再通过 SQL Editor 加入管理员白名单：

```sql
insert into public.admin_users (user_id)
values ('AUTH_USER_UUID');
```

仅“已登录且 UUID 存在于 `admin_users`”的用户能进入后台。普通 authenticated 用户没有管理权限。

本地全量重建数据库可使用：

```bash
supabase db reset
```

`supabase/seed.sql` 只包含无隐私的基础配置，不会写入真实管理员或简历。

## 日常使用与发布流程

1. 登录 `/admin`，选择“产品经理版”或“产品运营版”。
2. 上传结构固定的 `.docx` 简历；系统会解析身份、实习、项目、校园和技能信息。
3. 检查重复项/缺失板块提示，修改简介与滚轮标签，拖拽排序，并隐藏不公开的板块或条目。
4. 手机号默认不公开；只有手动开启后才会出现在网页与 PDF。
5. 点击“保存并预览”，通过与公开主页相同的组件检查草稿。
6. 点击“生成 PDF 并发布”。系统先生成私有 PDF，再在单个数据库事务中切换公开版本；失败不会替换现有线上版本。
7. 如两种岗位版本都已发布，可在后台首页点击“设为对外版本”切换招聘方看到的版本。
8. 外部下载始终访问 `/api/resume/pdf`，浏览器无法指定或枚举 Storage 路径。

更换同结构简历时，只需在对应版本重新上传 DOCX，不需要修改前后端代码。动效参数在后台“视觉参数”页面修改并预览后发布。

## 测试与质量门禁

```bash
pnpm lint
pnpm typecheck
pnpm test:unit
pnpm test:integration
pnpm build
pnpm test:e2e
```

也可以用 `pnpm test` 一次运行全部 Vitest 测试。`tests/integration/database-policies.test.ts` 在配置 `SUPABASE_DATABASE_URL` 时执行真实数据库策略测试；未配置时会跳过该项。

Playwright 默认启动本地开发服务器并以 1440×900 Chromium 桌面视口运行。测试专用请求头只在非生产环境生效，不能绕过生产认证。

## 目录说明

- `app/`：公开页面、后台、上传与 PDF API
- `components/react-bits/`：三个可配置动态组件
- `src/features/resume/`：简历契约、解析、查询与后台操作
- `src/features/publishing/`：带 advisory lock 的原子发布
- `src/features/pdf/`：PDF 映射、排版与渲染
- `supabase/migrations/`：数据库、RLS、Storage 和内容版本迁移
- `tests/`：单元、集成、策略和浏览器验收

字体 `public/fonts/NotoSansCJKsc-Regular.otf` 来自 Noto CJK，并随仓库保留 SIL Open Font License 1.1 许可文本。
