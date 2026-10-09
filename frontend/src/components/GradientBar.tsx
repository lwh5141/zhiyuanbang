/**
 * 冲稳保垫配比条（含图例）：首页预览与 S3 实时预览复用。
 * 段宽由 ratio（配比）或 stats（实际数量）驱动；阈值文案读 thresholds.json，零硬编码。
 */
import thresholdsJson from '@/data/config/thresholds.json';
import type { Gradient, GradientStat } from '@/types/candidate';
import type { Ratio4 } from '@/engine/ratio';
import styles from './GradientBar.module.css';

const T = thresholdsJson;

interface GradientBarProps {
  /** 配比（如 [2,3,3,2]） */
  ratio?: Ratio4;
  /** 实际数量统计（方案页用，优先于 ratio） */
  stats?: GradientStat;
  showLegend?: boolean;
}

const GRADIENTS: Gradient[] = ['冲', '稳', '保', '垫'];

/** 梯度 → CSS 类名后缀（保持类名 ASCII camelCase） */
const SEG_CLASS: Record<Gradient, string> = {
  冲: 'segRush',
  稳: 'segStable',
  保: 'segSafe',
  垫: 'segBase',
};

export default function GradientBar({ ratio, stats, showLegend = true }: GradientBarProps) {
  const values = stats
    ? GRADIENTS.map((g) => stats[g] ?? 0)
    : (ratio ?? [T.baseRatio[0], T.baseRatio[1], T.baseRatio[2], T.baseRatio[3]]);
  const sum = values.reduce((a, b) => a + b, 0) || 1;

  const legend: [string, string][] = [
    [`冲 <${T.probability.rushBelow}%`, 'var(--c-rush)'],
    [`稳 ${T.probability.rushBelow}–${T.probability.stableBelow}%`, 'var(--c-stable)'],
    [`保 ${T.probability.stableBelow}–${T.probability.safeBelow}%`, 'var(--c-safe)'],
    [`垫 >${T.probability.safeBelow}%`, 'var(--c-base)'],
  ];

  return (
    <div>
      <div className={styles.bar}>
        {GRADIENTS.map((g, i) => (
          <div
            key={g}
            className={`${styles.seg} ${styles[SEG_CLASS[g]]}`}
            style={{ width: `${(values[i] / sum) * 100}%` }}
          >
            <span>{g}</span>
          </div>
        ))}
      </div>
      {showLegend && (
        <div className={styles.legend}>
          {legend.map(([text, color]) => (
            <div key={text} className={styles.legendItem}>
              <span className={styles.legendDot} style={{ background: color }} />
              <span className={`${styles.legendText} num`}>{text}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
