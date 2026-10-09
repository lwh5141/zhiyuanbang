# 志愿帮（稳录防线）

> 高考志愿填报 APP — 考生成绩/意向采集与智能推荐引擎 V1.0 MVP
>
> 解决"分数定位不准 + 意向表达不出 + 怕错"三大填报低效根因。

## 项目简介

**志愿帮**是一款移动端优先的高考志愿填报辅助 Web 应用。核心设计：

- **规则引擎硬算**：位次换算、四梯度推荐、黑名单拦截全部由规则引擎确定性计算，大模型仅做意向解析与理由生成
- **证据可验证**：每条推荐均可展开查看证据（一分一段表来源、往年位次、概率口径），位次一律系统反查
- **方案高容错**：除"省份+总分"外所有字段可跳过/选"不设限"，边界情况有明确降级策略而非报错
- **首发广东省**：自有数据为地基，2027 填报季灰度上线

## 技术栈

| 层 | 技术 | 说明 |
|---|---|---|
| 语言 | TypeScript（严格模式） | 类型即文档，与未来 FastAPI 后端 Pydantic 模型一一对应 |
| 构建 | Vite 5 | 零配置即用，HMR 快 |
| 框架 | React 18 | 原型即为 React 18 单文件，直接平移 |
| 路由 | react-router-dom 6 | 三 Tab + 独立向导流 |
| 状态管理 | Context + useReducer | 零外部依赖，草稿自动保存到 localStorage |
| 样式 | CSS Variables + CSS Modules | 青空薄荷设计 Token，全局改肤只需改 tokens.css |
| 组件库 | 无 | 全自定义视觉，零重组件库依赖 |
| 开发工具 | OpenSpec + Graphify | 规格驱动开发 + 代码知识图谱 |

运行时依赖仅 `react` / `react-dom` / `react-router-dom`，无 UI 框架、无图表库、无日期库。

## 快速开始

### 环境要求

- [Node.js](https://nodejs.org/) 18+（推荐 22+）
- npm 10+（随 Node 安装）

### 启动方式

**方式一：双击启动（推荐）**

1. 进入 `frontend/` 目录
2. 双击 `start-frontend.bat`
3. 浏览器打开 http://localhost:3000

**方式二：命令行启动**

```bash
cd frontend
npm install
npm run dev
```

> 首次运行需联网下载依赖；之后可离线启动。
>
> 端口说明：Vite 默认 5173 在部分 Windows 机器上会落入 Hyper-V/WSL 保留端口段，本工程已固定改用 3000。

### 构建验证

```bash
cd frontend
npm run build      # tsc -b && vite build
npm run typecheck  # 仅类型检查
```

### 体验建议

浏览器按 F12 打开开发者工具 → 切换到手机视口（宽度 ≤480px），移动端体验最佳。

## 项目结构

```
志愿填报APP/
├── frontend/                    # 前端应用（Vite + React + TS）
│   ├── src/
│   │   ├── types/               # 领域类型（5 个文件，TS 即文档）
│   │   ├── data/
│   │   │   ├── config/          # 静态配置（省份/阈值/身份，随代码发布）
│   │   │   ├── mock/            # 演示数据（一分一段/候选库/去向/政策）
│   │   │   └── regionUtils.ts   # 共享工具函数（经济圈标签展开）
│   │   ├── engine/              # 纯函数引擎（无 React、无随机、无时间）
│   │   ├── services/            # async 门面（模拟后端延迟，将来换 fetch）
│   │   ├── storage/             # 存储抽象 + localStorage + 草稿防抖落库
│   │   ├── store/               # Context + useReducer 全局状态
│   │   ├── components/          # 共享组件库（各配同名 .module.css）
│   │   ├── pages/               # 首页/方案页/我的 + wizard/ 采集向导
│   │   └── styles/              # tokens.css + global.css
│   ├── start-frontend.bat       # 双击启动（Windows）
│   └── package.json
│
├── 高考志愿填报数据库/             # 自有数据地基
│   ├── 01_各省分数线/            #   分数线汇总
│   ├── 02_各省位次表/            #   一分一段表
│   ├── 03_大学招生计划/          #   招生计划与录取位次
│   └── 04_专业招生详情/          #   各专业招生人数
│
├── 志愿帮-首页原型/               # 设计原型（HTML）
│   └── 志愿帮-首页原型.html
│
├── docs/                        # 项目文档
│   ├── system_design.md         #   系统设计文档
│   ├── class-diagram.mermaid    #   类图
│   ├── sequence-diagram.mermaid #   时序图
│   ├── adr/                     #   架构决策记录
│   │   └── 0001-blacklist-gate-as-wizard-step-6.md
│   └── agents/                  #   Agent skills 配置
│
├── openspec/                    # OpenSpec 规格驱动开发
│   ├── specs/                   #   主规格
│   │   ├── code-quality/spec.md
│   │   └── wizard-flow/spec.md
│   └── changes/                 #   变更历史（已归档）
│
├── graphify-out/                # 代码知识图谱（自动生成，勿手动编辑）
│
├── prd-gaokao-volunteer-engine-2026-09-23.md  # PRD 规格书
├── RAG系统方案.md                # RAG 系统方案设计
├── CONTEXT.md                   # 领域术语表
├── AGENTS.md                    # Agent skills 配置
└── .gitignore
```

## 核心功能

### Wizard 采集向导（5 步 ≤8 项输入）

| 步骤 | 路由 | 功能 |
|------|------|------|
| Step 1 | `/wizard/1` | 省份选择 + 选科（即时校验） |
| Step 2 | `/wizard/2` | 总分输入 + 位次系统反查 + S2.5 粗结果预览 |
| Step 3 | `/wizard/3` | 权重预设（保专业/保学校/保城市）+ 微调 |
| Step 4 | `/wizard/4` | 对话式意向解析（大模型白名单防线） |
| Step 5 | `/wizard/5` | 特殊身份识别 |
| Step 6 | `/wizard/6` | 黑名单拦截确认（不可绕过） |
| 方案 | `/plan` | 四梯度方案 + 证据条 + 合规标注 |

### 四梯度推荐

| 梯度 | 概率区间 | 颜色 |
|------|----------|------|
| 冲 | <40% | 橙 `#FF9F43` |
| 稳 | 40–75% | 蓝 `#2D9CDB` |
| 保 | 75–95% | 绿 `#27C493` |
| 垫 | >95% | 灰蓝 `#7C9CBF` |

基准配比 冲:稳:保:垫 = 2:3:3:2，随预设权重和微调档动态调整。

### 降级策略

候选不足时按固定顺序放宽条件，全程向用户明示：

1. **L1**：放开院校层次下限（含公办/民办偏好）
2. **L2**：扩大地域范围

> 专业黑名单为绝对约束，任何情况下不进入降级。

## 关键口径

所有阈值只维护在 `frontend/src/data/config/thresholds.json`，代码零硬编码：

- 概率阈值：冲 <40% / 稳 40–75% / 保 75–95% / 垫 >95%
- 基准配比：冲:稳:保:垫 = 2:3:3:2
- 广东 45 个平行志愿
- L1→L2 降级顺序固定
- 计划变动惩罚阈值：20%（待 PRD 确认）

## 合规红线

1. 方案页强制携带合规标注：「本方案由规则引擎计算，仅供参考，以广东省考试院官方公布为准」
2. 全站禁止「保录取 / 确保上线 / 百分百 / 内部渠道 / 官方合作」类话术
3. 概率只以「区间」表述，不承诺结果
4. 黑名单拦截页不可绕过；降级全程明示；候选=0 必须出诊断页
5. 所有 mock 数据在 UI 上标注「演示数据」或「示意」

## 开发工具

| 工具 | 用途 |
|------|------|
| [OpenSpec](https://github.com/Fission-AI/OpenSpec) | 规格驱动开发——proposal → specs → design → tasks → apply → archive |
| [Graphify](https://github.com/safishamsi/graphify) | 代码知识图谱——AST 提取 + 社区检测 + 交互式可视化 |
| GitHub Issues | Issue 跟踪（`lwh5141/zhiyuanbang`） |

## 相关文档

- [PRD 规格书](prd-gaokao-volunteer-engine-2026-09-23.md) — 完整需求规格
- [系统设计文档](docs/system_design.md) — 技术架构与文件列表
- [领域术语表](CONTEXT.md) — 核心业务概念定义
- [ADR-0001](docs/adr/0001-blacklist-gate-as-wizard-step-6.md) — BlacklistGate 路由决策
- [前端 README](frontend/README.md) — 前端工程详细说明
- [RAG 系统方案](RAG系统方案.md) — RAG 检索增强方案

## 项目仓库

[https://github.com/lwh5141/zhiyuanbang](https://github.com/lwh5141/zhiyuanbang)

## License

MIT
