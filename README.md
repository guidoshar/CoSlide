# CoSlide PPTX Generator Powered By GuidoShar

<p align="left">
  <a href="https://guidoshar.com/" target="_blank"><b>Guido's site</b>: guidoshar.com</a>
</p>

<p align="left">
  <a href="https://myvalley.cn/coslide" target="_blank"><b>体验链接请点击此处</b>，通行密码guido2026</a>
  </p>

一个带 **Retro-Pop Ticket Brutalism**（复古波点票据粗野主义）视觉系统的 AI 演示文稿生成器。输入自然语言需求，调用大语言模型生成结构化内容，在浏览器端生成并下载 **PPTX** 或导出自包含 **HTML 演示文稿**。

<img width="841" height="297" alt="coslide_logo" src="https://github.com/user-attachments/assets/d7b0435c-2308-4a42-af61-2aaafbb72a0f" />
<img width="2560" height="1290" alt="Coslide生成过程展示" src="https://github.com/user-attachments/assets/e3d06f73-f2ed-49d6-9ebc-465ae2cd1b7f" />

<img width="2558" height="1290" alt="CoSlide成果展示" src="https://github.com/user-attachments/assets/2a292a9c-9b14-4ff7-8596-17670243ee27" />


## 功能特性

- **多 LLM 支持**：Azure OpenAI / OpenAI / Anthropic / OpenAI 兼容接口（DeepSeek、Moonshot 等第三方中转）
- **前端可配置**：无需修改代码即可在浏览器中配置 API Endpoint、Key 和模型
- **流式输出**：实时显示模型生成内容，带进度条和阶段指示
- **多模态输入**：支持 PDF、DOCX 文档和图片上传，自动解析并作为上下文
- **输出配置**：
  - **格式**：PPTX / HTML
  - **风格**：EXECUTIVE / CREATIVE / MINIMAL / STORY（影响提示词与配色）
  - **语言**：AUTO / 中文 / EN / 日本語
- **模板定制**：Logo 上传（固定位置）、企业标准色覆盖
- **用户画像**：引导式 Onboarding 生成用户描述，自动注入到 LLM 上下文
- **历史记录**：左侧边栏查看过往生成记录，含 AI 总结持久化
- **完成面板**：操作时间线 + AI 友善总结 + 幻灯片预览 + 点选下载 + 继续修改

<img width="2558" height="1287" alt="image" src="https://github.com/user-attachments/assets/4a30205d-bf15-4166-9bbe-3086b38157c6" />
<img width="2560" height="1288" alt="用户记忆" src="https://github.com/user-attachments/assets/43c0b8e3-2093-4688-bb86-5c53231cd44d" />


## 技术栈

| 层级 | 技术 |
|------|------|
| 框架 | Next.js 16 (App Router) + TypeScript |
| 样式 | Tailwind CSS 4 |
| LLM  | OpenAI SDK（支持 Azure/OpenAI/兼容接口）+ Anthropic HTTP API |
| PPTX | pptxgenjs（浏览器端生成） |
| PDF 解析 | pdfplumber (Python FastAPI 微服务) |
| DOCX 解析 | mammoth (Node.js) |
| 存储 | localStorage（轻量持久化） |

## 快速开始

### 前置条件

- Node.js >= 18
- npm / yarn / pnpm
- Python 3.10+（仅 PDF 解析功能需要）

### 1) 安装依赖

```bash
npm install
```

### 2) 配置 LLM

**方式 A — 环境变量**（适合部署）

创建 `.env.local`（本仓库已忽略所有 `.env*` 文件）：

```bash
# Azure OpenAI
AZURE_OPENAI_API_KEY=your-key-here
AZURE_OPENAI_ENDPOINT=https://your-resource.openai.azure.com
AZURE_OPENAI_DEPLOYMENT=gpt-4o

# PDF 解析服务（可选）
PDF_PARSER_URL=http://localhost:5001
```

**方式 B — 前端配置**（适合开发/个人使用）

无需设置环境变量，启动后点击 Header 的 `LLM` 按钮，在界面中配置：
- 选择 Provider（Azure OpenAI / OpenAI / Anthropic / OpenAI 兼容）
- 输入 API Endpoint、Key、Model
- 保存后立即生效（存储在浏览器 localStorage）

### 3) 启动开发服务器

```bash
npm run dev
```

打开 `http://localhost:3000`，使用密码 `guido2026` 登录。

### 4) PDF 解析服务（可选）

```bash
cd services/pdf-parser
pip install -r requirements.txt
uvicorn main:app --host 0.0.0.0 --port 5001
```

## 生产部署

### 源码构建

```bash
# 构建
npm run build

# 启动（默认端口 3000）
npm run start

# 自定义端口
PORT=8080 npm run start
```

### Docker 部署

```bash
# 构建镜像
docker build -t coslide .

# 运行
docker run -p 3000:3000 \
  -e AZURE_OPENAI_API_KEY=your-key \
  -e AZURE_OPENAI_ENDPOINT=https://your-resource.openai.azure.com \
  -e AZURE_OPENAI_DEPLOYMENT=gpt-4o \
  coslide
```

### Docker Compose（含 PDF 解析服务）

```bash
# 复制并编辑环境变量
cp .env.example .env.local

# 启动所有服务
docker compose up -d
```

## 目录结构

```
app/
  api/
    generate/route.ts        # 流式生成演示文稿 JSON（SSE）
    summarize/route.ts       # AI 友善总结
    profile/route.ts         # 用户画像生成
    parse-file/route.ts      # 文件解析（DOCX / PDF 转发）
components/
  LoginGate.tsx              # 票据检票口登录
  Workbench.tsx              # 主工作台（集成所有功能）
  TerminalStatus.tsx         # 流式输出终端（Brutalist 风格）
  CompletionPanel.tsx        # 完成面板（预览/下载/继续）
  SlidePreview.tsx           # 页内幻灯片预览
  ConfigPanel.tsx            # 输出格式/风格/语言选择
  TemplatePanel.tsx          # Logo + 色彩定制
  FileUploadZone.tsx         # 多模态文件上传
  HistorySidebar.tsx         # 历史记录侧边栏
  SettingsModal.tsx          # LLM 配置面板
  OnboardingModal.tsx        # 用户引导
  UserProfileCard.tsx        # 用户画像卡片
  TicketHeader.tsx           # 顶部导航
lib/
  presets.ts                 # 风格/语言预设常量
  generate-pptx.ts           # pptxgenjs 生成（按风格色板）
  generate-html.ts           # 自包含 HTML 生成
  llm-config.ts              # LLM 配置类型 + localStorage 管理
  llm-client.ts              # 统一 LLM 客户端（OpenAI/Anthropic）
  history.ts                 # 历史记录管理
  types.ts                   # TypeScript 类型定义
services/
  pdf-parser/                # Python PDF 解析微服务
```

## 环境变量

| 变量 | 必需 | 说明 |
|------|------|------|
| `AZURE_OPENAI_API_KEY` | 否* | Azure OpenAI API Key |
| `AZURE_OPENAI_ENDPOINT` | 否* | Azure OpenAI Endpoint |
| `AZURE_OPENAI_DEPLOYMENT` | 否* | Azure OpenAI 部署名 |
| `PDF_PARSER_URL` | 否 | PDF 解析服务地址（默认 `http://localhost:5001`） |

\* 若不设环境变量，可通过前端 LLM 配置面板配置任意支持的 LLM 提供商。

## License

MIT
