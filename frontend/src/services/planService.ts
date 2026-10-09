/**
 * 方案服务（async 门面）：fetchCandidates → engine.buildPlan（模拟后端 200–400ms 延迟）。
 * 第⑩步接入真实后端时仅替换本文件内部实现，页面与引擎零改动。
 */
import { buildPlan } from '@/engine/planBuilder';
import type { Plan } from '@/types/candidate';
import type { Preferences } from '@/types/preference';
import type { Profile } from '@/types/profile';
import { fetchCandidates } from './candidateService';
import { delay } from './delay';

/** 生成完整方案（含黑名单拦截记录与降级明示记录） */
export async function buildPlanFor(profile: Profile, prefs: Preferences): Promise<Plan> {
  const pool = await fetchCandidates(profile);
  await delay(260);
  return buildPlan(profile, prefs, pool);
}
