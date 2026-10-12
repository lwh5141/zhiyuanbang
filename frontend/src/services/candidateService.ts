/**
 * 候选服务（async 门面）：读 candidates.gd.json → 选科/要求过滤 → 概率/梯度/证据富化。
 * 富化只依赖考生位次与候选自身字段，确定性输出（随机延迟仅模拟网络）。
 */
import candidatesJson from '@/data/mock/candidates.gd.json';
import thresholdsJson from '@/data/config/thresholds.json';
import appJson from '@/data/config/app.json';
import {
  estimateProbability,
  probabilityMidpoint,
  classifyGradient,
  confidenceScore,
  factorText,
} from '@/engine/probability';
import type { Candidate, RawCandidate } from '@/types/candidate';
import type { ElectiveSubject, Profile, SubjectCode } from '@/types/profile';
import { delay } from './delay';

const RAW = (candidatesJson as unknown as { candidates: RawCandidate[] }).candidates;
/** 候选富化口径（静态配置，见 data/config/thresholds.json） */
const CF = thresholdsJson.candidateFilter;
const FETCH_DELAY_MS = appJson.timing.serviceDelayMs.candidates;

/** 选科要求过滤：首选匹配 + 再选覆盖全部要求科目 */
function subjectOk(raw: RawCandidate, profile: Profile): boolean {
  if (raw.trackReq !== '不限' && profile.track && raw.trackReq !== profile.track) return false;
  if (raw.electiveReq.length > 0) {
    const owned = new Set<ElectiveSubject | SubjectCode>(profile.electives);
    return raw.electiveReq.every((req) => owned.has(req as ElectiveSubject));
  }
  return true;
}

/** 证据条四类事实数据 + 来源引用（REQ-009，全部来自规则层数据） */
function buildEvidence(raw: RawCandidate, mid: number, sigma: number, freq: number) {
  const [min, max] = raw.pastRanks;
  const change = raw.planChangePct >= 0 ? `+${raw.planChangePct}` : `${raw.planChangePct}`;
  return {
    pastRanks: `${min.toLocaleString()}–${max.toLocaleString()}（2023–2025）`,
    peerCount: `${raw.peerCount.toLocaleString()} 人`,
    planCount: `${raw.planCount} 人 · 较去年 ${change}%`,
    factors: factorText(mid, sigma, freq),
    source: `2023–2025 年广东省${raw.city}投档情况（演示数据 · 示意）`,
  };
}

/**
 * 获取过滤+富化后的候选池。
 * @returns 位次缺失时返回空数组（引擎无法估算概率，PlanPage 会引导回向导补全）
 */
export async function fetchCandidates(profile: Profile): Promise<Candidate[]> {
  await delay(FETCH_DELAY_MS);

  const userRank = profile.rankOverride ?? profile.systemRank;
  if (!userRank || userRank <= 0) return [];

  const result: Candidate[] = [];
  for (const raw of RAW) {
    if (!subjectOk(raw, profile)) continue;

    const [min, max] = raw.pastRanks;
    const mid = (min + max) / 2;
    // σ 缺省按位次比例推导（演示口径）；历史频率由位次差确定性推导，保持纯函数
    const sigma = raw.sigma ?? Math.round(mid * CF.sigmaRatio);
    const freq = Math.min(
      CF.historyFreqMax,
      Math.max(
        CF.historyFreqMin,
        Math.round(CF.historyFreqCenter + ((mid - userRank) / mid) * CF.historyFreqSpan),
      ),
    );

    const [lo, hi] = estimateProbability(userRank, mid);
    const pMid = probabilityMidpoint([lo, hi]);
    // 概率中点低于阈值的不进入候选池（远超考生层次，无填报意义）
    if (pMid < CF.minProbabilityMidpoint) continue;

    result.push({
      id: raw.id,
      school: raw.school,
      majorGroup: raw.majorGroup,
      major: raw.major,
      city: raw.city,
      province: raw.province,
      tier: raw.tier,
      majorsInGroup: raw.majorsInGroup,
      probability: [lo, hi],
      gradient: classifyGradient(pMid),
      confidence: confidenceScore(raw.noHistory === true, raw.planChangePct),
      tags: raw.noHistory ? ['无历史数据·估算'] : [],
      evidence: buildEvidence(raw, mid, sigma, freq),
    });
  }
  return result;
}
