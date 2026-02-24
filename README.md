# CoSlide PPTX Generator Powered By GuidoShar
<p align="left">
  <a href="https://guidoshar.com/" target="_blank"><b>Guido's site</b>: guidoshar.com</a>
</p>

一个带 **Retro‑Pop Ticket Brutalism**（复古波点票据粗野主义）视觉系统的 Web 工具：登录后输入自然语言需求，调用 **Azure OpenAI** 生成结构化 JSON，再在浏览器端生成并下载 **PPTX**（或导出自包含 **HTML 演示文稿**）。
<img width="841" height="297" alt="coslide_logo" src="https://github.com/user-attachments/assets/d7b0435c-2308-4a42-af61-2aaafbb72a0f" />
<img width="2559" height="1292" alt="Coslide生成流程" src="https://github.com/user-attachments/assets/f0a8610f-0e02-4c35-ab4c-95c7cc39b8bd" />


<img width="1952" height="1292" alt="Coslide成果展示" src="https://github.com/user-attachments/assets/247173c0-3523-4bd7-9996-d569a3ad0fb0" />


## 功能特性

- **Ticket 登录页**：硬编码密码（MVP）`guido2026`，使用 `localStorage` 记录登录态
- **Prompt 工作台**：自然语言输入 + 终端式生成进度
- **输出配置**：
  - **格式**：PPTX / HTML
  - **风格**：EXECUTIVE / CREATIVE / MINIMAL / STORY（影响提示词与配色）
  - **语言**：AUTO / 中文 / EN / 日本語
- **完成面板**：操作时间线 + AI 友善总结 + 幻灯片预览 + 点选下载 + 继续修改

<img width="2558" height="1287" alt="image" src="https://github.com/user-attachments/assets/4a30205d-bf15-4166-9bbe-3086b38157c6" />


## 技术栈

- Next.js (App Router) + TypeScript
- Tailwind CSS
- Azure OpenAI（通过 `openai` 的 `AzureOpenAI` 客户端）
- `pptxgenjs`（浏览器端生成 PPTX）

## 本地运行

### 1) 安装依赖

```bash
npm install
```

### 2) 配置环境变量

创建 `.env.local`（本仓库已忽略所有 `.env*` 文件，**不要提交密钥**）：

```bash
AZURE_OPENAI_API_KEY=your-key-here
AZURE_OPENAI_ENDPOINT=https://your-resource.openai.azure.com
AZURE_OPENAI_DEPLOYMENT=gpt-4o
```

### 3) 启动开发服务器

```bash
npm run dev
```

打开 `http://localhost:3000`，使用密码 `guido2026` 登录。

## 生产构建

```bash
npm run build
npm run start
```

## 目录速览

```txt
app/
  api/generate/route.ts      # 生成 PPT JSON（动态风格/语言提示词）
  api/summarize/route.ts     # 生成 AI 友善总结
components/
  LoginGate.tsx              # 票据检票口登录
  Workbench.tsx              # 工作台 + 配置选择
  CompletionPanel.tsx        # 完成面板（预览/下载/继续）
  SlidePreview.tsx           # 页内预览
lib/
  presets.ts                 # 风格/语言预设
  generate-pptx.ts           # pptxgenjs 生成（按风格色板）
  generate-html.ts           # 自包含 HTML 生成（按风格色板）
```
