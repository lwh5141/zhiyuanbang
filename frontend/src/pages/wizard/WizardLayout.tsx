/**
 * 向导壳：StepHeader + 按 :step 渲染子步骤。
 * 路由：/wizard/1..5（S2.5 并入 step 3 顶部展示段）；无效步骤重定向 /wizard/1。
 * 黑名单确认页（step 6 语义）在 PlanPage 内渲染，不可绕过。
 */
import { useEffect, useState } from 'react';
import { Navigate, useNavigate, useParams } from 'react-router-dom';
import StepHeader from '@/components/StepHeader';
import { useApp } from '@/store/AppContext';
import { useToast } from '@/store/useToast';
import type { Draft } from '@/types/draft';
import type { Plan } from '@/types/candidate';
import { buildPlanFor } from '@/services/planService';
import Step1Location from './Step1Location';
import Step2Score from './Step2Score';
import Step3Preset from './Step3Preset';
import Step4Chat from './Step4Chat';
import Step5Identity from './Step5Identity';
import BlacklistGate from './BlacklistGate';
import styles from './WizardLayout.module.css';

const VALID_STEPS: readonly number[] = [1, 2, 3, 4, 5, 6];

export default function WizardLayout() {
  const { step } = useParams();
  const navigate = useNavigate();
  const { draft, dispatch } = useApp();
  const { show } = useToast();
  const [plan, setPlan] = useState<Plan | null>(null);
  const [planLoading, setPlanLoading] = useState(false);

  const stepNum = Number(step);
  const valid = VALID_STEPS.includes(stepNum);

  // 步骤变更即时写入草稿（断点续填的锚点）；hooks 必须无条件调用，故先判 valid 再 dispatch
  useEffect(() => {
    if (valid) dispatch({ type: 'GOTO_STEP', step: stepNum as Draft['step'] });
  }, [valid, stepNum, dispatch]);

  // S5: Step 6 需要异步获取 plan 用于 BlacklistGate
  useEffect(() => {
    if (stepNum !== 6) return;
    let alive = true;
    setPlanLoading(true);
    void buildPlanFor(draft.profile, draft.preferences).then((p) => {
      if (!alive) return;
      setPlan(p);
      setPlanLoading(false);
    });
    return () => { alive = false; };
  }, [stepNum, draft.profile, draft.preferences]);

  // 无效步骤重定向（hooks 之后 return，避免条件性调用 hooks）
  if (!valid) return <Navigate to="/wizard/1" replace />;

  const onBack = () => {
    if (stepNum === 1) {
      navigate('/');
    } else {
      navigate(-1);
    }
  };

  const content =
    stepNum === 1 ? (
      <Step1Location />
    ) : stepNum === 2 ? (
      <Step2Score />
    ) : stepNum === 3 ? (
      <Step3Preset />
    ) : stepNum === 4 ? (
      <Step4Chat />
    ) : stepNum === 5 ? (
      <Step5Identity />
    ) : planLoading || !plan ? (
      <div className={styles.loading}>引擎计算中…（模拟后端延迟）</div>
    ) : plan.blacklistBlocked > 0 ? (
      <BlacklistGate
        plan={plan}
        currentBlacklist={draft.preferences.majorBlacklist}
        onContinue={() => navigate('/plan')}
        onRemove={(remaining) => {
          dispatch({ type: 'UPDATE_PREFS', patch: { majorBlacklist: remaining } });
          navigate('/plan');
        }}
      />
    ) : (
      <div className={styles.loading}>方案已就绪，正在跳转…</div>
    );

  return (
    <div className={styles.page}>
      <StepHeader
        step={stepNum}
        onBack={onBack}
        onHint={() => show('每一步都可返回修改，草稿已自动保存')}
      />
      <div key={stepNum} className="screen-in">
        {content}
      </div>
    </div>
  );
}
