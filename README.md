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
cd synerplat-esg-intelligence
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

## 部署

### 推荐：OpenAI Sites 或 Cloudflare Workers

本项目的 `vinext build` 会生成 `dist/server/index.js`，包含 React Server Components 所需的服务端 Worker。因此它不是纯静态网站，GitHub Pages 无法执行该服务端产物；本仓库没有配置会导致功能缺失的 Pages workflow。

最简单的完整功能部署方式是 OpenAI Sites。使用 Sites 时，将 [`.openai/hosting.example.json`](.openai/hosting.example.json) 复制为 `.openai/hosting.json`，并填入你自己的项目 ID。该本地配置已被 Git 忽略。

也可以部署到兼容 Cloudflare Workers 的平台。部署前先运行：

```bash
npm ci
npm run check
```

如果未来将应用改造成完全静态导出，再考虑 GitHub Pages；届时还需要处理仓库子路径、客户端路由回退和静态资源 base path。

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
│   ├── research-library.json # 研究资料库
│   ├── og.png                # 社交分享图
│   └── favicon.svg
├── .github/workflows/ci.yml  # 自动构建检查
├── .env.example              # 可选环境变量示例
├── LICENSE                   # MIT License
├── SECURITY.md               # 安全问题报告方式
└── vite.config.ts            # Vinext / Workers 构建配置
```

## 开源协议与内容说明

项目代码及项目原创内容按 [MIT License](LICENSE) 发布。资料库链接指向的第三方政策、论文、报告、机构名称和商标仍归各自权利人所有，不因本项目的 MIT License 而改变。

欢迎阅读 [CONTRIBUTING.md](CONTRIBUTING.md) 后提交改进。
