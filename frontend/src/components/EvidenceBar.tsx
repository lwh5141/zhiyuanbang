/**
 * 证据条（REQ-009，G2 立身之本）：首页与方案页/志愿卡复用同一组件。
 * 可展开四类证据（往年位次/同分段人数/计划数/概率因子）+ 数据来源原文引用。
 */
import { useState, type ReactNode } from 'react';
import { IcChevron } from '@/icons';
import type { Evidence, Gradient } from '@/types/candidate';
import styles from './EvidenceBar.module.css';

interface EvidenceBarProps {
  /** 梯度角标（冲/稳/保/垫），首页示例与志愿卡传入 */
  gradient?: Gradient;
  /** 次要行（如「专业组 205 · 示意」） */
  subtitle?: string;
  /** 主标题（如「华南师范大学 · 计算机科学与技术」） */
  title?: string;
  /** 右侧概率区间文本（如「52–68%」） */
  probabilityText?: string;
  /** 附加信息行（如「无历史数据·估算」标签） */
  extra?: ReactNode;
  evidence: Evidence;
  defaultOpen?: boolean;
  /** 受控展开态（可选）：传入后由外部控制展开/收起（首页「展开证据」按钮用） */
  open?: boolean;
  onToggle?: () => void;
}

/** 梯度 → CSS 类名后缀（保持类名 ASCII camelCase） */
const GRADIENT_CLASS: Record<Gradient, string> = {
  冲: 'gRush',
  稳: 'gStable',
  保: 'gSafe',
  垫: 'gBase',
};

export default function EvidenceBar({
  gradient,
  title,
  subtitle,
  probabilityText,
  extra,
  evidence,
  defaultOpen = false,
  open: openProp,
  onToggle,
}: EvidenceBarProps) {
  // 非受控：内部状态；受控：外部 open/onToggle（两种用法兼容）
  const [innerOpen, setInnerOpen] = useState(defaultOpen);
  const open = openProp ?? innerOpen;
  const toggle = () => {
    if (onToggle) {
      onToggle();
    } else {
      setInnerOpen((v) => !v);
    }
  };

  const rows: [string, string][] = [
    ['往年位次', evidence.pastRanks],
    ['同分段人数', evidence.peerCount],
    ['计划数', evidence.planCount],
    ['概率因子', evidence.factors],
  ];

  return (
    <div
      className={`${styles.card} tap`}
      onClick={toggle}
      role="button"
      aria-expanded={open}
      tabIndex={0}
    >
      <div className={styles.headRow}>
        {gradient && (
          <span className={`${styles.badge} ${styles[GRADIENT_CLASS[gradient]]}`}>{gradient}</span>
        )}
        <div className={styles.titleWrap}>
          {title && <div className={styles.title}>{title}</div>}
          {subtitle && <div className={styles.subtitle}>{subtitle}</div>}
          {extra}
        </div>
        {probabilityText && (
          <div className={`${styles.prob} num`}>{probabilityText}</div>
        )}
        <span
          className={styles.chevron}
          style={{ transform: open ? 'rotate(90deg)' : 'none' }}
        >
          <IcChevron size={15} />
        </span>
      </div>

      {open && (
        <div className={`${styles.detail} screen-in`}>
          {rows.map(([k, v]) => (
            <div key={k} className={styles.row}>
              <span className={styles.dot} />
              <span className={styles.key}>{k}</span>
              <span className={`${styles.value} num`}>{v}</span>
            </div>
          ))}
          <div className={styles.source}>{`引用：${evidence.source}`}</div>
        </div>
      )}
    </div>
  );
}
