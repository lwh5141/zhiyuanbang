/**
 * 概率区间与梯度判定（纯函数）。
 * mock 阶段简化口径：位次正态主模型（sigmoid 映射）+ 证据条展示历史频率因子，
 * 真实「双模型交集」公式留待第⑩步接入后端（PRD 9.2）。
 */
import thresholdsJson from '@/data/config/thresholds.json';
import type { Gradient } from '@/types/candidate';

/** thresholds.json（只读口径，禁止在代码里硬编码 40/75/95） */
const T = thresholdsJson;

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

/**
 * 由考生位次 vs 往年投档位次中位数估算概率区间。
 * ratio = 往年位次 / 考生位次：>1 表示考生位次比往年投档线宽松 → 概率高。
 * sigmoid 中心在 ratio=1（p=50%），斜率 4：ratio 1.2 ≈ 69%，0.8 ≈ 31%，2.0 ≈ 98%。
 */
export function estimateProbability(userRank: number, pastRankMid: number): [number, number] {
  if (!Number.isFinite(userRank) || userRank <= 0 || !Number.isFinite(pastRankMid) || pastRankMid <= 0) {
    return [2, 98];
  }
  const ratio = pastRankMid / userRank;
  const mid = 100 / (1 + Math.exp(-(ratio - 1) * 4));
  const w = T.probabilityInterval;
  return [clamp(Math.round(mid - w), 2, 98), clamp(Math.round(mid + w), 2, 98)];
}

/** 置信区间中点（排序与梯度判定用） */
export function probabilityMidpoint(interval: [number, number]): number {
  return (interval[0] + interval[1]) / 2;
}

/**
 * 梯度判定（PRD 9.2 伪代码：p<40 冲 / <75 稳 / <95 保 / 其余垫）。
 * 阈值只读 thresholds.json。
 */
export function classifyGradient(p: number): Gradient {
  const { rushBelow, stableBelow, safeBelow } = T.probability;
  if (p < rushBelow) return '冲';
  if (p < stableBelow) return '稳';
  if (p < safeBelow) return '保';
  return '垫';
}

/** 置信度：无历史数据重罚、计划变动 >±20% 轻罚（PRD 修正模型） */
export function confidenceScore(noHistory: boolean, planChangePct: number): number {
  let c = T.confidence.base;
  if (noHistory) c -= T.confidence.noHistoryPenalty;
  if (Math.abs(planChangePct) > 20) c -= T.confidence.planChangePenalty;
  return Math.max(T.confidence.min, c);
}

/** 概率因子文案（决策 #7：公式因子级公开） */
export function factorText(
  pastRankMid: number,
  sigma: number,
  historyFreq: number,
): string {
  return `位次正态 μ${Math.round(pastRankMid).toLocaleString()}/σ${Math.round(sigma)} ∩ 历史频率 ${Math.round(historyFreq)}%`;
}
