/**
 * 省份服务（async 门面）：省份清单 / 经济圈标签（模拟后端 200–400ms 延迟）。
 * 数据来自 data/config/provinces.json（静态配置）。
 */
import provincesJson from '@/data/config/provinces.json';
import type { ProvinceConfig } from '@/types/profile';
import type { RegionTagMap } from '@/types/preference';
import { delay } from './delay';

/** JSON 推断类型 → 领域类型（双转避免 string/元组断言摩擦） */
const DATA = provincesJson as unknown as {
  provinces: ProvinceConfig[];
  regionTags: RegionTagMap;
};

/** 省份清单（页面异步获取） */
export async function getProvinces(): Promise<ProvinceConfig[]> {
  await delay(280);
  return DATA.provinces;
}

/** 同步查询省份配置（引擎/页面内部使用；查不到返回 undefined） */
export function getProvinceByCode(code?: string): ProvinceConfig | undefined {
  if (!code) return undefined;
  return DATA.provinces.find((p) => p.code === code);
}

/** 经济圈标签 → 成员城市映射（S4 白名单与引擎地域过滤共用） */
export function getRegionTags(): RegionTagMap {
  return DATA.regionTags;
}

/** 展开单个地域标签：'大湾区' → 成员城市数组；普通城市原样返回 */
export function expandRegionTag(region: string): string[] {
  return DATA.regionTags[region] ?? [region];
}
