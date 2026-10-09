# 志愿帮（高考志愿填报 APP）· 项目长期记忆

## 产品
- 正式名「志愿帮」（PRD 文本内暂用名仍为"稳录防线"，改 PRD 时需同步品牌名）
- 首发：广东省（3+1+2 院校专业组，45 平行志愿）；PRD：prd-gaokao-volunteer-engine-2026-09-23.md

## 前端定案（2026-09-24，V1.0 MVP 已交付）
- 工程：`frontend/`，Vite 5 + React 18 + **TypeScript 严格模式** + react-router-dom v6
- 样式：CSS Variables（src/styles/tokens.css，青空薄荷：#2D9CDB/#27C493/#F4FAFD/#16324A，四梯度 #FF9F43/#2D9CDB/#27C493/#7C9CBF）+ CSS Modules；**禁** Tailwind/组件库/在线字体（系统字体栈）
- 状态：Context+useReducer 唯一 Draft；草稿经 StorageAdapter 接口 + LocalStorageAdapter + 500ms 防抖（将来换云端只换实现）
- 分层铁律：engine/ 纯函数（禁 Date.now/随机）→ services/ async 门面（延迟模拟只在此层）→ store → pages
- **口径零硬编码**：概率阈值 40/75/95、配比 2:3:3:2、45 志愿、L1→L2 降级顺序、完整度权重，全部只进 `src/data/config/thresholds.json`
- 数据分离：`src/data/config/`＝静态配置；`src/data/mock/`＝演示动态数据（全标"演示数据"）——第⑧步解耦的地基，mock 数据改内容前端即变
- 启动：双击 `frontend/start-frontend.bat`（纯 ASCII，用户环境要求长任务必须可见终端运行，AI 侧禁跑 npm install）→ **http://localhost:3000**（Vite 默认 5173 落在本机 Hyper-V 排除段 5153-5252 会报 EACCES，已固定换 3000；Windows 选 dev 端口避开 4200-9600 聚集区）
- 合规红线：方案页必带"仅供参考，以广东省考试院官方公布为准"；禁"保录取/确保上线/百分百/内部渠道/官方合作"；概率只讲区间；黑名单拦截不可绕过

## 已知待办
- P2-2：candidateService σ=8%/freq 钳位 5-95 演示口径 → 第⑩步接后端时迁入 thresholds.json（README 已记）
- 历史类一分一段为构造示意数据，待真实数据替换
- 后端路线：FastAPI（services 层换 fetch 即可）→ DeepSeek 意向解析 → 登录系统

## 开发协作
- 用户路线图见 `志愿填报APP.md`（15 步：前端已完成第⑥步，后续第⑦步前端优化、第⑧步解耦验证）
- 长任务（npm install 等）一律生成 .bat 由用户双击运行，终端必须可见
