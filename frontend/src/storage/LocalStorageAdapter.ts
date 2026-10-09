/**
 * localStorage 实现（V1 口径）。
 * 全部操作 try/catch 容错：隐私模式/存储被禁用时静默失败，绝不阻塞主流程。
 */
import type { Draft } from '@/types/draft';
import type { StorageAdapter } from './StorageAdapter';

/** 单一存储键，带版本号便于将来迁移 */
const STORAGE_KEY = 'zyb.draft.v1';

export class LocalStorageAdapter implements StorageAdapter {
  async load(): Promise<Draft | null> {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? (JSON.parse(raw) as Draft) : null;
    } catch {
      // JSON 损坏或 localStorage 不可读：按无草稿处理
      return null;
    }
  }

  async save(draft: Draft): Promise<void> {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(draft));
    } catch {
      // 隐私模式下 setItem 可能抛异常：静默失败（草稿仍在内存，本次会话可用）
    }
  }

  async clear(): Promise<void> {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // 同上，静默失败
    }
  }
}
