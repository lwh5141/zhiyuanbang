/**
 * 黑名单硬过滤（纯函数，REQ-007 / PRD 决策 #6）。
 * 专业黑名单为绝对约束：任何情况下不自动释放、不进入降级（L3 已移入停车场）。
 */
import type { Candidate } from '@/types/candidate';

/** 黑名单条目归一化：「临床医学类」→「临床医学」，便于对具体专业名做包含匹配 */
export function normalizeEntry(entry: string): string {
  return entry.trim().replace(/类$/, '');
}

/**
 * 求某候选命中的黑名单条目（BlacklistGate 展示「因哪些条目被拦截」用）。
 * 匹配口径：组内任一专业名 / 组名 包含归一化条目即命中。
 */
export function matchBlacklistEntries(cand: Candidate, blacklist: string[]): string[] {
  const texts = [cand.major, cand.majorGroup, ...cand.majorsInGroup];
  return blacklist.filter((entry) => {
    const normalized = normalizeEntry(entry);
    return normalized.length > 0 && texts.some((t) => t.includes(normalized));
  });
}

/**
 * 黑名单硬过滤。
 * @returns blocked 被拦截志愿（拦截确认页逐条可见）、surviving 幸存志愿（进入后续流程）
 */
export function filterBlacklist(
  cands: Candidate[],
  blacklist: string[],
): { blocked: Candidate[]; surviving: Candidate[] } {
  if (blacklist.length === 0) return { blocked: [], surviving: [...cands] };
  const blockedIds = new Set<string>();
  for (const cand of cands) {
    if (matchBlacklistEntries(cand, blacklist).length > 0) blockedIds.add(cand.id);
  }
  const blocked: Candidate[] = [];
  const surviving: Candidate[] = [];
  for (const cand of cands) {
    (blockedIds.has(cand.id) ? blocked : surviving).push(cand);
  }
  return { blocked, surviving };
}
