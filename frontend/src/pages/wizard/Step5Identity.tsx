/**
 * S5 特殊身份 + 信息完整度（REQ-008 / REQ-011）：
 * 特殊身份勾选卡（艺体类 hidden:true V1 隐藏）+ 政策示意提示 + 完整度评分展示（非必填拦路）。
 * 提交 → 进入方案生成（黑名单拦截确认页不可绕过，由方案页守卫）。
 */
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import OptionCard from '@/components/OptionCard';
import { score as completenessScore } from '@/engine/completeness';
import { useApp } from '@/store/AppContext';
import { useToast } from '@/store/useToast';
import type { Draft } from '@/types/draft';
import styles from './wizard.module.css';
import local from './Step5Identity.module.css';

interface IdentityItem {
  id: string;
  label: string;
  desc: string;
  hidden: boolean;
}

interface PolicyItem {
  identityId: string;
  appliesTo: string[];
  summary: string;
}

export default function Step5Identity() {
  const navigate = useNavigate();
  const { draft, dispatch } = useApp();
  const { show } = useToast();
  const { profile, preferences } = draft;

  const [identities, setIdentities] = useState<IdentityItem[] | null>(null);
  const [policies, setPolicies] = useState<PolicyItem[]>([]);

  // 特殊身份清单（静态配置）+ 政策示意（演示数据）
  useEffect(() => {
    let alive = true;
    void Promise.all([
      import('@/data/config/specialIdentities.json'),
      import('@/data/mock/policy.gd.json'),
    ]).then(([idJson, policyJson]) => {
      if (!alive) return;
      setIdentities(
        (idJson as unknown as { items: IdentityItem[] }).items.filter((item) => !item.hidden),
      );
      setPolicies((policyJson as unknown as { policies: PolicyItem[] }).policies);
    });
    return () => {
      alive = false;
    };
  }, []);

  const provinceCode = profile.province;
  const completeness = completenessScore(profile, preferences);

  const toggleIdentity = (id: string) => {
    const next = profile.specialIdentities.includes(id)
      ? profile.specialIdentities.filter((x) => x !== id)
      : [...profile.specialIdentities, id];
    dispatch({ type: 'UPDATE_PROFILE', patch: { specialIdentities: next } });
    show('特殊身份已更新 · 草稿已自动保存');
  };

  const submit = () => {
    dispatch({ type: 'GOTO_STEP', step: 6 as Draft['step'] });
    navigate('/plan');
  };

  return (
    <div className={`${styles.body} screen-in`}>
      <div className={styles.sectionTitle}>特殊身份（选填）</div>
      <div className={styles.sectionSub}>
        勾选后按省份政策表校验适用性；艺体类选项 V1 暂不开放
      </div>
      <div className={local.identityList}>
        {(identities ?? []).map((item) => {
          const policy = policies.find(
            (p) => p.identityId === item.id && provinceCode !== undefined && p.appliesTo.includes(provinceCode),
          );
          return (
            <div key={item.id}>
              <OptionCard
                title={item.label}
                subtitle={item.desc}
                selected={profile.specialIdentities.includes(item.id)}
                onSelect={() => toggleIdentity(item.id)}
              />
              {profile.specialIdentities.includes(item.id) && policy && (
                <div className={local.policyHint}>{policy.summary}</div>
              )}
            </div>
          );
        })}
        {identities === null && <div className={styles.sectionSub}>身份清单加载中…</div>}
      </div>

      {/* 信息完整度评分（引导而非拦截） */}
      <div className={local.completenessCard}>
        <div className={local.completenessLabel}>
          信息完整度 <span className={`${local.completenessValue} num`}>{completeness}%</span>
        </div>
        <div className={local.completenessBar}>
          <div className={local.completenessFill} style={{ width: `${completeness}%` }} />
        </div>
        <div className={local.completenessNote}>补全意向可提升推荐精度（不强制，无必填死锁）</div>
      </div>

      <button type="button" className={`${styles.primary} tap`} onClick={submit}>
        提交，生成方案
      </button>
      <div className={styles.sectionSub} style={{ textAlign: 'center' }}>
        提交后如命中黑名单会先进入拦截确认页（不可绕过）
      </div>
    </div>
  );
}
