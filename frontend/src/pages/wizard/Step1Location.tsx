/**
 * S1 定位：省份卡片（广东上线/其余灰态）、首选单选、再选多选恰 2 门校验、回显确认条。
 * PRD 8.1 选科三层校验之第①层（前端即时）：再选科目数 ≠ 2 时「下一步」置灰。
 */
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import OptionCard from '@/components/OptionCard';
import { isValidSubjectCombo } from '@/types/profile';
import type { ElectiveSubject, ProvinceConfig, SubjectCode } from '@/types/profile';
import { getProvinceByCode } from '@/services/provinceService';
import { getProvinces } from '@/services/provinceService';
import { useApp } from '@/store/AppContext';
import { useToast } from '@/store/useToast';
import styles from './wizard.module.css';

const ELECTIVE_OPTIONS: ElectiveSubject[] = ['化学', '生物', '地理', '政治'];
const TRACK_OPTIONS: SubjectCode[] = ['物理', '历史'];

export default function Step1Location() {
  const navigate = useNavigate();
  const { draft, dispatch } = useApp();
  const { show } = useToast();
  const { profile } = draft;

  const [provinces, setProvinces] = useState<ProvinceConfig[] | null>(null);

  useEffect(() => {
    let alive = true;
    void getProvinces().then((list) => {
      if (alive) setProvinces(list);
    });
    return () => {
      alive = false;
    };
  }, []);

  const config = getProvinceByCode(profile.province);
  const provinceName = config?.name ?? '';

  // 再选恰好 2 门才合法（3+1+2）
  const electiveOk = config ? isValidSubjectCombo(config, profile.track ?? '物理', profile.electives) : false;
  const canNext = profile.province !== undefined && profile.track !== undefined && electiveOk;

  const toggleElective = (subject: ElectiveSubject) => {
    const next = profile.electives.includes(subject)
      ? profile.electives.filter((s) => s !== subject)
      : [...profile.electives, subject];
    if (next.length > 2) {
      show('再选科目最多 2 科（广东 3+1+2 规则）');
      return;
    }
    dispatch({ type: 'UPDATE_PROFILE', patch: { electives: next } });
    show('再选科目已更新 · 草稿已自动保存');
  };

  return (
    <div className={`${styles.body} screen-in`}>
      {/* 回显确认条 */}
      <div className={styles.echo}>
        已选择：{provinceName || '（待选）'}
        {profile.track ? ` · ${profile.track}类` : ''}
        {profile.electives.length > 0 ? ` · 再选 ${profile.electives.join('+')}` : ''}
        （可随时返回修改）
      </div>

      {/* 省份卡片 */}
      <div className={`${styles.sectionTitle} ${styles.sectionTitleGap}`}>你在哪个省份？</div>
      <div className={styles.provinceGrid}>
        {(provinces ?? []).map((p) => (
          <OptionCard
            key={p.code}
            title={p.name}
            subtitle={p.online ? `已上线 · ${p.mode}` : '即将开放'}
            selected={profile.province === p.code}
            disabled={!p.online}
            onSelect={() => {
              dispatch({ type: 'UPDATE_PROFILE', patch: { province: p.code } });
              show(`已选择${p.name} · 草稿已自动保存`);
            }}
          />
        ))}
        {provinces === null && <div className={styles.loadingInline}>省份配置加载中…</div>}
      </div>

      {/* 选科组合 */}
      <div className={`${styles.sectionTitle} ${styles.sectionTitleGap}`}>选科组合</div>
      <div className={styles.sectionSub}>图示勾选，填错立即拦截提示</div>
      <div className={styles.trackRow}>
        {TRACK_OPTIONS.map((t) => (
          <OptionCard
            key={t}
            title={`首选 · ${t}`}
            selected={profile.track === t}
            onSelect={() => {
              dispatch({ type: 'UPDATE_PROFILE', patch: { track: t } });
              show(`已选择${t}类 · 草稿已自动保存`);
            }}
          />
        ))}
      </div>
      <div className={styles.pillRow}>
        {ELECTIVE_OPTIONS.map((s) => (
          <OptionCard
            key={s}
            title={`再选 · ${s}`}
            pill
            selected={profile.electives.includes(s)}
            onSelect={() => toggleElective(s)}
          />
        ))}
      </div>

      {!electiveOk && profile.track !== undefined && (
        <div className={styles.warn}>
          再选科目需选满 2 门（当前 {profile.electives.length} 门）· 选满后可继续
        </div>
      )}

      <button
        type="button"
        className={`${styles.primary} tap ${canNext ? '' : styles.primaryDisabled}`}
        onClick={() => {
          if (canNext) {
            navigate('/wizard/2');
          } else {
            show('省份、首选与再选科目数不合法，无法进入下一步');
          }
        }}
      >
        {canNext ? '下一步' : '请选满 2 门再选科目后继续'}
      </button>
    </div>
  );
}
