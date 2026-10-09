# BlacklistGate 作为 Wizard Step 6 路由而非 PlanPage 内部状态

黑名单确认页（BlacklistGate）原本在 PlanPage 内用 gateAck 状态渲染，/wizard/6 路由不存在。这意味着刷新后 gateAck 重置——虽然保守安全（重新拦截），但 step=6 的状态与路由不一致，与"黑名单不可绕过"红线存在边缘风险。改为将 BlacklistGate 作为 WizardLayout 的 step 6 渲染，VALID_STEPS 包含 6，PlanPage 去掉 gateAck 逻辑。被否决的方案是在 AppContext 初始化时用状态恢复模拟路由——改动小但路由仍然不存在，只是掩盖了不一致。

**Considered Options**: 新增 /wizard/6 路由（采用）vs AppContext 状态恢复（否决）
**Consequences**: 草稿恢复时 draft.step===6 可直接导航到 /wizard/6，刷新安全；BlacklistGate 从 PlanPage 移入 WizardLayout，PlanPage 不再持有拦截态
