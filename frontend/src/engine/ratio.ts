/**
 * 配比计算（纯函数）：预设×微调档 → 配比，以及按配比从候选池分配志愿。
 * 口径全部来自 thresholds.json（40/75/95、2:3:3:2 只在 JSON 里维护）。
 */
import thresholdsJson from '@/data/config/thresholds.json';
import type { Candidate, Gradient } from '@/types/candidate';
import type { TuneLevel, WeightPreset } from '@/types/preference';
import { probabilityMidpoint } from './probability';

export type Ratio4 = [number, number, number, number];

const T = thresholdsJson;

/** JSON number[] → 四元组（避免对 JSON 推断类型做强转） */
const toRatio = (a: number[]): Ratio4 => [a[0], a[1], a[2], a[3]];

/** 预设 × 微调档 → 配比（未选预设时由调用方使用 baseRatio） */
export function getPresetRatio(preset: WeightPreset, tune: TuneLevel): Ratio4 {
  const table = T.presetRatios[preset];
  return toRatio(table[tune]);
}

/** 基准配比（未选预设 / 方案页兜底展示） */
export function getBaseRatio(): Ratio4 {
  return toRatio(T.baseRatio);
}

/**
 * 最大余数法：把 total 个志愿按配比分配到四梯度，保证总和恰为 total。
 * 例：2:3:3:2 × 45 → 9/14/13/9。
 */
export function countsFromRatio(ratio: Ratio4, total: number): [number, number, number, number] {
  const sum = ratio.reduce((a, b) => a + b, 0) || 1;
  const exact = ratio.map((r) => (r / sum) * total);
  const floors = exact.map(Math.floor);
  let remainder = total - floors.reduce((a, b) => a + b, 0);
  // 余数按小数部分从大到小依次 +1
  const order = exact
    .map((v, i) => ({ i, frac: v - Math.floor(v) }))
    .sort((a, b) => b.frac - a.frac);
  const result = [...floors];
  let k = 0;
  while (remainder > 0 && order.length > 0) {
    result[order[k % order.length].i] += 1;
    remainder -= 1;
    k += 1;
  }
  return [result[0], result[1], result[2], result[3]];
}

const GRADIENT_ORDER: Gradient[] = ['冲', '稳', '保', '垫'];

/**
 * 按配比从候选池挑选并排序输出方案：
 * 1) 各梯度内按概率中点降序；
 * 2) 按配比取前 N 个；某梯度不足时名额由其余梯度顺延补足；
 * 3) 最终按 冲→稳→保→垫、梯度内概率降序排列。
 */
export function allocateByGradient(cands: Candidate[], ratio: Ratio4, total: number): Candidate[] {
  const counts = countsFromRatio(ratio, total);
  const byGradient = new Map<Gradient, Candidate[]>(
    GRADIENT_ORDER.map((g) => [g, [] as Candidate[]]),
  );
  for (const cand of cands) {
    byGradient.get(cand.gradient)?.push(cand);
  }
  for (const g of GRADIENT_ORDER) {
    byGradient
      .get(g)!
      .sort((a, b) => probabilityMidpoint(b.probability) - probabilityMidpoint(a.probability));
  }

  const picked: Candidate[] = [];
  const overflow: Candidate[] = [];
  GRADIENT_ORDER.forEach((g, i) => {
    const list = byGradient.get(g)!;
    const take = Math.min(counts[i], list.length);
    picked.push(...list.slice(0, take));
    overflow.push(...list.slice(take));
  });
  // 名额顺延：梯度缺额由未入选者按概率中点降序补足
  if (picked.length < total && overflow.length > 0) {
    overflow.sort((a, b) => probabilityMidpoint(b.probability) - probabilityMidpoint(a.probability));
    picked.push(...overflow.slice(0, total - picked.length));
  }
  picked.sort((a, b) => {
    const gi = GRADIENT_ORDER.indexOf(a.gradient) - GRADIENT_ORDER.indexOf(b.gradient);
    return gi !== 0
      ? gi
      : probabilityMidpoint(b.probability) - probabilityMidpoint(a.probability);
  });
  return picked;
}
