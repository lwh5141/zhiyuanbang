/** 向导顶栏：返回 / 步骤文案 / 渐变进度条 / 「全程可回改」提示（原型 WizardScreen 顶栏逐段平移） */
import { IcBack } from '@/icons';
import styles from './StepHeader.module.css';

interface StepHeaderProps {
  /** 当前步骤（1–5） */
  step: number;
  /** 总步数，V1 固定 5 */
  total?: number;
  onBack: () => void;
  /** 点击「全程可回改」提示的回调（通常弹 Toast） */
  onHint?: () => void;
}

export default function StepHeader({ step, total = 5, onBack, onHint }: StepHeaderProps) {
  return (
    <div className={styles.header}>
      <div className={styles.navRow}>
        <button className={`${styles.back} tap`} onClick={onBack} aria-label="返回">
          <IcBack />
        </button>
        <div className={styles.title}>
          采集向导 · 第 {step} 步 / 共 {total} 步
        </div>
        <div className={styles.spacer} />
      </div>
      <div className={styles.track}>
        <div
          className={styles.fill}
          style={{ width: `${(Math.min(step, total) / total) * 100}%` }}
        />
      </div>
      <button
        className={`${styles.hint} tap`}
        onClick={onHint}
        type="button"
      >
        全程可回改 · 草稿自动保存（点此了解）
      </button>
    </div>
  );
}
