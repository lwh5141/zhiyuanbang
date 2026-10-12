/** 首页 1:1 还原：Hero 倒计时 + 青空 + CTA、断点续填卡、证据条示例、四梯度预览、首发省份说明 */
import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import EvidenceBar from '@/components/EvidenceBar';
import GradientBar from '@/components/GradientBar';
import { IcChevron, IcPin, IcPlay } from '@/icons';
import { getBaseRatio } from '@/engine/ratio';
import { getVolunteerLimit } from '@/engine/planBuilder';
import { getProvinceByCode } from '@/services/provinceService';
import { useApp } from '@/store/AppContext';
import appJson from '@/data/config/app.json';
import homeSampleJson from '@/data/mock/homeSample.gd.json';
import type { Evidence, Gradient } from '@/types/candidate';
import styles from './HomePage.module.css';

/** 静态配置：高考目标日、步骤名、品牌（见 data/config/app.json） */
const EXAM_DATE = new Date(appJson.examDate);
const STEP_NAMES = appJson.wizard.stepNames as unknown as Record<number, string>;
const BRAND = appJson.brand;

/** 动态数据：首页证据条示例与样卡（演示数据，将来由后端返回，见 data/mock/homeSample.gd.json） */
const SAMPLE_EVIDENCE = homeSampleJson.evidence as Evidence;
const SAMPLE_CARD = homeSampleJson.sampleCard;

export default function HomePage() {
  const navigate = useNavigate();
  const { draft, hydrated } = useApp();
  const [evOpen, setEvOpen] = useState(false);

  // 倒计时（UI 层允许使用 Date；engine 层禁止）
  const days = useMemo(
    () => Math.max(0, Math.ceil((EXAM_DATE.getTime() - Date.now()) / 86400000)),
    [],
  );

  const gdConfig = getProvinceByCode('GD');
  const baseRatio = getBaseRatio();
  // 志愿数从省配置读取（getVolunteerLimit 缺省回退到配置表首位省份＝广东），禁止硬编码 45
  const volunteerLimit = getVolunteerLimit(gdConfig?.code);

  // 断点续填：已有进度才显示（US5 / REQ-003）
  const hasProgress = hydrated && (draft.step > 1 || draft.profile.province !== undefined);
  const resumeStep = Math.min(Math.max(draft.step, 1), 5);

  return (
    <div className={styles.page}>
      {/* ① Hero：青空 + 倒计时 + 品牌 + 主 CTA */}
      <div className={styles.hero}>
        <div className={`${styles.cloud} ${styles.cloudA}`} />
        <div className={`${styles.cloud} ${styles.cloudB}`} />
        <svg width="46" height="46" viewBox="0 0 46 46" fill="none" className={styles.plane} aria-hidden="true">
          <path d="M4 22 40 7l-9 32-8.5-11.5L4 22z" fill="#fff" opacity=".95" />
          <path d="M22.5 27.5 40 7" stroke="#DDEFFB" strokeWidth="1.6" />
        </svg>

        <div className={styles.countdownLabel}>距 2027 年高考还有</div>
        <div className={styles.countdown}>
          <span className={`${styles.days} num`}>{days}</span>
          <span className={styles.dayUnit}>天</span>
        </div>
        <div className={styles.brandBlock}>
          <div className={styles.brand}>{BRAND.name}</div>
          <div className={styles.slogan}>{BRAND.slogan}</div>
        </div>

        <button
          type="button"
          className={`${styles.cta} tap`}
          onClick={() => navigate('/wizard/1')}
        >
          <div>
            <div className={styles.ctaTitle}>开始填报</div>
            <div className={styles.ctaSub}>5 步 · 净输入 ≤8 项 · 全程可回改</div>
          </div>
          <div className={styles.ctaIcon}>
            <IcChevron color="#fff" size={20} />
          </div>
        </button>
      </div>

      {/* ② 断点续填卡（US5 / REQ-003） */}
      {hasProgress && (
        <div className={styles.section}>
          <button
            type="button"
            className={`${styles.draftCard} tap`}
            onClick={() => navigate(`/wizard/${resumeStep}`)}
          >
            <div className={styles.draftIcon}>
              <IcPlay />
            </div>
            <div className={styles.draftText}>
              <div className={styles.draftTitle}>继续上次填报</div>
              <div className={styles.draftSub}>
                第 {resumeStep} 步 · {STEP_NAMES[resumeStep] ?? ''} · 草稿已自动保存
              </div>
            </div>
            <IcChevron />
          </button>
        </div>
      )}

      {/* ③ 证据条（REQ-009：可验证信任前置到首页） */}
      <div className={styles.section}>
        <div className={styles.blockTitle}>每一条推荐，都有据可查</div>
        <div className={styles.blockSub}>位次一律系统反查，概率给出区间，不黑箱</div>
        <div className={styles.sampleWrap}>
          <EvidenceBar
            gradient={SAMPLE_CARD.gradient as Gradient}
            title={SAMPLE_CARD.title}
            subtitle={SAMPLE_CARD.subtitle}
            probabilityText={SAMPLE_CARD.probabilityText}
            evidence={SAMPLE_EVIDENCE}
            open={evOpen}
            onToggle={() => setEvOpen((v) => !v)}
          />
          <button
            type="button"
            className={`${styles.evToggle} tap`}
            onClick={() => setEvOpen((v) => !v)}
          >
            {evOpen ? '收起证据 ▴' : '展开查看四类证据 ▾'}
          </button>
        </div>
      </div>

      {/* ④ 冲稳保垫四梯度预览 */}
      <div className={styles.section}>
        <div className={styles.rowBetween}>
          <div className={styles.blockTitle}>方案长这样</div>
          <div className={styles.blockMeta}>
            {volunteerLimit} 个平行志愿 · {baseRatio.join(':')}
          </div>
        </div>
        <GradientBar ratio={baseRatio} />
      </div>

      {/* 首发省份说明 */}
      <div className={styles.footerNote}>
        <IcPin />
        <span>首发省份 {appJson.launchProvince.name} · {gdConfig?.mode ?? '3+1+2'} {gdConfig?.batchMode ?? '院校专业组'}模式</span>
      </div>
    </div>
  );
}
