# Spec Delta

## Purpose

约束前端代码的编码规范合规性：CSS 色值必须通过 token 引用、引擎阈值必须外置到配置文件、reducer 必须是纯函数、共享工具函数必须有单一归属。

## ADDED Requirements

### Requirement: 概率阈值零硬编码

引擎中所有概率口径阈值（梯度分界值、置信度参数、计划变动惩罚阈值）MUST 全部从 thresholds.json 读取，禁止在 TypeScript 文件中出现硬编码数字。

#### Scenario: 计划变动阈值从配置读取

- **WHEN** confidenceScore 函数判断计划变动是否触发惩罚
- **THEN** 阈值从 thresholds.json 的 confidence.planChangeThreshold 字段读取，代码中不出现裸数字

#### Scenario: 阈值配置可独立修改

- **WHEN** 修改 thresholds.json 中 planChangeThreshold 的值
- **THEN** 引擎行为立即跟随变化，无需修改任何 .ts 文件

### Requirement: CSS 色值 token 合规

所有 .module.css 文件和 icons.tsx 中的色值 MUST 引用 tokens.css 中定义的 CSS 变量，禁止直接写 #hex 或 rgba() 字面量。tokens.css MUST 提供完整的透明变体 token 覆盖所有使用场景。

#### Scenario: 组件 CSS 无硬编码色值

- **WHEN** 审查任意 .module.css 文件
- **THEN** 不出现 #fff、#ffffff、rgba(255,255,255,X) 等裸色值字面量，全部替换为 var(--c-xxx) 或 var(--c-xxx-aNN) 引用

#### Scenario: 图标组件无硬编码色值

- **WHEN** 审查 icons.tsx 中任意图标的默认 color 或 stroke 属性
- **THEN** 值为 var(--c-xxx) 形式的 CSS 变量引用，不出现 #hex 字面量

#### Scenario: tokens.css 提供完整透明变体

- **WHEN** 审查 tokens.css
- **THEN** 包含所有被组件使用的透明变体 token（--c-white-a30、--c-white-a90、--c-sky-ink-a25 等），组件 CSS 可直接引用

### Requirement: Reducer 纯度

全局状态 reducer MUST 是纯函数：相同输入产生相同输出，不调用 new Date()、Math.random() 或任何副作用函数。时间戳等副作用 MUST 在 dispatch 包装层注入。

#### Scenario: Reducer 不含时间副作用

- **WHEN** dispatch UPDATE_PROFILE、UPDATE_PREFS 或 GOTO_STEP 动作
- **THEN** reducer 内部不调用 new Date()，updatedAt 字段由 wrapper dispatch 在 action payload 中注入

#### Scenario: 两次相同 dispatch 产生相同状态

- **WHEN** 对同一初始状态 dispatch 两次相同的 action（含相同 updatedAt）
- **THEN** 两次产生的状态完全相同

### Requirement: 共享工具函数单一归属

当 engine 和 services 层需要相同的工具函数时，该函数 MUST 提取到 data 层共享模块，engine 和 services 各自 import，禁止两处各自实现相同逻辑。

#### Scenario: expandRegion 单一来源

- **WHEN** engine/degrade.ts 需要展开经济圈标签为成员城市
- **THEN** 调用 data/regionUtils.ts 导出的 expandRegion 函数，不自行实现 REGION_TAGS 查找逻辑

#### Scenario: services 层复用同一函数

- **WHEN** services/provinceService.ts 需要展开经济圈标签
- **THEN** 调用同一 data/regionUtils.ts 的 expandRegion 函数，不保留重复实现
