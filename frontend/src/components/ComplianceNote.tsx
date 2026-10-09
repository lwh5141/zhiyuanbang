/**
 * 合规标注（硬约束）：所有含方案的输出必须携带。
 * 文案固定，不接受外部传入，防止误写违规话术。
 */
import styles from './ComplianceNote.module.css';

export default function ComplianceNote() {
  return (
    <div className={styles.note}>
      本方案由规则引擎计算，仅供参考
      <br />
      以广东省考试院官方公布为准
    </div>
  );
}
