# SynerPlat ESG Intelligence

SynerPlat 是一个开源的 ESG 政策、重大动态与研究资料情报网站。它将政府和监管信息、行业报告、白皮书、学术论文与工作论文整理为可检索的动态卡片、行业观察、时间尺度摘要和可视化信号。

在线演示：<https://synerplat-esg-intelligence.platzerqi.chatgpt.site/>

## 主要功能

- 本周、本月与本年度重大 ESG 动态视图
- 分离显示发布日期和事件、生效或成文日期
- 按行业、相关性和事件类型筛选重大动态
- 收藏、移除、恢复和导出浏览器本地数据
- 研究资料库检索、类型过滤与详情查看
- JSON 导入、自动初步分类及“用户导入”标签
- 权威政策、新闻和学术资料联网搜索入口
- 本周／本月总结、关键词词云和频率条形图
- 独立的数据洞察与时间轴页面
- 每日 GitHub Actions 自动检索、证据筛选、去重、构建与公开发布

> 研究内容用于信息整理，不构成法律、投资或合规意见。日期、摘要与分类在正式引用前仍应回到原始来源核验。

## 技术栈

- React 19
- Next.js 16 API surface
- Vinext + Vite
- Cloudflare Workers-compatible runtime
- TypeScript

## 安装

需要 Node.js 22.13 或更高版本。

```bash
git clone https://github.com/JimPlatzer/SynerPlat.git
cd SynerPlat
npm ci
```

## 本地运行

```bash
npm run dev
```

默认访问 <http://localhost:3000>。生产构建与本地启动：

```bash
npm run build
npm run start
```

完整检查：

```bash
npm run check
```

## 环境变量

当前版本无需 API Key 或数据库即可运行。复制示例文件只在你需要增加自有绑定时使用：

```bash
cp .env.example .env.local
```

可选变量见 [`.env.example`](.env.example)。真实 `.env` 文件已被 Git 忽略，不应提交。

浏览器中的收藏、移除状态和用户导入资料使用 `localStorage`，只存在于当前设备，不是共享数据库。

## 数据维护

- `public/research-library.json` 是研究资料库的公开数据源。
- `app/page.tsx` 包含本周动态、总结与行业观察。
- `app/intelligence-data.ts` 包含月度和年度重点。
- 新增资料应保留原始链接、发布机构、日期、资料类型和简要研究价值。
- 同行评审论文、预印本、政策文件和行业报告应明确区分。
- `public/auto-intelligence.json` 保存自动任务生成的滚动窗口、摘要与来源健康状态。
- 自动任务仅处理能够打开原始页面的候选；模型不可用或证据不足时会保留已有数据，不会把搜索摘要直接写入网站。

## 部署

### OpenAI Sites 或 Cloudflare Workers

本项目的标准 `vinext build` 会生成包含 React Server Components 的服务端 Worker。OpenAI Sites 或兼容 Cloudflare Workers 的平台可以直接运行这套产物，适合作为完整动态部署。

最简单的完整功能部署方式是 OpenAI Sites。使用 Sites 时，将 [`.openai/hosting.example.json`](.openai/hosting.example.json) 复制为 `.openai/hosting.json`，并填入你自己的项目 ID。该本地配置已被 Git 忽略。

也可以部署到兼容 Cloudflare Workers 的平台。部署前先运行：

```bash
npm ci
npm run check
```

### GitHub Pages 无人值守镜像

仓库提供 `.github/workflows/daily-pages.yml`。它每天自动执行以下流程：

1. 从官方 API、政府 Atom feed、Crossref 与 arXiv 获取最近更新；
2. 打开原始页面验证链接，以确定性规则完成重大性筛选和分类；GitHub Models 可用时用于提升中文摘要质量；
3. 更新公开 JSON 数据、运行完整构建检查；
4. 从 Worker 构建生成静态快照并部署到 GitHub Pages。

静态导出脚本会在构建阶段渲染首页与数据页，并将客户端交互和公开 JSON 数据一起封装为 Pages 兼容快照。该流程每天北京时间 08:20 运行，也可在 Actions 页面手动触发。它使用 GitHub Actions 的短期令牌与 `models: read` 权限，不需要把长期 API Key 提交到仓库。GitHub Pages 地址为 <https://jimplatzer.github.io/SynerPlat/>。

自动检索采用失败关闭策略：原始页面无法访问或证据不足时不会写入新条目；模型不可用时自动切换到无密钥降级模式，不会中断日期、来源和资料更新。任务状态会记录在 `sourceHealth` 中。Crossref 条目只保留受信出版社的元数据，并标注“同行评审状态待核”；arXiv 条目明确标注为非同行评审预印本。自动结果适合做研究线索，不替代正式引用前的人工核验。

## 项目结构

```text
.
├── app/
│   ├── data/                 # 数据洞察页面
│   ├── globals.css           # 全站样式
│   ├── intelligence-data.ts  # 月度与年度重点
│   ├── layout.tsx            # 元数据与根布局
│   └── page.tsx              # 首页与主要交互
├── public/
│   ├── auto-intelligence.json # 自动检索生成的滚动情报
│   ├── research-library.json # 研究资料库
│   ├── og.png                # 社交分享图
│   └── favicon.svg
├── scripts/                  # 自动检索与静态导出脚本
├── .github/workflows/        # CI 与每日无人值守发布
├── .env.example              # 可选环境变量示例
├── LICENSE                   # MIT License
├── SECURITY.md               # 安全问题报告方式
└── vite.config.ts            # Vinext / Workers 构建配置
```

## 开源协议与内容说明

项目代码及项目原创内容按 [MIT License](LICENSE) 发布。资料库链接指向的第三方政策、论文、报告、机构名称和商标仍归各自权利人所有，不因本项目的 MIT License 而改变。

欢迎阅读 [CONTRIBUTING.md](CONTRIBUTING.md) 后提交改进。
