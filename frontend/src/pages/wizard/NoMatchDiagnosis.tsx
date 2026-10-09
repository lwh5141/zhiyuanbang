/**
 * 候选=0 诊断页（PRD 9.4，禁止静默降级的配套）：
 * 说明致无解条件 + 放宽建议，绝不静默输出空方案。
 */
import styles from './NoMatchDiagnosis.module.css';

interface NoMatchDiagnosisProps {
  reasons: string[];
  onBack: () => void;
}

export default function NoMatchDiagnosis({ reasons, onBack }: NoMatchDiagnosisProps) {
  return (
    <div className={`${styles.diag} screen-in`}>
      <div className={styles.title}>暂无匹配方案</div>
      <div className={styles.desc}>
        当前条件下引擎算不出任何志愿（候选=0）。按约定，我们不会静默放宽你的条件，
        也不会给你一个空方案——请看下面的原因与建议：
      </div>
      <div className={styles.reasonList}>
        {reasons.map((reason) => (
          <div key={reason} className={styles.reasonItem}>
            <span className={styles.reasonDot} />
            <span>{reason}</span>
          </div>
        ))}
      </div>
      <button type="button" className={`${styles.backBtn} tap`} onClick={onBack}>
        返回修改意向
      </button>
      <div className={styles.note}>你的黑名单与硬性条件永远不会被系统擅自放宽，调整权始终在你手中。</div>
    </div>
  );
}

