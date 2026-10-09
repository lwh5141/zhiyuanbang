/** 信息胶囊标签（方案页顶部「广东省/物理类/598 分」等） */
import type { ReactNode } from 'react';
import styles from './Pill.module.css';

interface PillProps {
  children: ReactNode;
}

export default function Pill({ children }: PillProps) {
  return <span className={`${styles.pill} num`}>{children}</span>;
}
