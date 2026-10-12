/** 「我的」诚实占位页（原型 MeScreen 还原；账户体系属后续模块 PRD） */
import styles from './MePage.module.css';

export default function MePage() {
  return (
    <div className={styles.page}>
      <div className={styles.avatar} />
      <div className={styles.title}>我的 · 规划中</div>
      <div className={styles.sub}>账户体系属后续模块 PRD，此处为诚实占位</div>
    </div>
  );
}
