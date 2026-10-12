/** 通用可选卡片：省份 / 首选 / 权重预设 / 特殊身份复用；选中态 / 灰态 / 勾标（原型 S1 卡片平移） */
import type { ReactNode } from 'react';
import { IcCheck } from '@/icons';
import styles from './OptionCard.module.css';

interface OptionCardProps {
  title: string;
  /** 次要行（如「已上线 · 3+1+2」/「即将开放」/身份说明） */
  subtitle?: ReactNode;
  selected?: boolean;
  /** 灰态（如未上线省份）：不可点，点击给 Toast 提示 */
  disabled?: boolean;
  onSelect?: () => void;
  /** 胶囊样式（再选科目用，原型 pill 口径） */
  pill?: boolean;
}

export default function OptionCard({
  title,
  subtitle,
  selected = false,
  disabled = false,
  onSelect,
  pill = false,
}: OptionCardProps) {
  if (pill) {
    return (
      <button
        type="button"
        className={[
          styles.pill,
          'tap',
          selected ? styles.pillOn : '',
          disabled ? styles.disabled : '',
        ].join(' ')}
        onClick={disabled ? undefined : onSelect}
        disabled={disabled}
      >
        {title}
      </button>
    );
  }
  return (
    <button
      type="button"
      className={[
        styles.card,
        'tap',
        selected ? styles.cardOn : '',
        disabled ? styles.disabled : '',
      ].join(' ')}
      onClick={disabled ? undefined : onSelect}
      disabled={disabled}
    >
      <div className={`${styles.title} ${selected ? styles.titleOn : ''}`}>{title}</div>
      {subtitle !== undefined && (
        <div className={`${styles.subtitle} ${selected ? styles.subtitleOn : ''}`}>{subtitle}</div>
      )}
      {selected && (
        <span className={styles.check}>
          <IcCheck />
        </span>
      )}
    </button>
  );
}
