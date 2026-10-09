/**
 * S2 分数：总分输入（0–750、<100 二次确认弹窗）、单科折叠面板（和>总分标红）、
 * 位次系统反查 + 证据展示（REQ-002）、覆盖弹窗（偏差>500 需勾选「我已核对过一分一段表」）。
 */
import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Modal from '@/components/Modal';
import { getProvinceByCode } from '@/services/provinceService';
import { lookupRank } from '@/services/rankService';
import { useApp } from '@/store/AppContext';
import { useToast } from '@/store/useToast';
import type { RankResult, SubScores } from '@/types/profile';
import styles from './wizard.module.css';

const SUB_KEYS = ['语文', '数学', '英语'] as const;

export default function Step2Score() {
  const navigate = useNavigate();
  const { draft, dispatch } = useApp();
  const { show } = useToast();
  const { profile } = draft;

  const [scoreInput, setScoreInput] = useState(
    profile.totalScore !== undefined ? String(profile.totalScore) : '',
  );
  const [subInputs, setSubInputs] = useState<Record<string, string>>(
    Object.fromEntries(SUB_KEYS.map((k) => [k, profile.subScores[k] !== undefined ? String(profile.subScores[k]) : ''])),
  );
  const [showSub, setShowSub] = useState(false);
  const [rank, setRank] = useState<RankResult | null>(null);
  const [lowScoreConfirmed, setLowScoreConfirmed] = useState(false);
  const [showLowConfirm, setShowLowConfirm] = useState(false);
  const [overrideOpen, setOverrideOpen] = useState(false);
  const [overrideInput, setOverrideInput] = useState(
    profile.rankOverride !== undefined ? String(profile.rankOverride) : '',
  );
  const [overrideDeclared, setOverrideDeclared] = useState(profile.rankOverrideConfirmed ?? false);

  const score = scoreInput === '' ? undefined : Number(scoreInput);
  const scoreValid = score !== undefined && score >= 0 && score <= 750;

  const subScores: SubScores = useMemo(() => {
    const result: SubScores = {};
    for (const key of SUB_KEYS) {
      const v = Number(subInputs[key]);
      if (subInputs[key] !== '' && Number.isFinite(v) && v > 0) result[key] = v;
    }
    return result;
  }, [subInputs]);

  const subSum = Object.values(subScores).reduce((a, b) => a + b, 0);

  // 单科分变化即时落库
  // S12: subScores dispatch 加 300ms debounce，减少高频 reducer 调用
  useEffect(() => {
    const t = setTimeout(() => {
      dispatch({ type: 'UPDATE_PROFILE', patch: { subScores } });
    }, 300);
    return () => clearTimeout(t);
  }, [subScores, dispatch]);

  // 位次系统反查（省份+首选+总分齐备且合法时；V1 仅广东有示意映射表）
  useEffect(() => {
    let alive = true;
    setRank(null);
    if (
      profile.province === undefined ||
      profile.track === undefined ||
      !scoreValid ||
      score === undefined ||
      score <= 0
    ) {
      return;
    }
    void lookupRank(profile.province, profile.track, score).then((r) => {
      if (!alive) return;
      setRank(r);
      dispatch({ type: 'UPDATE_PROFILE', patch: { systemRank: r.rank, systemPercentile: r.percentile } });
    });
    return () => {
      alive = false;
    };
  }, [profile.province, profile.track, score, scoreValid, dispatch]);

  const displayRank = profile.rankOverride ?? profile.systemRank;
  const displayPercentile = profile.rankOverride !== undefined ? null : profile.systemPercentile;
  const overrideDiff =
    profile.systemRank !== undefined && overrideInput !== ''
      ? Math.abs(Number(overrideInput) - profile.systemRank)
      : 0;
  const overrideNeedsDeclare = overrideDiff > 500;
  const overrideValid =
    overrideInput !== '' && Number.isFinite(Number(overrideInput)) && Number(overrideInput) >= 0;

  const goNext = () => {
    if (!scoreValid) {
      show('总分必填（0–750），是生成方案的最小必填项');
      return;
    }
    if (score !== undefined && score < 100 && !lowScoreConfirmed) {
      setShowLowConfirm(true);
      return;
    }
    navigate('/wizard/3');
  };

  return (
    <div className={`${styles.body} screen-in`}>
      <div className={styles.sectionTitle}>总分多少？</div>

      {/* 总分输入 */}
      <div className={styles.inputCard}>
        <input
          className={`${styles.scoreInput} num`}
          value={scoreInput}
          onChange={(e) => setScoreInput(e.target.value.replace(/\D/g, '').slice(0, 3))}
          inputMode="numeric"
          placeholder="0"
          aria-label="总分"
        />
        <span className={styles.inputHint}>分 · 范围 0–750</span>
      </div>
      {score !== undefined && !scoreValid && (
        <div className={styles.warn}>总分应在 0–750 之间</div>
      )}
      {score !== undefined && scoreValid && score < 100 && (
        <div className={styles.warn}>请核对是否为总分 · 少于 100 分需二次确认</div>
      )}

      {/* 单科折叠面板（选填，提升精度） */}
      <button type="button" className={`${styles.collapseToggle} tap`} onClick={() => setShowSub((v) => !v)}>
        选填单科分可提升精度（{showSub ? '点击收起 ▾' : '点击展开 ▸'}）
      </button>
      {showSub && (
        <div className={`${styles.subPanel} screen-in`}>
          <div className={styles.subRow}>
            {SUB_KEYS.map((key) => (
              <div key={key} className={styles.subField}>
                <div className={styles.subLabel}>{key}</div>
                <input
                  className={`${styles.subInput} num`}
                  value={subInputs[key]}
                  onChange={(e) =>
                    setSubInputs((prev) => ({ ...prev, [key]: e.target.value.replace(/\D/g, '').slice(0, 3) }))
                  }
                  inputMode="numeric"
                  aria-label={key}
                />
              </div>
            ))}
          </div>
          {scoreValid && score !== undefined && subSum > score && (
            <div className={styles.warn}>单科分之和（{subSum}）超过总分，请核对</div>
          )}
          <div className={styles.subFoot}>合计 {subSum} 分 · 留空项引擎将忽略（示意）</div>
        </div>
      )}

      {/* 位次系统反查 + 证据展示（REQ-002） */}
      <div className={styles.infoCard}>
        <div className={styles.infoCardLabel}>系统反查位次 · 无需手填</div>
        <div className={`${styles.infoCardMain} num`}>
          {scoreValid && score !== undefined && displayRank
            ? `${score} 分 ≈ 全省${profile.track ?? ''}类 ${displayRank.toLocaleString()} 名`
            : '—'}
        </div>
        <div className={styles.infoCardSub}>
          {scoreValid && displayPercentile !== null && displayPercentile !== undefined
            ? `超过全省 ${displayPercentile}% 的${profile.track ?? ''}类考生`
            : profile.rankOverride !== undefined
              ? '当前为手动覆盖位次'
              : '输入总分后自动反查'}
        </div>
        <div className={styles.sourceQuote}>
          {rank
            ? `引用：${rank.source}`
            : `引用：${getProvinceByCode(profile.province)?.name ?? '广东'}省一分一段表 · 提交后展示原文引用（演示数据 · 示意映射）`}
        </div>
      </div>

      <button
        type="button"
        className={`${styles.overrideLink} tap`}
        onClick={() => {
          setOverrideInput(profile.rankOverride !== undefined ? String(profile.rankOverride) : '');
          setOverrideDeclared(profile.rankOverrideConfirmed ?? false);
          setOverrideOpen(true);
        }}
      >
        我知道确切位次，手动覆盖
      </button>

      <button
        type="button"
        className={`${styles.primary} tap ${scoreValid ? '' : styles.primaryDisabled}`}
        onClick={goNext}
      >
        {scoreValid ? '下一步' : '请先填写总分'}
      </button>
      {/* <100 二次确认弹窗（PRD 8.1 总分校验边界） */}
      <Modal
        open={showLowConfirm}
        title="请核对是否为总分"
        confirmText="确认无误，继续"
        cancelText="返回修改"
        onConfirm={() => {
          setLowScoreConfirmed(true);
          setShowLowConfirm(false);
          navigate('/wizard/3');
        }}
        onCancel={() => setShowLowConfirm(false)}
      >
        你填写的总分少于 100 分。请再次核对成绩单，确认后将继续生成方案示意。
      </Modal>
      {/* 覆盖位次弹窗（偏差>500 需勾选声明，PRD 决策 #5） */}
      <Modal
        open={overrideOpen}
        title="覆盖系统反查位次"
        confirmText="确认覆盖"
        onConfirm={() => {
          const value = Number(overrideInput);
          dispatch({
            type: 'UPDATE_PROFILE',
            patch: { rankOverride: value, rankOverrideConfirmed: overrideNeedsDeclare },
          });
          setOverrideOpen(false);
          show('位次已覆盖 · 草稿已自动保存');
        }}
        onCancel={() => setOverrideOpen(false)}
        checkbox={{
          label: '我已核对过一分一段表（位次偏差较大，可能影响推荐精度）',
          checked: overrideDeclared,
          onChange: setOverrideDeclared,
        }}
        confirmDisabled={!overrideValid || (overrideNeedsDeclare && !overrideDeclared)}
      >
        {profile.systemRank !== undefined ? (
          <>
            与系统反查位次相差 {overrideDiff.toLocaleString()} 名，确认覆盖吗？
            {overrideNeedsDeclare && (
              <div className={styles.warn}>位次偏差 &gt;500 名，需勾选下方声明后才能覆盖。</div>
            )}
          </>
        ) : (
          '系统尚未反查到位次（请先填写总分），覆盖后将直接作为引擎输入。'
        )}
        <input
          className={`${styles.overrideInput} num`}
          value={overrideInput}
          onChange={(e) => setOverrideInput(e.target.value.replace(/\D/g, '').slice(0, 7))}
          inputMode="numeric"
          placeholder="输入确切位次"
          aria-label="覆盖位次"
        />
      </Modal>

      <button type="button" className={`${styles.linkBtn} tap`} onClick={() => navigate('/wizard/1')}>
        返回上一步
      </button>
    </div>
  );
}

