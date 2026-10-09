/**
 * 一分一段线性插值反查：分数 → 位次 + 超过百分比（纯函数，无 React/无随机/无时间）。
 * PRD 9.2：分段断层用线性插值并标注精度降级；新高考省份一律位次法。
 */
import type { RankResult, RankRow } from '@/types/profile';

/**
 * @param score     考生总分（0–750）
 * @param table     一分一段结构化行（须按分数升序）
 * @param yearLabel 数据来源标签，如「2025 年广东省物理类一分一段表」
 * @returns 低于表内最低分返回 null（由服务层兜底），其余返回含原文引用的结果
 */
export function rankLookup(score: number, table: RankRow[], yearLabel: string): RankResult | null {
  if (!Number.isFinite(score) || score <= 0 || table.length === 0) return null;

  // 低于示意映射表下限：交由服务层兜底（演示口径）
  if (score < table[0].score) return null;

  // 达到/超过表上限：取上限行并明示
  const last = table[table.length - 1];
  if (score >= last.score) {
    return {
      rank: last.rank,
      percentile: last.percentile,
      source: `${yearLabel} · ${score} 分对应累计 ${last.rank.toLocaleString()} 位（超出示意映射表上限，按上限取值 · 演示数据）`,
      interpolated: false,
    };
  }

  // 区间内：找相邻两分行线性插值
  for (let i = 0; i < table.length - 1; i++) {
    const a = table[i];
    const b = table[i + 1];
    if (score >= a.score && score <= b.score) {
      const t = (score - a.score) / (b.score - a.score);
      const rank = Math.round(a.rank + (b.rank - a.rank) * t);
      const percentile = Math.round(a.percentile + (b.percentile - a.percentile) * t);
      return {
        rank,
        percentile,
        source: `${yearLabel} · ${score} 分对应累计 ${rank.toLocaleString()} 位（演示数据 · 线性插值示意）`,
        interpolated: true,
      };
    }
  }
  return null;
}
