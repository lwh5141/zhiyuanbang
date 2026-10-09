/**
 * 粗结果示例服务（S2.5，REQ-015）：按位次分档返回「往届同位次考生去向示例」。
 * 先给价值再要信息——用户填完省份+总分即可查看。
 */
import pastPlansJson from '@/data/mock/pastPlans.gd.json';
import { delay } from './delay';

export interface PastPlanSample {
  school: string;
  major: string;
  note: string;
}

export interface PastPlanTier {
  label: string;
  minRank: number;
  maxRank: number;
  samples: PastPlanSample[];
}

const DATA = pastPlansJson as unknown as { tiers: PastPlanTier[] };

/** 按位次返回对应分档的去向示例（找不到分档时返回空数组） */
export async function fetchPastPlans(rank: number): Promise<PastPlanTier[]> {
  await delay(280);
  if (!Number.isFinite(rank) || rank <= 0) return [];
  return DATA.tiers.filter((tier) => rank > tier.minRank && rank <= tier.maxRank);
}
