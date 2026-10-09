# Design

## Context

初版前端代码已通过双轴审查（Standards + Spec），发现 12 条需修复项。项目采用分层架构（types -> data -> engine -> services -> store -> components -> pages），零外部状态管理依赖（Context + useReducer），CSS 变量 token 系统。当前 tokens.css 有 48 行，组件 CSS 中存在约 67 处硬编码色值。WizardLayout 的 VALID_STEPS 为 [1,2,3,4,5]，step 6 语义在 PlanPage 内用 gateAck 本地状态实现。

## Goals / Non-Goals

**Goals:**
- 消除所有 Standards 轴硬违规（阈值硬编码、CSS 色值、reducer 纯度）
- 消除所有 Spec 轴实现有误（按钮文案、诊断页导航）
- 消除合规红线边缘风险（BlacklistGate step 6 路由一致性）
- 保持分层架构约束不变（engine 不 import services 等）

**Non-Goals:**
- 不改变 PRD 定义的功能范围
- 不新增 npm 依赖
- 不重构组件层次结构
- 不改变 mock 数据内容

## Decisions

### D1: 计划变动阈值外置 (S1)

在 thresholds.json 的 confidence 段新增 `"planChangeThreshold": 20`。probability.ts 改用 `T.confidence.planChangeThreshold`。

**备选**: 把整个 confidenceScore 函数参数化——过度设计，MVP 不需要。

### D2: CSS token 全量替换 (S4)

在 tokens.css 新增以下 token：
- `--c-white: #ffffff` — 语义独立的纯白（与 --c-card 分离）
- 白色透明变体: `--c-white-a30`, `--c-white-a70`, `--c-white-a90`, `--c-white-a96`
- sky 透明变体: `--c-sky-a08`, `--c-sky-a10`, `--c-sky-a14`
- mint 透明变体: `--c-mint-a10`, `--c-mint-a12`
- sky-ink 透明变体: `--c-sky-ink-a18`, `--c-sky-ink-a25`
- rush 透明变体: `--c-rush-a08`, `--c-rush-a10`
- ink 透明变体: `--c-ink-a42`
- danger 透明变体: `--c-danger-a35`
- 文字色: `--c-rush-text: #c96f14`, `--c-bg-alt: #e2ecf3`

icons.tsx 中 `#9FB6C9` 改为 `var(--c-icon-muted)`，`#fff` 改为 `var(--c-white)`。

**备选**: 只定义高频 token（4个），低频保留原值加注释——标准仍有缺口，不采用。

### D3: Step 6 路由——BlacklistGate 移入 WizardLayout (S5)

- WizardLayout: `VALID_STEPS` 加 6，stepNum===6 时渲染 BlacklistGate
- BlacklistGate 需要 plan prop：WizardLayout step 6 内部调用 `buildPlanFor(profile, preferences)` 获取
- Step5Identity: submit 从 `navigate('/plan')` 改为 `navigate('/wizard/6')`
- PlanPage: 删除 `gateAck` state、删除 BlacklistGate 渲染分支、保留 NoMatchDiagnosis 和正常方案展示
- BlacklistGate onContinue: `navigate('/plan')`；onRemove: dispatch UPDATE_PREFS + `navigate('/plan')`

**备选 A**: AppContext 初始化时恢复 gateAck——掩盖路由不一致，不采用。
**备选 B**: /wizard/6 重定向到 /plan——过路式路由，没真正解决，不采用。
**注意**: WizardLayout step 6 和 PlanPage 各自调用 buildPlanFor()，mock 阶段延迟 200-400ms 可接受。见 ADR-0001。

### D4: Reducer 纯化——wrapper dispatch (S8)

在 AppProvider 内包装 dispatch：对 UPDATE_PROFILE/UPDATE_PREFS/GOTO_STEP 三种 action 自动注入 `updatedAt: new Date().toISOString()`。reducer 内部不再调用 `new Date()`。11 处 dispatch 调用点零改动。

**备选**: 11 处调用方各加 `updatedAt`——散改面广，bug 面大，不采用。

### D5: expandRegion 提取到 data 层 (S9)

新建 `src/data/regionUtils.ts`，导出 `expandRegion(region: string): string[]`。内部 import provinces.json 的 regionTags。engine/degrade.ts 和 services/provinceService.ts 改为 import 此模块。

**备选**: 放到 engine/ 下让 services import——违反 services 不依赖 engine 的约定方向（虽然实际允许，但 data 层更自然）。

### D6: 位次补查放在组件层 (S11)

在 Step25Preview 组件（或 WizardLayout step 3 入口）加 useEffect：若 `profile.totalScore && profile.province && profile.track && profile.systemRank === undefined`，触发 `rankService.lookupRank`。

**备选**: 在 AppContext init 内反查——store 层引入 services 依赖，破坏关注点分离，不采用。

### D7: subScores debounce + goNext 补偿 (S12)

Step2Score 的 subScores useEffect 加 300ms setTimeout debounce。goNext 函数内同步 dispatch 一次 subScores（确保 debounce 未落下的数据不丢）。

**备选**: 改为 onBlur 提交——移动端用户可能直接点底部按钮不触发 blur，不采用。

## Risks / Trade-offs

- **[S5 plan 双算]** WizardLayout step 6 和 PlanPage 各调 buildPlanFor() → mock 阶段可接受，将来接后端时 service 层可加缓存
- **[S4 token 膨胀]** tokens.css 从 48 行增至约 70 行 → 可接受，它是全局改肤唯一入口，完整性优先
- **[S8 wrapper dispatch 隐蔽]** 调用方看不到 updatedAt 注入 → 通过 AppProvider 注释和 TypeScript 类型约束使行为可见
- **[S5 刷新时 plan 异步加载]** /wizard/6 刷新后 BlacklistGate 需等 buildPlanFor 异步返回 → 加 loading 态，与 PlanPage 现有 loading 行为一致

## Migration Plan

1. Phase 1（独立低风险项 S1/S2/S3/S6/S9/S10）→ 提交一次
2. Phase 2（中等复杂项 S4/S8/S11/S12）→ 提交一次
3. Phase 3（架构变更 S5）→ 提交一次
4. 每个 Phase 后运行 `npm run build` 验证编译通过
5. Phase 3 后手动验证完整 Wizard 流程（含刷新）

无回滚风险：所有修改都是代码层面的，不涉及数据迁移或不可逆操作。
