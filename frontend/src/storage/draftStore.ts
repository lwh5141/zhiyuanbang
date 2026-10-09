/**
 * 草稿仓储：序列化校验/版本迁移/防抖保存（500ms，REQ-003）。
 * AppContext 是唯一调用方；页面不直接 import 本模块。
 */
import type { Draft, DraftStep } from '@/types/draft';
import type { Preferences } from '@/types/preference';
import type { Profile } from '@/types/profile';
import type { StorageAdapter } from './StorageAdapter';
import { LocalStorageAdapter } from './LocalStorageAdapter';

const adapter: StorageAdapter = new LocalStorageAdapter();

/** 防抖窗口（架构约定 500ms） */
const DEBOUNCE_MS = 500;

let saveTimer: ReturnType<typeof setTimeout> | null = null;

/** 空草稿（全新用户首次进入） */
export function createEmptyDraft(): Draft {
  const profile: Profile = {
    electives: [],
    subScores: {},
    specialIdentities: [],
  };
  const preferences: Preferences = {
    tune: 0,
    expectedRegions: [],
    excludedRegions: [],
    majorBlacklist: [],
    schoolFloor: '不限',
    ownership: '不限',
  };
  return {
    version: 1,
    step: 1,
    profile,
    preferences,
    updatedAt: new Date().toISOString(),
  };
}

/**
 * 版本迁移与脏数据防御：任何来源不明的 JSON 一律回退为 null（视为无草稿），
 * 避免 localStorage 被污染后整站崩溃。
 */
export function migrate(raw: unknown): Draft | null {
  if (typeof raw !== 'object' || raw === null) return null;
  const r = raw as Record<string, unknown>;
  if (r.version !== 1) return null;

  const base = createEmptyDraft();
  const step = (typeof r.step === 'number' && r.step >= 1 && r.step <= 6 ? r.step : 1) as DraftStep;
  const profile = { ...base.profile };
  const preferences = { ...base.preferences };

  if (typeof r.profile === 'object' && r.profile !== null) {
    const p = r.profile as Record<string, unknown>;
    if (typeof p.province === 'string') profile.province = p.province;
    if (p.track === '物理' || p.track === '历史') profile.track = p.track;
    if (Array.isArray(p.electives)) {
      profile.electives = p.electives.filter(
        (e): e is Profile['electives'][number] =>
          e === '化学' || e === '生物' || e === '地理' || e === '政治',
      );
    }
    if (typeof p.totalScore === 'number' && p.totalScore >= 0 && p.totalScore <= 750) {
      profile.totalScore = p.totalScore;
    }
    if (typeof p.subScores === 'object' && p.subScores !== null) {
      const s = p.subScores as Record<string, unknown>;
      profile.subScores = {};
      for (const key of ['语文', '数学', '英语'] as const) {
        const v = s[key];
        if (typeof v === 'number' && v >= 0 && v <= 150) profile.subScores[key] = v;
      }
    }
    if (typeof p.systemRank === 'number') profile.systemRank = p.systemRank;
    if (typeof p.systemPercentile === 'number') profile.systemPercentile = p.systemPercentile;
    if (typeof p.rankOverride === 'number') profile.rankOverride = p.rankOverride;
    if (typeof p.rankOverrideConfirmed === 'boolean') {
      profile.rankOverrideConfirmed = p.rankOverrideConfirmed;
    }
    if (Array.isArray(p.specialIdentities)) {
      profile.specialIdentities = p.specialIdentities.filter((x): x is string => typeof x === 'string');
    }
  }

  if (typeof r.preferences === 'object' && r.preferences !== null) {
    const p = r.preferences as Record<string, unknown>;
    if (p.weightPreset === '保专业' || p.weightPreset === '保学校' || p.weightPreset === '保城市') {
      preferences.weightPreset = p.weightPreset;
    }
    if (p.tune === 0 || p.tune === 1 || p.tune === 2) preferences.tune = p.tune;
    if (Array.isArray(p.expectedRegions)) {
      preferences.expectedRegions = p.expectedRegions.filter((x): x is string => typeof x === 'string');
    }
    if (Array.isArray(p.excludedRegions)) {
      preferences.excludedRegions = p.excludedRegions.filter((x): x is string => typeof x === 'string');
    }
    if (Array.isArray(p.majorBlacklist)) {
      preferences.majorBlacklist = p.majorBlacklist.filter((x): x is string => typeof x === 'string');
    }
    if (
      p.schoolFloor === '不限' ||
      p.schoolFloor === '公办' ||
      p.schoolFloor === '双一流' ||
      p.schoolFloor === '211' ||
      p.schoolFloor === '985'
    ) {
      preferences.schoolFloor = p.schoolFloor;
    }
    if (p.ownership === '不限' || p.ownership === '公办' || p.ownership === '民办') {
      preferences.ownership = p.ownership;
    }
  }

  return { version: 1, step, profile, preferences, updatedAt: new Date().toISOString() };
}

/** 启动时恢复草稿（断点续填入口） */
export async function loadDraft(): Promise<Draft | null> {
  const raw = await adapter.load();
  return raw ? migrate(raw) : null;
}

/** 防抖保存：每步变更即时 dispatch，500ms 静默期后落库（避免高频输入打爆 localStorage） */
export function debounceSave(draft: Draft): void {
  if (saveTimer !== null) clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    saveTimer = null;
    void adapter.save(draft);
  }, DEBOUNCE_MS);
}

/** 清空草稿（RESET 动作时调用） */
export async function clearDraft(): Promise<void> {
  if (saveTimer !== null) {
    clearTimeout(saveTimer);
    saveTimer = null;
  }
  await adapter.clear();
}
