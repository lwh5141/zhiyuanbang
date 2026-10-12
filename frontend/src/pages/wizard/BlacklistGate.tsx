/**
 * 黑名单拦截确认页（REQ-007，硬约束）：展示被拦截的 N 个志愿及命中的黑名单条目，
 * 用户只能「移出黑名单」或「继续拦截」，绝不可绕过进入最终方案。
 * 由 PlanPage 在 plan.blacklistBlocked > 0 且未确认时渲染（刷新后重新拦截，保守安全）。
 */
import { matchBlacklistEntries } from '@/engine/blacklist';
import type { Plan } from '@/types/candidate';
import styles from './BlacklistGate.module.css';

interface BlacklistGateProps {
  plan: Plan;
  /** 当前黑名单条目（用于反推「哪些条目命中了被拦截志愿」） */
  currentBlacklist: string[];
  /** 继续拦截：接受方案不含被拦截志愿，进入最终展示 */
  onContinue: () => void;
  /** 移出黑名单：传入保留的黑名单条目（父组件 dispatch 更新偏好并自动重算方案） */
  onRemove: (remainingBlacklist: string[]) => void;
}

export default function BlacklistGate({ plan, currentBlacklist, onContinue, onRemove }: BlacklistGateProps) {
  // 汇总被拦截志愿命中的黑名单条目（去重）：「移出黑名单」只移除这些条目，其余保留
  const hitEntries = [
    ...new Set(plan.blockedCandidates.flatMap((cand) => matchBlacklistEntries(cand, currentBlacklist))),
  ];
  const remaining = currentBlacklist.filter((entry) => !hitEntries.includes(entry));

  return (
    <div className={`${styles.gate} screen-in`}>
      <div className={styles.title}>黑名单拦截确认</div>
      <div className={styles.desc}>
        以下 {plan.blacklistBlocked} 个志愿因包含你的黑名单专业，已被硬拦截。
        黑名单是「绝对不读」的强意愿，任何情况下不会被自动放宽——你可以移出黑名单，或继续拦截。
      </div>

      <div className={styles.list}>
        {plan.blockedCandidates.map((cand) => (
          <div key={cand.id} className={styles.item}>
            <div className={styles.school}>{cand.school}</div>
            <div className={styles.major}>
              {cand.major} · {cand.majorGroup} · {cand.city}
            </div>
          </div>
        ))}
      </div>

      {hitEntries.length > 0 && (
        <div className={styles.hitRow}>
          命中条目：{hitEntries.join('、')}
        </div>
      )}

      <button
        type="button"
        className={`${styles.removeBtn} tap`}
        onClick={() => onRemove(remaining)}
      >
        移出黑名单（{hitEntries.length} 条 · 重新生成方案）
      </button>
      <button type="button" className={`${styles.continueBtn} tap`} onClick={onContinue}>
        继续拦截（{plan.blacklistBlocked} 个志愿不出现在方案中）
      </button>
      <div className={styles.note}>黑名单为绝对约束，本页不可绕过；刷新后将重新进入拦截确认。</div>
    </div>
  );
}
