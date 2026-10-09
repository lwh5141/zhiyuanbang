import type { SubjectCode } from './profile';
/** 志愿候选与方案领域类型（引擎的输入与输出） */

/** 四梯度 */
export type Gradient = '冲' | '稳' | '保' | '垫';

/** 各梯度数量统计（如 { 冲: 9, 稳: 14, 保: 13, 垫: 9 }） */
export type GradientStat = Record<Gradient, number>;

/** 证据条数据（REQ-009：四类事实数据全部来自规则层，公式因子级公开，决策 #7） */
export interface Evidence {
  /** "23,800–26,500（2023–2025）" */
  pastRanks: string;
  /** "412 人" */
  peerCount: string;
  /** "86 人 · 较去年 +8%" */
  planCount: string;
  /** "位次正态 μ25,100/σ1,900 ∩ 历史频率 61%" */
  factors: string;
  /** "2025 年广东省一分一段表 · …（演示数据）" */
  source: string;
}

/** 结构化志愿候选（已由 candidateService 从 RawCandidate 富化：含概率区间/梯度/证据） */
export interface Candidate {
  id: string;
  school: string;
  majorGroup: string;
  major: string;
  city: string;
  province: string;
  tier: '985' | '211' | '双一流' | '公办' | '民办';
  /** 组内专业清单（黑名单按大类匹配用） */
  majorsInGroup: string[];
  /** 录取概率置信区间，如 [52, 68]，只讲区间不承诺结果 */
  probability: [number, number];
  gradient: Gradient;
  /** 0–100，估算类降置信度 */
  confidence: number;
  /** 如 ['无历史数据·估算'] */
  tags: string[];
  evidence: Evidence;
}

/** 候选库原始行（candidates.gd.json 的结构：不含概率/梯度——那是引擎算出来的，不进数据） */
export interface RawCandidate {
  id: string;
  school: string;
  majorGroup: string;
  major: string;
  city: string;
  province: string;
  tier: '985' | '211' | '双一流' | '公办' | '民办';
  /** 选科要求：'不限' 或指定首选 */
  trackReq: SubjectCodeLike;
  /** 再选要求：考生再选须包含列出的全部科目，空数组 = 不限 */
  electiveReq: string[];
  majorsInGroup: string[];
  /** 往年投档位次区间（2023–2025，演示数据） */
  pastRanks: [number, number];
  /** 计划数（人） */
  planCount: number;
  /** 计划较去年变动百分比 */
  planChangePct: number;
  /** 往年同分段人数（人） */
  peerCount: number;
  /** 新增/无历史投档线专业（三级代理估算示意） */
  noHistory?: boolean;
  /** 概率模型 σ（示意），缺省按位次比例推导 */
  sigma?: number;
}

/** 首选要求（与 SubjectCode 相容，多一个不限） */
export type SubjectCodeLike = SubjectCode | '不限';

/** 降级记录（全程明示，禁止静默降级；黑名单绝不进入降级） */
export type DegradeStep = { level: 'L1' | 'L2'; desc: string };

/** 方案（planBuilder 的输出，BlacklistGate / PlanPage 的输入） */
export interface Plan {
  /** 最终输出的志愿列表（已按配比排序） */
  candidates: Candidate[];
  gradientStats: GradientStat;
  /** 实际使用的配比 [冲, 稳, 保, 垫] */
  ratio: [number, number, number, number];
  /** 被黑名单拦截的志愿数（BlacklistGate 展示） */
  blacklistBlocked: number;
  /** 被拦截的志愿明细（拦截确认页逐条展示，不可静默绕过） */
  blockedCandidates: Candidate[];
  /** 降级记录（L1/L2 全程明示） */
  degraded: DegradeStep[];
  /** 信息完整度 0–100 */
  completeness: number;
  /** true = 无匹配方案（候选=0），前端必须出 NoMatchDiagnosis，禁止静默 */
  isEstimate: boolean;
  /** 致无解条件说明 + 放宽建议 */
  noMatchReasons: string[];
}

