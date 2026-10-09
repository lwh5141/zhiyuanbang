# Tasks

## 1. Phase 1: 独立低风险修复 (S1/S2/S3/S6/S9/S10)

- [x] 1.1 S1: 在 thresholds.json 的 confidence 段新增 `"planChangeThreshold": 20` 字段，注释标注"待 PRD 确认"；将 probability.ts 中 `Math.abs(planChangePct) > 20` 改为 `Math.abs(planChangePct) > T.confidence.planChangeThreshold`。验证：grep 确认 probability.ts 中无裸数字 20 作为阈值
- [x] 1.2 S2: 将 Step2Score.tsx 第 194 行按钮文案从 `'查看方案示意'` 改为 `'下一步'`。验证：页面渲染显示"下一步"
- [x] 1.3 S3: 将 PlanPage.tsx 第 121 行 NoMatchDiagnosis 的 onBack 从 `navigate('/wizard/3')` 改为 `navigate('/wizard/4')`；将 NoMatchDiagnosis.tsx 第 29 行文案从"返回修改意向（权重/地域/黑名单）"改为"返回修改意向"。验证：诊断页点击返回跳转到 /wizard/4
- [x] 1.4 S6: 将 PlanPage.tsx 方案标题从"示意"改为"示意方案·演示数据"。验证：方案页标题区显示完整标记
- [x] 1.5 S9: 新建 `src/data/regionUtils.ts`，导出 `expandRegion(region: string): string[]`，内部 import provinces.json 的 regionTags；将 engine/degrade.ts 的 expandRegion 改为 import 自 regionUtils；将 services/provinceService.ts 的 expandRegionTag 改为 re-export 或 import 自 regionUtils。验证：grep 确认 degrade.ts 和 provinceService.ts 不再各自实现 REGION_TAGS 查找逻辑
- [x] 1.6 S10: 将 Step4Chat.tsx 模块级 `let nextId = 1` 改为 `const nextIdRef = useRef(1)`，两处 `nextId++` 改为 `nextIdRef.current++`。验证：React StrictMode 下消息 ID 不跳号
- [x] 1.7 运行 `npm run build` 验证 Phase 1 所有改动编译通过

## 2. Phase 2: 中等复杂修复 (S4/S8/S11/S12)

- [x] 2.1 S4-token: 在 tokens.css 新增以下 CSS 变量并赋值：`--c-white`、`--c-white-a30`、`--c-white-a70`、`--c-white-a90`、`--c-white-a96`、`--c-sky-a08`、`--c-sky-a10`、`--c-sky-a14`、`--c-mint-a10`、`--c-mint-a12`、`--c-sky-ink-a18`、`--c-sky-ink-a25`、`--c-rush-a08`、`--c-rush-a10`、`--c-ink-a42`、`--c-danger-a35`、`--c-rush-text`、`--c-bg-alt`。验证：tokens.css 包含所有新变量
- [x] 2.2 S4-css: 替换 16 个 .module.css 文件中约 67 处硬编码色值为 token 引用（#fff -> var(--c-white)、rgba(255,255,255,X) -> var(--c-white-aXX) 等）。验证：grep 确认 .module.css 文件中无 #fff、#ffffff 或裸 rgba() 字面量
- [x] 2.3 S4-icons: 将 icons.tsx 中 IcChevron 默认 `'#9FB6C9'` 改为 `'var(--c-icon-muted)'`，IcPlay 默认 `'#fff'` 改为 `'var(--c-white)'`，IcCheck 内 `stroke="#fff"` 改为 `stroke="var(--c-white)"`。验证：icons.tsx 中无 #hex 字面量
- [x] 2.4 S8: 在 AppContext.tsx 的 AppProvider 内创建 wrapper dispatch，对 UPDATE_PROFILE/UPDATE_PREFS/GOTO_STEP 自动注入 `updatedAt: new Date().toISOString()`；reducer 内三处 `new Date().toISOString()` 删除，改为读取 `action.updatedAt`；AppAction 类型三处加 `updatedAt: string` 字段。验证：reducer 函数内 grep 不到 new Date
- [x] 2.5 S11: 在 Step25Preview 组件（或 WizardLayout step 3 入口处）加 useEffect：条件 `profile.totalScore && profile.province && profile.track && profile.systemRank === undefined` 时调用 `rankService.lookupRank` 并 dispatch 写入。验证：草稿恢复后若有总分无位次则自动补查
- [x] 2.6 S12: 在 Step2Score.tsx 的 subScores useEffect 中加 300ms setTimeout debounce（return clearTimeout 清理）；在 goNext 函数内同步 dispatch 一次 `{ type: 'UPDATE_PROFILE', patch: { subScores } }` 确保未落下的数据不丢。验证：快速输入时 dispatch 频率降低，点击下一步时 subScores 已落入 state
- [x] 2.7 运行 `npm run build` 验证 Phase 2 所有改动编译通过

## 3. Phase 3: Step 6 路由架构变更 (S5)

- [x] 3.1 WizardLayout: 将 `VALID_STEPS` 从 `[1,2,3,4,5]` 改为 `[1,2,3,4,5,6]`；在 content 渲染逻辑中加入 stepNum===6 分支渲染 BlacklistGate；step 6 需要异步获取 plan——在 WizardLayout 内加 useState+useEffect 调用 `buildPlanFor(profile, preferences)`，plan 加载完成前显示 loading 态。验证：访问 /wizard/6 渲染 BlacklistGate 而非重定向
- [x] 3.2 BlacklistGate 适配: BlacklistGate 的 onContinue 改为 `navigate('/plan')`；onRemove 改为 dispatch UPDATE_PREFS + `navigate('/plan')`；这些回调从 WizardLayout 传入而非 PlanPage。验证：BlacklistGate 两个按钮跳转到 /plan
- [x] 3.3 Step5Identity: 将 submit 函数中 `navigate('/plan')` 改为 `navigate('/wizard/6')`。验证：提交后跳转到 /wizard/6
- [x] 3.4 PlanPage 清理: 删除 `gateAck` state、删除 BlacklistGate import 和渲染分支（第 123-131 行）；保留 NoMatchDiagnosis 分支和正常方案展示。验证：PlanPage 中 grep 不到 gateAck
- [x] 3.5 运行 `npm run build` 验证编译通过
- [x] 3.6 手动验证完整 Wizard 流程：从 step 1 走到 step 6（含黑名单拦截场景） -> 确认拦截 -> 进入 /plan 查看方案；在 /wizard/6 刷新页面 -> 确认 BlacklistGate 重新渲染



