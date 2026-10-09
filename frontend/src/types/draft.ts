/** 全局草稿（Context + useReducer 的唯一状态，localStorage 持久化的序列化单元） */
import type { Profile } from './profile';
import type { Preferences } from './preference';

/** 步骤取值 1–6：1=S1 定位 2=S2 分数 3=S3 预设(含 S2.5 顶部展示) 4=S4 对话 5=S5 身份 6=已提交(方案/拦截确认) */
export type DraftStep = 1 | 2 | 3 | 4 | 5 | 6;

export interface Draft {
  /** 草稿结构版本（migrate 依据） */
  version: 1;
  step: DraftStep;
  profile: Profile;
  preferences: Preferences;
  /** ISO 8601 UTC，每次 dispatch 刷新 */
  updatedAt: string;
}
