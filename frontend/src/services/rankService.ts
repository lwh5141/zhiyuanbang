/**
 * 位次服务（async 门面，REQ-002）：读 scoreRank.gd.json → engine.rankLookup 线性插值反查。
 * 位次一律系统反查，展示一分一段表原文引用，误差为零（以官方表为准）。
 */
import scoreRankJson from '@/data/mock/scoreRank.gd.json';
import thresholdsJson from '@/data/config/thresholds.json';
import { rankLookup } from '@/engine/rankLookup';
import type { RankResult, RankRow, RankRowTuple, SubjectCode } from '@/types/profile';
import { getProvinceByCode } from './provinceService';
import { delay } from './delay';

const DATA = scoreRankJson as unknown as {
  province: string;
  year: string;
  tables: Record<string, RankRowTuple[]>;
};
const FALLBACK = thresholdsJson.rankFallback as unknown as {
  rank: number;
  percentile: number;
};

/** JSON 三元组 → 结构化行 */
function toRows(tuples: RankRowTuple[]): RankRow[] {
  return tuples.map(([score, rank, percentile]) => ({ score, rank, percentile }));
}

/**
 * 位次反查。
 * @param province 省份代码（V1 仅广东有示意映射表）
 * @param track    首选科目（决定用物理类/历史类表）
 * @param score    总分 0–750
 */
export async function lookupRank(
  province: string,
  track: SubjectCode,
  score: number,
): Promise<RankResult> {
  await delay(300);

  const name = getProvinceByCode(province)?.name ?? '广东';
  const yearLabel = `${DATA.year} 年${name}${track}类一分一段表`;
  const table = DATA.tables[track];

  if (province === DATA.province && table) {
    const result = rankLookup(score, toRows(table), yearLabel);
    if (result) return result;
  }

  // 低于示意映射表下限等兜底口径（演示数据边界，明示在 source 中）
  return {
    rank: FALLBACK.rank,
    percentile: FALLBACK.percentile,
    source: `${yearLabel} · ${score} 分低于示意映射表下限，按兜底位次 ${FALLBACK.rank.toLocaleString()} 处理（演示数据）`,
    interpolated: false,
  };
}
