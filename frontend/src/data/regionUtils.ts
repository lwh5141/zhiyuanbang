/**
 * 经济圈标签展开工具（data 层共享模块）。
 * engine 和 services 层共用此函数，避免重复实现。
 */
import provincesJson from '@/data/config/provinces.json';
import type { RegionTagMap } from '@/types/preference';

const REGION_TAGS = (provincesJson as { regionTags: RegionTagMap }).regionTags;

/** 经济圈标签展开：'大湾区' → 成员城市；其余原样返回 */
export function expandRegion(region: string): string[] {
  return REGION_TAGS[region] ?? [region];
}
