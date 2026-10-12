# 志愿帮 · 前端 V1.0 MVP

高考志愿填报 APP 前端（移动端优先 Web App）。技术栈：Vite 5 + React 18 + TypeScript（严格模式），
零组件库、零 UI 框架依赖（运行时依赖仅 react / react-dom / react-router-dom）。

## 如何运行（Windows）

1. 双击 `start-frontend.bat`（自动完成 `npm install` + `npm run dev`）；
2. 浏览器打开 http://localhost:3000 （建议用开发者工具切换到手机视口，宽度 ≤480px 体验最佳）。
   > 端口说明：Vite 默认的 5173 在部分 Windows 机器上会落入系统排除端口段（Hyper-V/WSL 保留），
   > 绑定报 `EACCES: permission denied`，本工程已固定改用 3000。

> 首次运行必须联网下载依赖；之后可离线启动。

## 目录导览（分层架构：types → data → engine → services → store → components → pages）

```
frontend/
├── start-frontend.bat        # 双击启动（Windows）
├── src/
│   ├── types/                # 领域类型（5 个文件，TS 即文档）
│   ├── data/
│   │   ├── config/           # ★静态配置（省份/阈值/特殊身份，随代码发布，修改需回归）
│   │   └── mock/             # ★演示动态数据（一分一段/候选库/去向/政策，将来由后端返回）
│   ├── engine/               # 纯函数引擎（无 React、无随机、无时间 → 可直接复用于 Node 后端）
│   ├── services/             # async 门面（模拟后端延迟；将来第⑩步只改这一层换成 fetch）
│   ├── storage/              # StorageAdapter 接口 + localStorage 实现 + 草稿防抖落库(500ms)
│   ├── store/                # Context + useReducer 全局状态（Draft）
│   ├── components/           # 10 个共享组件（各配同名 .module.css）
│   ├── pages/                # 首页 / 方案页 / 我的 + wizard/ 采集向导
│   └── styles/               # tokens.css（青空薄荷设计 Token）+ global.css
```

## 关键口径（只维护在 `src/data/config/thresholds.json`，代码零硬编码）

- 概率阈值：冲 <40% / 稳 40–75% / 保 75–95% / 垫 >95%，概率只以区间表述；
- 基准配比：冲:稳:保:垫 ≈ 2:3:3:2，随预设×微调档动态调整（45 个平行志愿，广东）；
- 降级顺序固定 L1（放开院校层次下限）→ L2（扩大地域），全程明示；专业黑名单绝对不可放宽。

## 合规红线（已内置）

方案页强制携带合规标注：「本方案由规则引擎计算，仅供参考，以广东省考试院官方公布为准」；
全站无「保录取 / 确保上线 / 百分百 / 内部渠道 / 官方合作」类话术。
所有 `src/data/mock/` 数据在 UI 上均带「演示数据 / 示意」字样。

## 已知待办（第⑩步接入真实后端时处理）

- 把 `src/services/candidateService.ts` 中的两个演示口径挪入 `src/data/config/thresholds.json`：
  ① σ 缺省按往年位次的 8% 推导；② 历史频率因子的钳位范围 5–95%。届时由后端概率模型输出，前端只消费。
