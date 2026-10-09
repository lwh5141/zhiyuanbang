# 高考志愿填报APP — RAG系统三个方案

---

## 前置决策：Embedding 和 Reranker 用本地还是 API？

三个方案都依赖两个核心能力：**文本向量化（Embedding）** 和 **候选重排序（Reranker）**。这两个能力可以本地部署（开源模型），也可以调云厂商 API。以下是完整对比，用于决策。

### BGE-M3 本地部署硬件要求

BGE-M3 是 568M 参数的开源 Embedding 模型。Reranker 用配套的 BGE-Reranker-v2-m3。

| 配置项 | 最低要求 | 推荐配置 |
|-------|---------|---------|
| GPU 显存 | 4 GB（FP16 模式 ~2 GB） | 8 GB（Embedding + Reranker 同时跑 ~4 GB） |
| 系统内存 | 16 GB | 32 GB |
| CPU | 4 核 | 8 核以上 |
| 硬盘 | 10 GB | 50 GB（NVMe SSD） |
| 单条推理耗时(GPU) | ~15ms（RTX 3060） | ~8ms（RTX 4090） |
| 单条推理耗时(CPU) | ~200-250ms（i7-12700K） | — |

**判断标准**：如果你有一块 8GB 以上显存的 NVIDIA 显卡（RTX 2060/3060 及以上），本地部署 BGE-M3 + BGE-Reranker 完全可行，且零成本。如果你没有 GPU 或显存不足 4GB，直接用 API。

### 国内 Embedding API 对比

| 厂商 | 可用模型 | 维度 | 单价(元/千tokens) | 免费额度(新用户) | Reranker |
|------|---------|------|-----------------|----------------|----------|
| **阿里百炼** | text-embedding-v4（基于 Qwen3-Embedding） | 1024（默认，可选 64~2048） | 0.0005 | 100万 tokens（90天） | **qwen3-rerank**（主动推荐替代 gte-rerank，后者 2026.5.30 已下线） |
| **百度千帆** | bge-large-zh / Qwen3-Embedding-0.6B/4B/8B | 1024 | 0.0005 | 企业认证送 ¥1999 津贴 | 无公开 Reranker |
| **智谱AI** | Embedding-2 / Embedding-3 | 未公开 | 0.5（元/百万tokens） | 有（额度未公开） | 无公开 Reranker |
| **讯飞星辰** | 星火 Embedding | 未公开 | 未公开 | 有 | **有 Rerank 服务**（专用接口） |
| **腾讯混元** | 混元 Embedding | 未公开 | 未公开 | 有 | 无公开 Reranker |
| **火山引擎** | doubao-embedding 系列 | 未公开 | 单独报价未公开 | 有 | 无公开 Reranker |

**关键结论**：

1. **Embedding 价格已趋同**：百度千帆和阿里百炼均为 ¥0.0005/千 tokens（即 ¥0.5/百万 tokens），智谱 ¥0.5/百万 tokens。三者几乎同价。你的数据量极小，选哪家嵌入成本都接近于零。
2. **Reranker 只有两家有**：阿里百炼的 qwen3-rerank（2026年新上线，100+语言，单次最多 500 篇文档、每条 4000 tokens）和讯飞星辰的 Rerank 服务。如果你的方案需要 Reranker（方案二/三），阿里百炼是目前最成熟的选择。
3. **推荐组合**：
   - 只用 Embedding：**阿里百炼 text-embedding-v4**（综合最强，Qwen3-Embedding 基座，MTEB 多语言 #1）或**百度千帆 bge-large-zh**（老牌稳定，也可以选千帆上的 Qwen3-Embedding）
   - Embedding + Reranker：**阿里百炼**（text-embedding-v4 + qwen3-rerank，同一平台，免跨厂商鉴权）
   - 有 GPU：**BGE-M3 本地部署**（零成本，三模式检索）

### 本项目三种方案的 Embedding / Reranker 选项

| 方案 | 本地部署可行？ | API 替代 |
|------|:---:|------|
| 方案一 | 需要 ≥4GB 显存 GPU | 阿里百炼 text-embedding-v4 或百度千帆 bge-large-zh |
| 方案二 | 需要 ≥8GB 显存 GPU（Embedding+Reranker 同时跑） | 阿里百炼 text-embedding-v4 + qwen3-rerank |
| 方案三 | 同方案二 | 同方案二 |

**如果你的机器没有符合条件的 GPU，下文方案中的"BGE-M3"统一替换为阿里百炼 text-embedding-v4，"BGE-Reranker-v2-m3"统一替换为阿里百炼 qwen3-rerank。API 调用方式均为 OpenAI 兼容接口，与本地模型调用代码几乎一致。**

---

## 方案一：文件级RAG（轻量）

### 整体思路

将 高考志愿填报数据库 下的 219 个 Markdown 文件作为知识库，逐文件分块（chunking）后用 BGE-M3 做文本向量化，存入 Chroma 向量库。用户查询时，RAG 从 Chroma 中检索最相关的 chunks，将检索结果作为上下文注入 DeepSeek 的 Prompt，让 LLM 基于你的私有数据回答志愿填报问题。

### 技术组件

| 组件 | 选型 | 说明 |
|------|------|------|
| 向量库 | Chroma | `pip install chromadb`，嵌入 Node.js 进程运行，无需独立服务。219 个文件分块后预计产生 2000~5000 个向量，Chroma 轻松处理 |
| Embedding 模型 | BGE-M3 (BAAI/bge-m3) | 1024 维向量，8192 token 上下文窗口，MIT 开源协议，中文语义理解在开源模型中排前列。支持 Dense/Sparse/ColBERT 三种检索模式，本方案只用 Dense 模式 |
| 分块策略 | 递归分块，每块 512 tokens，相邻块重叠 10% | 这是 FloTorch 2026 年 2 月基准测试（50 篇学术论文，90 万 tokens，10+ 学科）中的最优策略，端到端准确率 69%，明显优于语义分块（54%）和固定大小分块（67%） |
| LLM | DeepSeek-V4-Flash | 项目已有的 LLM，不改动。 |

### 分块策略详解

递归分块的具体做法：

1. 先按 Markdown 的一级标题（`#`）切第一刀
2. 如果某段仍超过 512 tokens，再按二级标题（`##`）切
3. 如果还超，按表格边界切（保证不把一张表格切成两半）
4. 如果还超，按段落边界切
5. 最后手段才在段落中间硬切

每个 chunk 的元数据标注：

```
{
  source_file: "2026年全国各省高考分数线汇总.md",
  category: "01_各省分数线",
  year: 2026,
  province: "广东" | null,
  subject_type: "物理类" | "历史类" | null
}
```

元数据的三个作用：(1) 检索时可以按 category/year/province 做预过滤；(2) 给 LLM 的 Prompt 中每条检索结果都会标注来源，让 LLM 知道数据是哪一年的；(3) 如果用户问"只看 2026 年数据"，可以直接用 Chroma 的 `where` 条件过滤。

### 数据摄入流程

**第一步：遍历文件。** 从数据根目录递归读取所有 `.md` 文件，按四类目录（01_各省分数线、02_各省位次表、03_大学招生计划、04_专业招生详情）分别标注 category。

**第二步：解析 Markdown。** 对每个文件做三件事：
- 识别表格：将 Markdown 表格转换为结构化的 JSON 文本（保留原名 + 转成可读的键值对文本），方便后续向量检索时匹配具体数值
- 保留标题层级：每个 chunk 开头带上它在原文中的标题路径，比如 `# 2026年全国各省高考录取分数线汇总 > ## 广东 > ### 物理类`
- 保留段落文本原样

**第三步：标记元数据。** 从文件名和内容中自动提取 province（省份）、year（年份）、subject_type（物理类/历史类）。比如文件名含"广东"则 province="广东"，含"2026"则 year=2026。无法自动提取的字段置为 null。

**第四步：递归分块。** 按上述递归策略切成 512-token 的块，相邻块重叠 51 tokens（10%）。

**第五步：向量化。** 用 BGE-M3 对每个 chunk 做 embedding，得到 1024 维向量。

**第六步：存入 Chroma。** 创建一个名为 `gaokao_knowledge` 的 Collection，把所有向量 + 元数据 + 原文写入。Chroma 数据持久化到本地磁盘，重启不丢失。

以上六步写成 `ingestDocs()` 函数，在服务启动时调用一次（或作为独立脚本手动执行）。

### 检索流程

当用户发起推荐请求（如 POST `/api/recommend`）时：

1. 从用户输入中构建查询文本。例如用户选了"广东省、物理类、600 分、计算机专业偏好"，构造查询字符串：`"广东 物理类 600分 计算机专业 2026年 录取位次 招生计划 冲稳保"`
2. 调用 Chroma 的 `collection.query(query_texts=[...], n_results=20)`，用 BGE-M3 将查询文本向量化，余弦相似度取 top-20
3. 将检索到的 20 个 chunk 的原文按相似度从高到低排列，但根据 LLM 的 U 型注意力特性——LLM 对 Prompt 头部和尾部的内容记忆最好、对中间部分记忆最差——将最高分的 3 个 chunk 放在 Prompt 最前面，次高分的 3 个放在 Prompt 最后面，其余 14 个放中间
4. 拼接进 DeepSeek 的 Prompt 的 `{retrieved_context}` 占位符中

### 与现有推荐流程的集成方式

当前推荐流程分两步：首先从数据库查询录取分数，按冲/稳/保/垫四层分档；然后将分档结果交给大模型排序。改动是在第二步调用大模型之前，插入RAG检索环节：

1. 数据库查询 → 四层分档（现有流程，不动）
2. **RAG检索**：根据用户的条件（省份、科类、分数、位次、专业偏好）构建查询文本，从向量库中检索20条最相关的知识片段
3. **大模型排序**：将检索到的知识片段作为补充上下文，与四层分档结果一起发给大模型，让大模型基于私有数据对候选院校做排序和推荐理由生成

### 效果预期

- 检索到"四川大学 2025 年在广东物理类最低分 625"这种精确数据时，LLM 的回答将从"我推测大约是..."变成"根据 2025 年实际录取数据，四川大学在广东物理类最低分为 625 分"
- 用户问到政策类问题（如"大类招生是什么"）时，LLM 能从你的 2026 年政策数据中找到最新说明
- 纯靠语义相似度的 Dense 检索对数字查询（"625 分"、"位次 8500"）的召回不够精准——这是方案二要解决的

### 局限性

- 查询"四川大学广东 2025 物理类最低分"时，Dense 检索可能返回"四川大学湖南历史类"或"中山大学广东物理类"的 chunk，因为语义上"录取分数线"和"最低分"高度相似，但省份/科类不匹配
- 无法回答结构化查询，比如"列出所有招生超过 8000 人的 985 大学"——这需要把每个 chunk 里的数字都解析出来然后比较，纯向量检索做不到
- 分块后的数据没有"2025 vs 2026"的时效性感知——只能靠 LLM 自己从 chunk 的元数据文本中判断年份优先级

---

## 方案二：混合检索 RAG（中量）

### 整体思路

在方案一的向量检索基础上，引入 BM25 稀疏检索（关键词精确匹配）和 Cross-Encoder 重排序器（Reranker）。将 219 个 MD 文件中的表格数据用 LLM 批量提取为结构化 JSON，存入 Qdrant 的 Payload 字段。检索时 Dense + Sparse 双重召回后做 RRF 融合，再用 BGE-Reranker 对 top-40 候选做精排，取 top-15 注入 Prompt。

### 为什么方案一不够，方案二解决了什么

方案一只有一个 Dense 检索通道。Dense 检索的本质是"语义相似"——"625 分"和"628 分"在语义上几乎一样，但在高考志愿场景中，5 分的差距可能是"冲"和"稳"的分界线。方案一无法区分这种精确数值差异。

方案二加了 BM25 稀疏检索，它做的是**关键词精确匹配**。"四川大学"、"625 分"、"物理类"这些词会被 BM25 精确命中。Dense 负责语义召回（"计算机相关专业"能召回"软件工程""人工智能""信息安全"），Sparse 负责精确召回（"位次 8500"精确命中含"8500"的 chunk），两者 RRF 融合后取长补短。

Reranker 在这之后做第二道过滤——它是一个专门训练的 Cross-Encoder 模型（BGE-Reranker-v2-m3），对每个候选 chunk 和查询做深度匹配打分，比 Embedding 模型的余弦相似度精确得多。在 Enterprise-RAG 2026 基准测试中，Dense+BM25+RRF 融合的 Recall@5 为 0.79，加上 Cross-Encoder Reranker 后提升到 0.84。

### 技术组件

| 组件 | 选型 | 说明 |
|------|------|------|
| 向量库 | Qdrant（Docker 单节点） | 原生支持 Dense + Sparse 双向量存储和混合检索，Payload 过滤能力业界最强（10+ 条件类型）。Rust 实现，内存效率高，单节点可支撑 1 亿+ 向量。部署：`docker run -p 6333:6333 qdrant/qdrant` |
| Embedding 模型 | BGE-M3 | 同时输出 Dense 向量（1024 维）和 Sparse 向量（词权重，BM25-like）。一个模型搞定两种检索，不需要分别部署 Dense 和 Sparse 两个模型 |
| Reranker | BGE-Reranker-v2-m3 | Cross-Encoder 架构，对 (query, chunk) 对做联合编码打分，精确度远超双塔 Embedding 模型的余弦相似度。BAAI 官方出品，与 BGE-M3 配套 |
| 分块策略 | 表格独立分块 + 叙述文本语义分块 | 核心原则：一张 Markdown 表格 = 一个独立 chunk，不跨表切割。叙述文本仍用递归 512-token 分块 |
| 混合检索 | RRF（Reciprocal Rank Fusion），k=60 | Dense 和 Sparse 各返回 top-60，用 RRF 公式 `1/(k+rank)` 融合排名。k=60 是 SemEval-2026 论文中验证的最优参数 |
| LLM | DeepSeek-V4-Flash | 同方案一 |

### 数据摄入流程（相比方案一的增量）

方案一的六步全部保留。额外增加三步：

**第七步：结构化表格提取。** 遍历所有 Markdown 文件中的表格，将每一行提取为一条 JSON 记录。这一步用 DeepSeek-V4-Flash 的 batch API 来做——把整个表格作为输入，让 LLM 输出标准化的 JSON 数组。例如：

输入（Markdown 表格的一行）：

```
| 四川 | 物理类 | 625 | 8500 | 2025 |
```

LLM 输出：

```json
{
  "record_type": "admission_score",
  "university": "四川大学",
  "province": "四川",
  "subject_type": "物理类",
  "year": 2025,
  "min_score": 625,
  "min_rank": 8500
}
```

之所以用 LLM 而不是正则/脚本解析，是因为你的 219 个文件的表格格式**不统一**——有的省份列名是"物理类"，有的是"物理科目组合"，有的是"理科"；有的位次是精确数字，有的是"~8500"（带波浪号）。LLM 能理解这些变体并归一化输出。

**第八步：为每个 chunk 生成上下文前缀（Contextual Retrieval）。** 这是 Anthropic 2024 年 9 月提出的技术，2026 年仍被广泛推荐。做法：对每个 chunk，调用 DeepSeek 生成一段 50-100 token 的摘要，描述这个 chunk 在整个文档中的上下文。这段摘要作为前缀拼在 chunk 原文前面一起做 embedding。效果：检索失败率降低 67%。

例如，一个 chunk 的原文是：

```
| 四川大学 | 625 | 8500 |
| 电子科技大学 | 640 | 5500 |
```

生成的上下文前缀：

```
这张表格列出了2025年四川省物理类985大学的录取最低分和最低位次。
四川大学最低分625对应位次8500，电子科技大学最低分640对应位次5500。
```

Embedding 时对"前缀+原文"整体向量化，检索时的语义匹配效果显著提升。

**第九步：存入 Qdrant。** 每条记录作为一个 Point 存入 Qdrant。每个 Point 包含：
- `id`: UUID
- `vector`: BGE-M3 的 Dense 向量（1024 维）
- `sparse_vector`: BGE-M3 的 Sparse 向量（词权重）
- `payload`: 结构化 JSON 数据 + 原文 + 来源文件 + 上下文前缀

Qdrant 的 Payload 支持在检索时做**前置过滤**——比如用户选了"广东+物理类"，可以在检索前就通过 `payload.year=2026 AND payload.province="广东" AND payload.subject_type="物理类"` 过滤掉不相关的 chunk，再在剩下的候选中做向量检索。这比方案一的"全库检索 + 靠 LLM 自己判断"精准得多。

### 检索流程

1. 构建查询文本，同方案一
2. 解析用户输入中的结构化条件。比如用户选了 province="广东"、subject_type="物理类"、score=600，构建 Qdrant 的 `filter` 条件：`must(province="广东" OR province=null), must(subject_type="物理类" OR subject_type=null)`
   - 为什么用 `OR null`：你的数据中有些文件（如全国汇总表）没有标注具体省份，这些数据对任何省份的查询都有参考价值
3. Dense 检索：用 BGE-M3 的 Dense 模式在过滤后的集合中检索 top-60
4. Sparse 检索：用 BGE-M3 的 Sparse 模式（BM25-like）在过滤后的集合中检索 top-60
5. RRF 融合：将 Dense 和 Sparse 的结果用 `1/(60+rank)` 公式融合，取 top-40
6. Reranker 精排：用 BGE-Reranker-v2-m3 对 40 个候选逐一打分，取 top-15
7. 将 15 个 chunk 按 U 型注意力排列（高分放头尾），注入 DeepSeek Prompt

### Prompt 工程

Prompt 中增加以下结构化信息（方案一的 Prompt 只有原文 chunks，方案二的 Prompt 包含元数据标注）：

```
System: 你是高考志愿填报推荐专家。

你可以访问私有知识库中的以下数据（每条标注了年份/省份/科类/来源文件）：
{retrieved_chunks}

时效性优先级规则（必须严格遵守）：
1. 2026年招生计划数据 > 2025年实际录取数据 > 更早年份
2. 同一大学同一专业，优先使用目标省份数据；如无该省数据，使用全国平均或邻近省份参考
3. 物理类和历史类数据严格隔离，绝不混用
4. 2025-2026年位次变化趋势：物理类本科线普遍下降，选物理的竞争优势在扩大

2026年政策规则（必须遵守）：
1. 大类招生已收紧。不要假设"工科试验班"包含所有工科专业方向
2. 本科普通批专业级差已全面取消，实行分数优先录取
3. 多所高校推出填满志愿即保录取的"零调剂"政策
4. 超70所双一流高校已放开转专业限制（转出零门槛、多次申请机会）
5. 强基计划从约1万人扩招至1.8万人，新增储能/材料/船舶方向
```

### 与现有系统集成方式

与方案一的集成方式相同，核心区别是检索模块内部逻辑——方案一是纯 Dense 检索，方案二是混合检索+Reranker。调用方无需感知差异。

另外，方案二需要将结构化提取的结果**反向同步**到现有的 PostgreSQL 数据库中。具体做法：

### 效果预期

- 查询"四川大学广东 2025 物理类最低分"时：Sparse 检索精确命中含"四川大学""广东""物理""625"的 chunk → Reranker 确认相关性最高 → 精准回答
- 查询"位次 25000 左右能上什么 211 计算机专业"时：Payload 前置过滤 + 混合检索 + Reranker 三重保障，召回质量显著优于方案一
- 查询"物化生组合能报哪些专业"时：选科要求数据被提取为结构化 JSON，Qdrant 的 Payload 过滤可以直接筛选出 `subject_requirements` 包含 ["物理","化学","生物"] 子集的专业

### 局限性

- 无法回答复杂的**多跳查询**。比如"哪些 211 大学在广东招物理类计算机专业，且 2025 年最低位次在 10000 以内，且学费低于 8000 元"——这涉及跨多个数据表的联合查询，向量检索 + Payload 过滤能部分解决，但不能像 SQL/JOIN 那样自如
- Qdrant 需要维护一个 Docker 容器，虽然运维负担轻但不再是零运维
- 表格提取的准确性依赖 DeepSeek 的输出质量，部分格式混乱的表格可能需要人工抽查

---

## 方案三：Agentic RAG + 知识图谱（重量）

### 整体思路

在方案二的混合检索基础上，新增两个基础设施：**Neo4j 知识图谱**（存储大学-省份-专业-选科要求之间的结构化关系）和 **Agent 推理层**（负责将用户复杂问题拆解为多个子查询，并行从知识图谱和向量库检索，融合结果后多次反思验证，最终生成推荐）。

这个方案的目标是让系统具备**跨表推理能力**——用户问一个复合问题，系统自动拆解、检索、验证、生成，而不是一次 Prompt 调用就结束。

### 为什么需要知识图谱

你的高考数据本质上是**高度关系化的**：

- 一所大学 ∈ 一个省份
- 一所大学 ∈ 一个层次（985 / 211 / 双一流 / 普通）
- 一所大学开设 N 个专业
- 一个专业有 M 条选科要求
- 一所大学 + 一个专业 + 一个省份 + 一个年份 = 一条录取记录（分数 + 位次 + 招生人数）

这种多对多关系用关系型数据库（JOIN）或向量数据库（相似度搜索）都不够自然。知识图谱把实体（大学、专业、省份）存为**节点**，把关系（位于、开设、要求、录取）存为**边**，一条 Cypher 查询就能跨越四层关系。

向量检索擅长"语义相似"（"计算机相关专业有哪些"），知识图谱擅长"关系推理"（"A 大学在 B 省招 C 专业的 D 条件是什么"）。两者互补。

### 技术组件

| 组件 | 选型 | 说明 |
|------|------|------|
| 向量库 + 混合检索 | Qdrant + BGE-M3 + BGE-Reranker-v2-m3 | 同方案二 |
| 知识图谱 | Neo4j Community Edition（Docker） | 图数据库的事实标准。Community 版免费，单节点足够。部署：`docker run -p 7474:7474 -p 7687:7687 neo4j:community` |
| Agent 框架 | 自建 Router + LangChain（仅用其 LLM 调用和工具抽象） | Agent 的核心是查询规划和工具调用，不依赖 LangChain 的复杂 Agent 实现。自建 Router 做意图识别和查询拆解，每个子查询封装为独立的 tool function |
| LLM | DeepSeek-V4-Flash（思考模式） | 开启 `reasoning_effort: "high"`，利用 Chain-of-Thought 能力做查询规划。对于最终生成的推荐结果，用 V4-Pro 做 Self-RAG 反思 |
| 评估 | RAGAS | 离线评估：检索召回率（Recall@k, nDCG@k）、生成忠实度（Groundedness）、答案完整性（Completeness） |

### 知识图谱 Schema 设计

**节点类型（4 种）：**

```
University {
  name: "四川大学",
  code: "10610",
  level: "985",          // 985 | 211 | 双一流 | 普通
  is985: true,
  is211: true,
  is_double_first: true,
  city: "成都"
}

Major {
  name: "计算机科学与技术",
  code: "080901",
  category: "工学",
  subcategory: "计算机类",
  degree: "工学学士",
  duration: 4
}

Province {
  name: "广东",
  code: "440000",
  exam_mode: "3+1+2",    // 3+1+2 | 3+3 | 文理分科
  total_score: 750
}

SubjectRequirement {
  subjects: ["物理", "化学"],
  coverage_pct: 77.6     // 该选科组合的专业覆盖率
}
```

**关系类型（5 种）：**

```
(:University) -[:LOCATED_IN]-> (:Province)
  大学位于哪个省份

(:University) -[:OFFERS {year: 2026, plan_count: 120, tuition: 6500}]-> (:Major)
  大学在某年开设某专业，含招生人数和学费

(:Major) -[:REQUIRES]-> (:SubjectRequirement)
  专业要求哪些选科

(:AdmissionRecord) -[:FOR_UNIVERSITY]-> (:University)
(:AdmissionRecord) -[:FOR_MAJOR]-> (:Major)
(:AdmissionRecord) -[:IN_PROVINCE]-> (:Province)
  一条录取记录连接大学、专业、省份三个节点
```

**AdmissionRecord 节点属性：**

```
AdmissionRecord {
  year: 2025,
  batch: "本科批",
  subject_type: "物理类",
  min_score: 625,
  avg_score: 632,
  max_score: 645,
  min_rank: 8500,
  avg_rank: 7200,
  max_rank: 5800,
  plan_count: 35
}
```

### 知识图谱构建流程

从你的 219 个 Markdown 文件到 Neo4j 图数据库，分四步：

**第一步：实体识别。** 用方案二中 LLM 提取的 JSON 结构化数据作为输入。将所有出现过的大学名、专业名、省份名去重，建立实体字典。用 `MERGE` 语句创建节点（已存在则跳过，不存在则创建），保证每个实体只有一个节点。

**第二步：创建关系。** 遍历每条录取记录，创建 AdmissionRecord 节点并连接到对应的 University、Major、Province 节点。遍历每条选科要求，创建 SubjectRequirement 节点并连接到对应的 Major 节点。遍历招生计划，创建 OFFERS 关系。

**第三步：数据补全。** 你的 MD 数据中有些信息是分散的——比如四川大学的招生人数在一个文件中，录取分数线在另一个文件中。知识图谱的优势在于：将分散在多处的信息汇聚到同一个 University 节点上。比如：

```cypher
MATCH (u:University {name: "四川大学"})
SET u.total_enrollment_2026 = 8831,
    u.sichuan_enrollment = 2381,
    u.expansion = 29
```

**第四步：建立索引。** 为常用查询字段建索引：

```cypher
CREATE INDEX university_name FOR (u:University) ON (u.name);
CREATE INDEX university_level FOR (u:University) ON (u.level);
CREATE INDEX major_name FOR (m:Major) ON (m.name);
CREATE INDEX major_category FOR (m:Major) ON (m.category);
CREATE INDEX province_name FOR (p:Province) ON (p.name);
CREATE INDEX admission_year_rank FOR (r:AdmissionRecord) ON (r.year, r.subject_type, r.min_rank);
```

### Agent 推理层设计

Agent 的核心是一个 **Router → Multi-Tool Retrieval → Fusion → Self-RAG** 的四步流水线。

**第一步：Router（查询规划器）。** 用户输入自然语言问题，Router（DeepSeek-V4-Flash + 思考模式）将其拆解为 1~4 个子查询，每个子查询标注类型（graph / vector / hybrid）和参数。

例如用户问："广东物理类 600 分，位次 25000，想学计算机或电子类，211 以上有哪些？学费别太贵。"

Router 输出：

```json
[
  {
    "type": "graph",
    "query": "广东 物理类 位次25000 冲稳保区间",
    "cypher_hint": "MATCH (r:AdmissionRecord) WHERE r.subject_type='物理类' AND r.province='广东' RETURN r.university, r.major, r.min_rank ORDER BY abs(r.min_rank-25000) LIMIT 50"
  },
  {
    "type": "graph",
    "query": "211及以上 计算机类 电子信息类 专业",
    "cypher_hint": "MATCH (u:University)-[:OFFERS]->(m:Major) WHERE u.is211=true AND (m.subcategory='计算机类' OR m.subcategory='电子信息类') RETURN u.name, m.name, u.level"
  },
  {
    "type": "vector",
    "query": "计算机 电子 学费 选科要求 2026 广东"
  }
]
```

**第二步：并行检索。** 三个子查询同时执行：
- graph 类型的查询：Router 生成的 cypher_hint 交给一个专门的 `executeCypher()` 函数执行（这个函数会先对 Cypher 做安全检查，禁止 DELETE/DROP 等写操作）
- vector 类型的查询：走 Qdrant 的混合检索 + Reranker（方案二的检索链路）

**第三步：Fusion（融合排序）。** 将 Graph 结果和 Vector 结果做交叉验证：
- 两路都命中的记录：置信度最高，标记为"confirmed"
- 只有 Graph 命中的记录：标记为"graph_only"，通常是精确的结构化匹配
- 只有 Vector 命中的记录：标记为"vector_only"，通常是语义相关的补充信息
- 对 confirmed + graph_only 的候选做 RRF 融合，生成最终候选列表（最多 20 条）

**第四步：Self-RAG（生成+反思）。** 分两轮 LLM 调用：
- 第一轮：DeepSeek-V4-Flash 基于候选列表生成推荐，每条推荐包含冲稳保分类、录取概率、理由，并标注数据来源（"2025 年广东物理类录取数据"或"2026 年招生计划"）
- 第二轮：DeepSeek-V4-Pro 做反思——逐条检查推荐是否有数据支撑、冲稳保配比是否合理（30%/50%/20% 黄金比）、是否遗漏了明显的选项、数据年份是否有冲突

### 与现有推荐流程的集成方式

方案三在推荐链路中增加了一个编排层。原有流程"数据库查分→四层分档→大模型排序"保持不变，但在其外围包装了 Agent 编排：

- **Agent 编排层**：接收用户的自然语言输入，拆解为多个子查询
- **Graph 检索**：向 Neo4j 发起 Cypher 查询，完成位次匹配、选科匹配、专业过滤
- **Vector 检索**：向 Qdrant 发起混合检索+Reranker，补充语义相关信息
- **Fusion 融合**：将两个检索通道的结果交叉验证、去重、排序
- **Self-RAG（生成+反思）**：第一轮大模型生成推荐清单，第二轮大模型逐条检查数据支撑、冲稳保配比、是否有遗漏

Agent 编排层是独立的全新模块。Graph 检索依赖 Neo4j 知识图谱（需单独构建）。Vector 检索复用方案二的 Qdrant 混合检索链路。Self-RAG 复用现有的大模型调用链路。

### 效果预期

- "物化生组合能覆盖多少 985 大学的计算机专业？" → 一条 Cypher：`MATCH (u:University {level:'985'})-[:OFFERS]->(m:Major {subcategory:'计算机类'})-[:REQUIRES]->(s:SubjectRequirement) WHERE ALL(sub IN s.subjects WHERE sub IN ['物理','化学','生物']) RETURN u.name, m.name` → 3 秒内出精确结果
- "位次 25000，想去上海的 211 计算机专业，有哪些选择？" → Agent 拆解为 4 个子查询并行检索 → Fusion 交叉验证 → Self-RAG 反思 → 给出标注了数据来源的推荐清单
- 新增 2027 年数据时：只需追加新的 AdmissionRecord 节点和 OFFERS 关系，不需要重建任何索引或重新 embedding

### 局限性

- 运维复杂度最高：需要同时维护 Qdrant + Neo4j + RAGAS 评估三个服务
- 知识图谱构建的前期工作量大：需要从 219 个 MD 文件中提取实体和关系，设计 Cypher 导入脚本，验证数据完整性
- Agent 推理链路最长：单次查询的完整链路（Router → 并行检索 → Fusion → 两轮 LLM 调用）预计 3~6 秒，比方案一/二慢 2~3 倍。可以通过缓存热点查询结果来缓解
- 需要建立持续评估机制：没有 RAGAS 离线评估，你无法判断 Agent 的每次改动是改好了还是改坏了
