/**
 * 全局唯一状态：Draft（Context + useReducer，零外部依赖）。
 * - 页面只读 draft / dispatch 动作，不直接触碰 localStorage；
 * - 每次状态变更经 draftStore.debounceSave 防抖 500ms 落库（REQ-003 断点续填）；
 * - 启动时异步恢复草稿（HYDRATE），恢复完成前不落库，防止空草稿覆盖已存档。
 */
import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import type { Draft } from '@/types/draft';
import type { Preferences } from '@/types/preference';
import type { Profile } from '@/types/profile';
import {
  clearDraft,
  createEmptyDraft,
  debounceSave,
  loadDraft,
} from '@/storage/draftStore';

/** 动作集合（「动作 → 状态」纯函数，学习者可读性最好） */
export type AppAction =
  | { type: 'HYDRATE'; draft: Draft }
  | { type: 'UPDATE_PROFILE'; patch: Partial<Profile> }
  | { type: 'UPDATE_PREFS'; patch: Partial<Preferences> }
  | { type: 'GOTO_STEP'; step: Draft['step'] }
  | { type: 'RESET' };

function reducer(state: Draft, action: AppAction): Draft {
  switch (action.type) {
    case 'HYDRATE':
      return action.draft;
    case 'UPDATE_PROFILE':
      return {
        ...state,
        profile: { ...state.profile, ...action.patch },
        updatedAt: new Date().toISOString(),
      };
    case 'UPDATE_PREFS':
      return {
        ...state,
        preferences: { ...state.preferences, ...action.patch },
        updatedAt: new Date().toISOString(),
      };
    case 'GOTO_STEP':
      return { ...state, step: action.step, updatedAt: new Date().toISOString() };
    case 'RESET':
      return createEmptyDraft();
    default:
      return state;
  }
}

interface AppContextValue {
  draft: Draft;
  dispatch: (action: AppAction) => void;
  /** 草稿是否已从 localStorage 恢复（恢复前页面不渲染关键表单，避免闪烁） */
  hydrated: boolean;
}

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [draft, dispatch] = useReducer(reducer, undefined, createEmptyDraft);
  const [hydrated, setHydrated] = useState(false);
  const hydratedRef = useRef(false);

  // 启动恢复：读取本地草稿并合并进状态
  useEffect(() => {
    let alive = true;
    void loadDraft().then((saved) => {
      if (!alive) return;
      if (saved) dispatch({ type: 'HYDRATE', draft: saved });
      hydratedRef.current = true;
      setHydrated(true);
    });
    return () => {
      alive = false;
    };
  }, []);

  // 每次状态变更防抖落库（恢复完成前跳过，防止空草稿覆盖存档）
  useEffect(() => {
    if (!hydratedRef.current) return;
    debounceSave(draft);
  }, [draft]);

  const value = useMemo(() => ({ draft, dispatch, hydrated }), [draft, hydrated]);
  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

/** 全局状态 hook（组件内使用） */
export function useApp(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp 必须在 AppProvider 内使用');
  return ctx;
}

/** 重置草稿（清空本地存档 + 回到初始状态） */
export async function resetDraft(dispatch: (action: AppAction) => void): Promise<void> {
  await clearDraft();
  dispatch({ type: 'RESET' });
}
