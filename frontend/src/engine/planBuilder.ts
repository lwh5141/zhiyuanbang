/**
 * 方案编排器（纯函数）：过滤 → 概率/梯度（已在服务层富化）→ 黑名单 → 降级 → 按配比输出 Plan。
 * 这是 mock 引擎的主干，将来与后端 FastAPI 的 /plan 接口签名对齐（PRD 9.2 伪代码的实现）。
 */
import provincesJson from '@/data/config/provinces.json';
import type { Candidate, Plan } from '@/types/candidate';
import type { ProvinceConfig } from '@/types/profile';
import type { Preferences } from '@/types/preference';
import type { Profile } from '@/types/profile';
import { filterBlacklist } from './blacklist';
import { score as completenessScore } from './completeness';
import { degrade } from './degrade';
import { getBaseRatio, getPresetRatio, allocateByGradient, Ratio4 } from './ratio';

const PROVINCES = (provincesJson as unknown as { provinces: ProvinceConfig[] }).provinces;

/** 省份志愿数量上限（配置驱动，禁止硬编码 45） */
export function getVolunteerLimit(provinceCode?: string): number {
  const province = PROVINCES.find((p) => p.code === provinceCode);
  return province?.volunteerLimit ?? PROVINCES[0].volunteerLimit;
}

/** 生成无匹配诊断说明（禁止静默降级的配套：说清哪项条件导致无解 + 放宽建议） */
function diagnose(
  survivingCount: number,
  afterDegradeCount: number,
  prefs: Preferences,
): string[] {
  const reasons: string[] = [];
  if (survivingCount === 0) {
    reasons.push('专业黑名单过滤后无剩余候选：请检查黑名单是否过宽（黑名单不会被自动放宽）。');
  } else if (afterDegradeCount === 0) {
    reasons.push('当前意向条件下无匹配志愿，即使按 L1/L2 放宽层次与地域后仍无解。');
    if (prefs.schoolFloor !== '不限') {
      reasons.push(`建议：院校层次下限「${prefs.schoolFloor}」可能过高，可尝试放宽为「不限」。`);
    }
    if (prefs.expectedRegions.length > 0) {
      reasons.push(`建议：期望地域限定在「${prefs.expectedRegions.join('、')}」，可尝试扩大地域范围。`);
    }
    if (prefs.ownership !== '不限') {
      reasons.push(`建议：办学性质限定「${prefs.ownership}」缩小了候选范围，可尝试放宽为「不限」。`);
    }
  } else {
    reasons.push('候选池为空：请先完成省份/选科/总分采集（位次缺失时引擎无法估算概率）。');
  }
  return reasons;
}

/**
 * 编排主入口。
 * @param pool 已由 candidateService 富化的候选池（含概率区间/梯度/证据）
 */
export function buildPlan(profile: Profile, prefs: Preferences, pool: Candidate[]): Plan {
  const limit = getVolunteerLimit(profile.province);

  // ① 黑名单硬过滤（绝对约束，先于一切放宽）
  const { blocked, surviving } = filterBlacklist(pool, prefs.majorBlacklist);

  // ② 意向过滤 + 不足时 L1→L2 降级（全程明示）
  const { candidates: afterDegrade, steps } = degrade(surviving, prefs, limit);

  // ③ 配比：已选预设用预设×微调档，否则基准配比
  const ratio: Ratio4 = prefs.weightPreset
    ? getPresetRatio(prefs.weightPreset, prefs.tune)
    : getBaseRatio();

  // ④ 按配比输出
  const final = allocateByGradient(afterDegrade, ratio, limit);

  const gradientStats = { 冲: 0, 稳: 0, 保: 0, 垫: 0 };
  for (const cand of final) {
    gradientStats[cand.gradient] = (gradientStats[cand.gradient] ?? 0) + 1;
  }

  return {
    candidates: final,
    gradientStats,
    ratio,
    blacklistBlocked: blocked.length,
    blockedCandidates: blocked,
    degraded: steps,
    completeness: completenessScore(profile, prefs),
    isEstimate: final.length === 0,
    noMatchReasons: final.length === 0 ? diagnose(surviving.length, afterDegrade.length, prefs) : [],
  };
}
