# Spec Delta

## Purpose

约束 Wizard 向导流程的行为正确性：步骤路由与 draft.step 一致、黑名单拦截页不可绕过、草稿恢复后按需补查位次、诊断页导航指向正确入口、演示数据标记完整。

## ADDED Requirements

### Requirement: Wizard 步骤路由一致性

/wizard/:step 路由 MUST 覆盖所有合法步骤值（1-6）。draft.step 的值 MUST 与当前 URL 路由一致。刷新页面后 MUST 能从 draft.step 恢复到正确步骤。

#### Scenario: Step 6 路由存在

- **WHEN** 用户提交 Step5Identity 后跳转 /wizard/6
- **THEN** WizardLayout 渲染 BlacklistGate 组件，不重定向到其他步骤

#### Scenario: 刷新 Step 6 保持拦截

- **WHEN** 用户在 /wizard/6 刷新页面
- **THEN** 从 localStorage 恢复 draft.step===6，WizardLayout 重新渲染 BlacklistGate，拦截态不丢失

#### Scenario: 无效步骤重定向

- **WHEN** 访问 /wizard/0 或 /wizard/99
- **THEN** 重定向到 /wizard/1

### Requirement: 黑名单拦截不可绕过

BlacklistGate MUST 作为 WizardLayout step 6 渲染，不依赖 PlanPage 的本地状态。用户 MUST 经过 BlacklistGate 确认后才能进入 /plan 查看最终方案。PlanPage MUST NOT 包含 gateAck 或类似的拦截确认状态。

#### Scenario: 黑名单拦截在 Wizard 层完成

- **WHEN** 用户在 Step5Identity 点击提交且方案存在黑名单拦截
- **THEN** 跳转到 /wizard/6 而非 /plan，BlacklistGate 展示被拦截志愿

#### Scenario: 确认拦截后进入方案

- **WHEN** 用户在 BlacklistGate 点击"继续拦截"
- **THEN** 跳转到 /plan，PlanPage 直接展示最终方案，不再渲染 BlacklistGate

#### Scenario: 移出黑名单后重算

- **WHEN** 用户在 BlacklistGate 点击"移出黑名单"
- **THEN** dispatch 更新 majorBlacklist 偏好并跳转 /plan，方案自动重算

### Requirement: 按钮文案与跳转目标一致

Wizard 中每个"下一步"按钮的文案 MUST 准确描述跳转目标。按钮文案不得使用"查看方案"等暗示直接跳到方案页的措辞（实际跳转到下一步骤采集页时）。

#### Scenario: Step2Score 按钮文案

- **WHEN** 用户在 Step2Score 填入有效总分
- **THEN** 按钮文案为"下一步"，点击后跳转 /wizard/3（权重预设页）

### Requirement: 诊断页导航指向正确入口

NoMatchDiagnosis 的返回按钮 MUST 跳转到能修改地域偏好和专业黑名单的步骤（/wizard/4 对话式意向页），而非仅能修改权重的 /wizard/3。按钮文案 MUST 与实际跳转目标一致。

#### Scenario: 诊断页返回对话式意向页

- **WHEN** 用户在 NoMatchDiagnosis 点击"返回修改意向"
- **THEN** 跳转到 /wizard/4（对话式意向页），用户可修改地域偏好和黑名单

### Requirement: 演示数据标记完整

方案页 MUST 在标题区明确标注"演示数据"字样。所有来自 mock/ 目录的数据在 UI 上的呈现 MUST 可被用户识别为演示数据。

#### Scenario: 方案页标题含演示数据标记

- **WHEN** 用户查看方案页
- **THEN** 页面标题包含"示意方案·演示数据"字样

### Requirement: 草稿恢复后按需补查位次

当从 localStorage 恢复草稿时，若考生已填总分和省份及选科但 systemRank 缺失，系统 MUST 自动触发一次位次反查补填。若 systemRank 已存在则不重复反查。

#### Scenario: 草稿有总分无位次时补查

- **WHEN** 草稿恢复时 profile.totalScore 有值、profile.province 有值、profile.track 有值，但 profile.systemRank 为 undefined
- **THEN** 自动调用 rankService.lookupRank 补查位次并 dispatch 写入 systemRank

#### Scenario: 草稿有位次时不重复反查

- **WHEN** 草稿恢复时 profile.systemRank 已有值
- **THEN** 不触发额外的 rankService.lookupRank 调用

### Requirement: 模块级可变状态消除

Wizard 组件中不得使用模块级 let 变量存储可变 ID 或类似状态。此类状态 MUST 使用 useRef 或 crypto.randomUUID() 管理。

#### Scenario: Step4Chat 消息 ID 不跳号

- **WHEN** React StrictMode 双渲染 Step4Chat 组件
- **THEN** 消息 ID 不因双渲染而跳号，使用 useRef 维护递增计数器
