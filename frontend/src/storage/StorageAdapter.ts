/**
 * 存储抽象接口（REQ-003）。
 * 本期实现：LocalStorageAdapter；将来换云端只需新增 CloudStorageAdapter 实现同一接口，业务代码零改动。
 */
import type { Draft } from '@/types/draft';

export interface StorageAdapter {
  load(): Promise<Draft | null>;
  save(draft: Draft): Promise<void>;
  clear(): Promise<void>;
}
