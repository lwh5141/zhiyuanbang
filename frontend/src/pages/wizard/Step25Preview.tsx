/**
 * S2.5 粗结果（REQ-015）：往届同位次考生去向示例（按位次分档）。
 * 「先给价值再要信息」——并入 step 3 顶部展示段（架构文档 Wizard 映射约定）。
 */
import { useEffect, useState } from 'react';
import { fetchPastPlans, type PastPlanTier } from '@/services/sampleService';
import { useApp } from '@/store/AppContext';
import styles from './wizard.module.css';

export default function Step25Preview() {
  const { draft } = useApp();
  const { profile } = draft;
  const rank = profile.rankOverride ?? profile.systemRank;

  const [tiers, setTiers] = useState<PastPlanTier[] | null>(null);

  useEffect(() => {
    let alive = true;
    if (!rank) {
      setTiers([]);
      return;
    }
    void fetchPastPlans(rank).then((list) => {
      if (alive) setTiers(list);
    });
    return () => {
      alive = false;
    };
  }, [rank]);

  return (
    <div className={styles.infoCard}>
      <div className={styles.infoCardLabel}>
        往届同位次考生去向示例
        <span className={styles.demoTag}>演示数据</span>
      </div>
      <div className={styles.infoCardSub}>
        {rank ? `你的位次约 ${(rank ?? 0).toLocaleString()} 名，往年这个位次的考生去了：` : '补全总分与位次后展示'}
      </div>
      {tiers === null && <div className={styles.sectionSub}>示例加载中…</div>}
      {tiers !== null && tiers.length === 0 && (
        <div className={styles.sectionSub}>暂无对应分档的示例（示意数据覆盖范围有限）。</div>
      )}
      {tiers !== null &&
        tiers.map((tier) => (
          <div key={tier.label} className={styles.pastTier}>
            <div className={styles.pastTierLabel}>{tier.label}</div>
            {tier.samples.map((s) => (
              <div key={`${s.school}-${s.major}`} className={styles.pastItem}>
                <span className={styles.pastDot} />
                <span>
                  {s.school} · {s.major}
                </span>
                <span className={styles.pastNote}>{s.note}</span>
              </div>
            ))}
          </div>
        ))}
    </div>
  );
}
