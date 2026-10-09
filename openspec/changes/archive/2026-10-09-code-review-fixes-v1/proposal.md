# Proposal

## Why

初版前端代码通过了 Standards + Spec 双轴审查，发现 3 条硬违规、3 条判断性建议、2 处实现有误、3 处部分实现和 1 处范围蔓延。这些问题中包含影响功能正确性的 bug（按钮文案误导、NoMatchDiagnosis 跳转错误）和与合规红线相关的路由一致性隐患（BlacklistGate step 6），需要在 MVP 迭代前修复。

## What Changes

- **S1**: probability.ts 中硬编码的计划变动阈值 20 移入 thresholds.json 的 confidence.planChangeThreshold 字段
- **S2**: Step2Score.tsx 按钮文案从"查看方案示意"改为"下一步"
- **S3**: NoMatchDiagnosis.tsx 返回导航从 /wizard/3 改为 /wizard/4，文案从"返回修改意向（权重/地域/黑名单）"改为"返回修改意向"
- **S4**: tokens.css 新增 --c-white 及约 15 个透明变体 token；16 个 .module.css 文件和 icons.tsx 中约 67 处硬编码色值替换为 token 引用
- **S5**: /wizard/6 路由正式建立，BlacklistGate 作为 WizardLayout step 6 渲染；PlanPage 删除 gateAck 本地状态和 BlacklistGate 渲染逻辑；Step5Identity 提交跳转从 /plan 改为 /wizard/6
- **S6**: PlanPage 标题从"示意"改为"示意方案·演示数据"
- **S8**: AppContext reducer 纯化——updatedAt 时间戳通过 wrapper dispatch 注入，reducer 不再调用 new Date()
- **S9**: 提取 expandRegion 到 src/data/regionUtils.ts，engine/degrade.ts 和 services/provinceService.ts 共用
- **S10**: Step4Chat.tsx 模块级 let nextId = 1 改为 useRef
- **S11**: Step25Preview 组件在草稿恢复后按需触发 rankService.lookupRank 补查位次
- **S12**: Step2Score.tsx subScores dispatch 加 300ms debounce，goNext 时同步补偿提交

## Capabilities

### New Capabilities
- `code-quality`: 前端代码质量标准——涵盖 token 合规、reducer 纯度、共享工具函数归属等编码规范约束
- `wizard-flow`: Wizard 流程正确性——涵盖步骤路由一致性、黑名单拦截不可绕过、草稿断点续填、诊断页导航等行为约束

### Modified Capabilities

（无——项目当前无已存 specs）

## Impact

- **核心引擎**: engine/probability.ts（S1 阈值外置）、engine/degrade.ts（S9 函数提取）
- **状态管理**: store/AppContext.tsx（S8 reducer 纯化）
- **路由**: App.tsx（无需改）、WizardLayout.tsx（S5 step 6）、Step5Identity.tsx（S5 跳转目标）
- **页面**: PlanPage.tsx（S5+S6 删 gateAck + 标题）、Step2Score.tsx（S2+S12 文案+debounce）、NoMatchDiagnosis.tsx（S3 导航）、Step25Preview.tsx（S11 补查）
- **组件**: BlacklistGate.tsx（S5 移入 WizardLayout）、Step4Chat.tsx（S10 nextId）
- **样式**: styles/tokens.css + 16 个 .module.css（S4 token 化）、icons.tsx（S4 色值）
- **数据**: data/config/thresholds.json（S1 新增字段）、data/regionUtils.ts（S9 新建）
- **无依赖变更**：不新增 npm 包，不改变构建流程
