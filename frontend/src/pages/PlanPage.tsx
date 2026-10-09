/**
 * 方案页：档案胶囊、完整度提示、四梯度统计卡、降级明示、志愿卡列表、合规标注。
 * 三种守卫态：信息不足 → 引导回向导；候选=0 → NoMatchDiagnosis；黑名单拦截 → BlacklistGate（不可绕过）。
 */
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import CandidateCard from '@/components/CandidateCard';
import ComplianceNote from '@/components/ComplianceNote';
import GradientBar from '@/components/GradientBar';
import Pill from '@/components/Pill';
import { IcBack } from '@/icons';
import { getVolunteerLimit } from '@/engine/planBuilder';
import { buildPlanFor } from '@/services/planService';
import { getProvinceByCode } from '@/services/provinceService';
import { useApp } from '@/store/AppContext';
import type { Plan } from '@/types/candidate';
import BlacklistGate from './wizard/BlacklistGate';
import NoMatchDiagnosis from './wizard/NoMatchDiagnosis';
import styles from './PlanPage.module.css';

/** 四梯度统计卡顺序与配色 */
const STAT_ORDER = [
  { g: '冲' as const, color: 'var(--c-rush)' },
  { g: '稳' as const, color: 'var(--c-stable)' },
  { g: '保' as const, color: 'var(--c-safe)' },
  { g: '垫' as const, color: 'var(--c-base)' },
];

export default function PlanPage() {
  const navigate = useNavigate();
  const { draft, dispatch } = useApp();
  const { profile, preferences } = draft;

  const [plan, setPlan] = useState<Plan | null>(null);
  const [loading, setLoading] = useState(true);
  /** 黑名单确认页「继续拦截」确认态（不可绕过：刷新后重新拦截） */
  const [gateAck, setGateAck] = useState(false);

  const ready =
    profile.province !== undefined &&
    profile.track !== undefined &&
    profile.totalScore !== undefined &&
    (profile.rankOverride ?? profile.systemRank) !== undefined;

  // 生成方案：档案或意向变化即重算（所有步骤可回退且结果即时刷新）
  useEffect(() => {
    let alive = true;
    if (!ready) {
      setPlan(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    void buildPlanFor(profile, preferences).then((p) => {
      if (!alive) return;
      setPlan(p);
      setLoading(false);
    });
    return () => {
      alive = false;
    };
  }, [ready, profile, preferences]);

  const provinceName = getProvinceByCode(profile.province)?.name ?? '—';
  const userRank = profile.rankOverride ?? profile.systemRank;
  const volunteerLimit = getVolunteerLimit(profile.province);

  const goBackHome = () => navigate('/');

  // ① 档案不完整：引导回向导补全
  if (!ready) {
    return (
      <div className={styles.page}>
        <div className={styles.header}>
          <button type="button" className={`${styles.back} tap`} onClick={goBackHome} aria-label="返回">
            <IcBack />
          </button>
          <div className={styles.headerTitle}>我的方案 · 示意</div>
        </div>
        <div className={styles.body}>
          <div className={styles.emptyCard}>
            还没有可展示的方案：请先完成省份、选科、总分采集（位次由系统反查）。
            <button
              type="button"
              className={`${styles.primaryBtn} tap`}
              onClick={() => navigate('/wizard/1')}
            >
              去开始填报
            </button>
          </div>
          <ComplianceNote />
        </div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <button type="button" className={`${styles.back} tap`} onClick={goBackHome} aria-label="返回">
          <IcBack />
        </button>
        <div className={styles.headerTitle}>我的方案 · 示意</div>
      </div>

      <div className={styles.body}>
        {/* 档案胶囊 */}
        <div className={styles.pillRow}>
          <Pill>{provinceName}省</Pill>
          <Pill>{profile.track}类</Pill>
          <Pill>{profile.totalScore} 分</Pill>
          <Pill>位次 {(userRank ?? 0).toLocaleString()}</Pill>
        </div>

        {loading && <div className={styles.loading}>引擎计算中…（模拟后端延迟）</div>}

        {!loading && plan && (
          <>
            {/* 候选=0 → 诊断页（禁止静默降级） */}
            {plan.isEstimate ? (
              <NoMatchDiagnosis reasons={plan.noMatchReasons} onBack={() => navigate('/wizard/3')} />
            ) : /* 黑名单拦截确认页（不可绕过） */
            plan.blacklistBlocked > 0 && !gateAck ? (
              <BlacklistGate
                plan={plan}
                currentBlacklist={preferences.majorBlacklist}
                onContinue={() => setGateAck(true)}
                onRemove={(remaining) => {
                  dispatch({ type: 'UPDATE_PREFS', patch: { majorBlacklist: remaining } });
                }}
              />
            ) : (
              <>
                {/* 完整度提示（非必填拦路） */}
                <div className={styles.completeness}>
                  信息完整度 {plan.completeness}% · 补全意向可提升推荐精度（不强制）
                </div>

                {/* 降级明示（L1/L2 全程明示，禁止静默） */}
                {plan.degraded.length > 0 && (
                  <div className={styles.degraded}>
                    <div className={styles.degradedTitle}>
                      已按固定顺序放宽条件（全程明示，不静默降级）
                    </div>
                    {plan.degraded.map((step) => (
                      <div key={step.level} className={styles.degradedItem}>
                        <span className={styles.degradedLevel}>{step.level}</span>
                        {step.desc}
                      </div>
                    ))}
                  </div>
                )}

                {/* 四梯度统计卡 */}
                <div className={styles.statRow}>
                  {STAT_ORDER.map(({ g, color }) => (
                    <div key={g} className={styles.statCard}>
                      <div className={styles.statLabel} style={{ color }}>
                        {g}
                      </div>
                      <div className={`${styles.statValue} num`}>{plan.gradientStats[g] ?? 0}</div>
                    </div>
                  ))}
                </div>

                <GradientBar stats={plan.gradientStats} showLegend={false} />
                <div className={styles.ratioMeta}>
                  实际配比 {plan.ratio.join(':')} · 共 {plan.candidates.length} / {volunteerLimit} 个平行志愿
                </div>

                {/* 志愿卡列表 */}
                <div>
                  {plan.candidates.map((cand, i) => (
                    <CandidateCard key={cand.id} candidate={cand} index={i + 1} />
                  ))}
                </div>

                <ComplianceNote />
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}
