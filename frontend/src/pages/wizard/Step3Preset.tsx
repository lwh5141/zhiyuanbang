/**
 * S3 意向预设：权重三选一卡片 + 三档微调面板（禁裸滑杆）+ 实时配比/分布预览（REQ-004）。
 * 顶部并入 S2.5 去向示例（架构文档：S2.5 = step 3 顶部展示段）。
 */
import { useNavigate } from 'react-router-dom';
import GradientBar from '@/components/GradientBar';
import OptionCard from '@/components/OptionCard';
import { countsFromRatio, getBaseRatio, getPresetRatio } from '@/engine/ratio';
import { getVolunteerLimit } from '@/engine/planBuilder';
import { getProvinceByCode } from '@/services/provinceService';
import { useApp } from '@/store/AppContext';
import { useToast } from '@/store/useToast';
import type { TuneLevel, WeightPreset } from '@/types/preference';
import Step25Preview from './Step25Preview';
import styles from './wizard.module.css';

const PRESETS: { preset: WeightPreset; desc: string }[] = [
  { preset: '保专业', desc: '优先满足目标专业，院校层次可让步' },
  { preset: '保学校', desc: '优先冲更好的学校，专业可接受调剂' },
  { preset: '保城市', desc: '优先留在目标城市，层次与专业可让步' },
];

const TUNES: { level: TuneLevel; label: string }[] = [
  { level: 0, label: '标准' },
  { level: 1, label: '偏向' },
  { level: 2, label: '强偏向' },
];

export default function Step3Preset() {
  const navigate = useNavigate();
  const { draft, dispatch } = useApp();
  const { show } = useToast();
  const { profile, preferences } = draft;

  const volunteerLimit = getVolunteerLimit(profile.province);
  const provinceName = getProvinceByCode(profile.province)?.name ?? '';
  const ratio = preferences.weightPreset ? getPresetRatio(preferences.weightPreset, preferences.tune) : getBaseRatio();
  const counts = countsFromRatio(ratio, volunteerLimit);

  return (
    <div className={`${styles.body} screen-in`}>
      {/* S2.5 粗结果（先给价值再要信息） */}
      <Step25Preview />

      {/* 权重三选一（PRD 8.2：首次引导必选其一；禁止裸滑杆） */}
      <div className={`${styles.sectionTitle} ${styles.sectionTitleGap}`}>
        你最看重什么？（{provinceName} · 必选其一）
      </div>
      <div className={styles.presetList}>
        {PRESETS.map(({ preset, desc }) => (
          <OptionCard
            key={preset}
            title={preset}
            subtitle={desc}
            selected={preferences.weightPreset === preset}
            onSelect={() => {
              dispatch({ type: 'UPDATE_PREFS', patch: { weightPreset: preset } });
              show(`已选择「${preset}」 · 配比实时刷新 · 草稿已自动保存`);
            }}
          />
        ))}
      </div>

      {/* 微调面板：三档档位（非连续滑杆） */}
      <div className={styles.sectionSub} style={{ marginTop: 14 }}>
        微调（选填）——在预设基础上向更强偏向移动
      </div>
      <div className={styles.tuneRow}>
        {TUNES.map(({ level, label }) => (
          <button
            key={level}
            type="button"
            className={`${styles.tuneBtn} tap ${preferences.tune === level ? styles.tuneBtnOn : ''}`}
            onClick={() => dispatch({ type: 'UPDATE_PREFS', patch: { tune: level } })}
          >
            {label}
          </button>
        ))}
      </div>

      {/* 实时配比/分布预览（REQ-004） */}
      <div className={styles.previewCard}>
        <div className={styles.sectionTitle} style={{ fontSize: 14 }}>
          方案分布实时预览
        </div>
        <GradientBar ratio={ratio} />
        <div className={`${styles.previewMeta} num`}>
          {volunteerLimit} 个平行志愿 → 冲 {counts[0]} · 稳 {counts[1]} · 保 {counts[2]} · 垫 {counts[3]}
          （配比 {ratio.join(':')}）
        </div>
      </div>

      <button
        type="button"
        className={`${styles.primary} tap ${preferences.weightPreset ? '' : styles.primaryDisabled}`}
        onClick={() => {
          if (preferences.weightPreset) {
            navigate('/wizard/4');
          } else {
            show('请先选择一个权重预设（构成合法输入的最小集）');
          }
        }}
      >
        {preferences.weightPreset ? '下一步' : '请先选择权重预设'}
      </button>
    </div>
  );
}
