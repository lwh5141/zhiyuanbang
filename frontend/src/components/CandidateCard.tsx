/** 志愿卡：梯度角标 + 校名专业 + 概率区间 + 标签 + 内嵌 EvidenceBar（首页与方案页复用） */
import EvidenceBar from './EvidenceBar';
import type { Candidate } from '@/types/candidate';
import styles from './CandidateCard.module.css';

interface CandidateCardProps {
  candidate: Candidate;
  /** 志愿序号（方案页展示） */
  index?: number;
}

export default function CandidateCard({ candidate, index }: CandidateCardProps) {
  const [lo, hi] = candidate.probability;
  return (
    <div className={styles.wrap}>
      {index !== undefined && <span className={`${styles.index} num`}>{index}</span>}
      <EvidenceBar
        gradient={candidate.gradient}
        title={`${candidate.school} · ${candidate.major}`}
        subtitle={`${candidate.majorGroup} · ${candidate.city} · ${candidate.tier}`}
        probabilityText={`${lo}–${hi}%`}
        extra={
          candidate.tags.length > 0 ? (
            <div className={styles.tags}>
              {candidate.tags.map((t) => (
                <span key={t} className={styles.tag}>
                  {t}
                </span>
              ))}
            </div>
          ) : undefined
        }
        evidence={candidate.evidence}
      />
    </div>
  );
}
