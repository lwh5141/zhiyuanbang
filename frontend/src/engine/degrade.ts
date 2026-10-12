/**
 * 意向过滤与边缘分数降级（纯函数，REQ-013a / PRD 9.4）。
 * 降级按固定顺序 L1（放开院校层次下限）→ L2（扩大地域），全程明示、禁止静默；
 * 本模块不触碰黑名单——黑名单在 planBuilder 中先行硬过滤，绝不进入降级。
 */

import thresholdsJson from '@/data/config/thresholds.json';
import { expandRegion } from '@/data/regionUtils';
import type { Candidate, DegradeStep } from '@/types/candidate';
import type { SchoolFloor, Preferences } from '@/types/preference';

const T = thresholdsJson;

/** 院校层次量化（越大越优）；办学性质：民办为 0 层 */
const TIER_LEVEL: Record<Candidate['tier'], number> = {
  民办: 0,
  公办: 1,
  双一流: 2,
  211: 3,
  985: 4,
};

/** 院校层次下限量化 */
const FLOOR_LEVEL: Record<SchoolFloor, number> = {
  不限: 0,
  公办: 1,
  双一流: 2,
  211: 3,
  985: 4,
};


/** 层次/办学性质是否通过 */
function tierOk(cand: Candidate, prefs: Preferences): boolean {
  if (FLOOR_LEVEL[prefs.schoolFloor] > 0 && TIER_LEVEL[cand.tier] < FLOOR_LEVEL[prefs.schoolFloor]) {
    return false;
  }
  if (prefs.ownership === '公办' && cand.tier === '民办') return false;
  if (prefs.ownership === '民办' && cand.tier !== '民办') return false;
  return true;
}

/** 地域是否通过（期望地域命中，且不落在排斥地域） */
function regionOk(cand: Candidate, prefs: Preferences): boolean {
  if (prefs.excludedRegions.length > 0) {
    const excluded = new Set(prefs.excludedRegions.flatMap(expandRegion));
    if (excluded.has(cand.city) || excluded.has(cand.province)) return false;
  }
  if (prefs.expectedRegions.length > 0) {
    const expected = new Set(prefs.expectedRegions.flatMap(expandRegion));
    if (!expected.has(cand.city) && !expected.has(cand.province)) return false;
  }
  return true;
}

/**
 * 按放宽级别应用意向过滤。
 * relax=0 全量条件；relax=1 忽略层次/办学性质（L1）；relax=2 再忽略地域（L2）。
 */
export function applyPreferenceFilters(
  cands: Candidate[],
  prefs: Preferences,
  relax: 0 | 1 | 2,
): Candidate[] {
  return cands.filter((cand) => {
    if (relax < 1 && !tierOk(cand, prefs)) return false;
    if (relax < 2 && !regionOk(cand, prefs)) return false;
    return true;
  });
}

/**
 * 降级流程：候选不足 min 时按 L1→L2 固定顺序放宽，并输出明示记录。
 * 黑名单绝不在此放宽（传入前已被硬过滤）。
 */
export function degrade(
  cands: Candidate[],
  prefs: Preferences,
  min: number,
): { candidates: Candidate[]; steps: DegradeStep[] } {
  const steps: DegradeStep[] = [];

  let result = applyPreferenceFilters(cands, prefs, 0);
  if (result.length >= min) return { candidates: result, steps };

  // L1：放开院校层次下限（含公办/民办偏好）
  result = applyPreferenceFilters(cands, prefs, 1);
  if (steps.length === 0 && result.length !== cands.length) {
    steps.push({ level: 'L1', desc: T.degrade.descriptions.L1 });
  } else if (steps.length === 0) {
    // L1 放宽前后数量一致（本就无层次过滤余量），仍如实记录已按 L1 口径执行
    steps.push({ level: 'L1', desc: T.degrade.descriptions.L1 });
  }
  if (result.length >= min) return { candidates: result, steps };

  // L2：扩大地域范围
  result = applyPreferenceFilters(cands, prefs, 2);
  steps.push({ level: 'L2', desc: T.degrade.descriptions.L2 });
  return { candidates: result, steps };
}

