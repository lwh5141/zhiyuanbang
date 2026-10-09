/**
 * 向导壳：StepHeader + 按 :step 渲染子步骤。
 * 路由：/wizard/1..5（S2.5 并入 step 3 顶部展示段）；无效步骤重定向 /wizard/1。
 * 黑名单确认页（step 6 语义）在 PlanPage 内渲染，不可绕过。
 */
import { useEffect } from 'react';
import { Navigate, useNavigate, useParams } from 'react-router-dom';
import StepHeader from '@/components/StepHeader';
import { useApp } from '@/store/AppContext';
import { useToast } from '@/store/useToast';
import type { Draft } from '@/types/draft';
import Step1Location from './Step1Location';
import Step2Score from './Step2Score';
import Step3Preset from './Step3Preset';
import Step4Chat from './Step4Chat';
import Step5Identity from './Step5Identity';
import styles from './WizardLayout.module.css';

const VALID_STEPS: readonly number[] = [1, 2, 3, 4, 5];

export default function WizardLayout() {
  const { step } = useParams();
  const navigate = useNavigate();
  const { dispatch } = useApp();
  const { show } = useToast();

  const stepNum = Number(step);
  const valid = VALID_STEPS.includes(stepNum);

  // 步骤变更即时写入草稿（断点续填的锚点）；hooks 必须无条件调用，故先判 valid 再 dispatch
  useEffect(() => {
    if (valid) dispatch({ type: 'GOTO_STEP', step: stepNum as Draft['step'] });
  }, [valid, stepNum, dispatch]);

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
    ) : (
      <Step5Identity />
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
