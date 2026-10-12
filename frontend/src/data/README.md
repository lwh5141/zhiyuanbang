# 数据层：静态配置 vs 动态数据

本目录把**业务逻辑与数据解耦**：所有数据以 JSON 存储，代码只负责逻辑，不内联数据。按「谁产出这份数据」分成两类：

| 目录 | 名称 | 谁产出 | 变更是否要回归 | 举例 |
|------|------|--------|----------------|------|
| `config/` | **静态配置** | 前端常量（随代码发布） | 是（改了要回归测试） | 阈值口径、省份模式、权重预设、选科选项 |
| `mock/` | **动态数据** | 后端返回（当前为演示数据） | 否（数据变了不影响引擎逻辑） | 一分一段表、候选库、往届去向、政策 |

> 命名约定：静态配置 `*.json`；动态数据 `*.gd.json`（`.gd` = 广东首发省，将来按省拆分，如 `candidates.zj.json`）。

## 判定规则（新增数据时怎么归类）

1. **枚举 / 口径 / 文案模板 / 校验边界 / 计时参数** → 静态配置（`config/`）
2. **一条条可被后端查询、分省、随年份更新的业务事实** → 动态数据（`mock/`，接后端后替换）
3. 拿不准时问：**「这份数据改了，需不需要重新回归引擎逻辑？」** 需要 → 静态；不需要 → 动态。

## 静态配置清单（config/）

| 文件 | 内容 | 消费方 |
|------|------|--------|
| `thresholds.json` | 引擎口径：梯度分界 40/75/95、基准配比 2:3:3:2、预设配比表、降级顺序、置信度参数、概率模型参数、候选过滤口径、完整度权重 | engine/（ratio、probability、degrade、completeness、planBuilder） |
| `provinces.json` | 省份清单与高考模式（mode/batchMode/志愿数/基准配比）、经济圈标签映射 | provinceService、engine/planBuilder、data/regionUtils |
| `app.json` | 应用元数据（品牌/高考日/首发省）、Wizard 结构（步骤名/合法步骤）、校验边界（0–750、<100、偏差>500）、计时参数（Toast/防抖/mock 延迟） | 各页面、StepHeader、WizardLayout、useToast、draftStore、services |
| `subjects.json` | 选科模式选项（首选物理/历史、再选化学/生物/地理/政治）、单科键（语文/数学/英语） | Step1Location、Step2Score、draftStore |
| `weightPresets.json` | S3 权重三选一预设（保专业/保学校/保城市）+ 三档微调 | Step3Preset |
| `gradients.json` | 四梯度定义（冲/稳/保/垫顺序 + CSS 配色变量） | PlanPage、GradientBar |
| `majors.json` | 专业大类白名单（LLM 输出与黑名单选择的合法枚举） | llmService、Step4Chat |
| `specialIdentities.json` | 特殊身份选项清单（hidden 项 V1 隐藏） | Step5Identity |
| `llmRules.json` | Mock LLM 关键词解析规则（地域否定词、专业规则、权重规则） | llmService（第⑩步接真实大模型后退役） |

## 动态数据清单（mock/，将来由后端返回）

| 文件 | 内容 | 消费方 | 后端接口（第⑩步） |
|------|------|--------|-------------------|
| `scoreRank.gd.json` | 广东一分一段示意映射表（分数→位次→百分比） | rankService | `GET /rank-table?province&track&year` |
| `candidates.gd.json` | 广东院校专业组候选库（约 45 条） | candidateService | `GET /candidates?province&track&electives` |
| `pastPlans.gd.json` | 往届同位次考生去向示例（按位次分档） | sampleService | `GET /past-plans?rank` |
| `policy.gd.json` | 特殊身份政策示意（省份适用性/加分说明） | Step5Identity | `GET /policy?province&identity` |
| `homeSample.gd.json` | 首页证据条示例与样卡 | HomePage | `GET /home-sample` |

## 迁移到后端时怎么做

前端**不感知**数据来自本地 JSON 还是后端——所有动态数据的读取都经过 `src/services/` 的 async 门面，页面与引擎只调用 service 函数。

接入真实后端时**只改 `services/` 内部实现**（把 `import xxx from '@/data/mock/...'` 换成 `fetch(...)`），页面、引擎、`mock/` 目录下的文件删除即可，其余代码零改动。`config/` 下的静态配置继续保留在前端（除非将来改为配置中心下发）。

## 维护待办

- `thresholds.json.candidateFilter` 与 `probabilityModel` 目前是 mock 口径，第⑩步由后端概率模型输出后，前端只消费结果。
- `mock/*.gd.json` 均为演示数据，UI 上必须带「演示数据 / 示意」字样（合规红线）。
