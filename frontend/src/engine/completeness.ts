/**
 * 信息完整度评分（纯函数，REQ-011）：字段权重表驱动（thresholds.json.completenessWeights）。
 * 评分仅作「补全可提升推荐精度」引导，非必填拦路（无死锁）。
 */
import thresholdsJson from '@/data/config/thresholds.json';
import type { Preferences } from '@/types/preference';
import type { Profile } from '@/types/profile';

const WEIGHTS = thresholdsJson.completenessWeights as unknown as Record<string, number>;

export function score(profile: Profile, prefs: Preferences): number {
  let total = 0;
  if (profile.province) total += WEIGHTS.province;
  if (profile.track) total += WEIGHTS.track;
  if (profile.electives.length > 0) total += WEIGHTS.electives;
  if (profile.totalScore !== undefined) total += WEIGHTS.totalScore;
  if (Object.keys(profile.subScores).length > 0) total += WEIGHTS.subScores;
  if (profile.systemRank !== undefined || profile.rankOverride !== undefined) total += WEIGHTS.systemRank;
  if (prefs.weightPreset) total += WEIGHTS.weightPreset;
  if (prefs.expectedRegions.length > 0 || prefs.excludedRegions.length > 0) total += WEIGHTS.expectedRegions;
  if (prefs.majorBlacklist.length > 0) total += WEIGHTS.majorBlacklist;
  if (profile.specialIdentities.length > 0) total += WEIGHTS.specialIdentities;
  return Math.min(100, total);
}
