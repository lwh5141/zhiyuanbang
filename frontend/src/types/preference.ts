/** 意向偏好领域类型（S3 权重预设 / S4 对话式意向细化） */

/** 权重三选一预设（PRD 8.2：首次引导必选其一；禁止裸滑杆） */
export type WeightPreset = '保专业' | '保学校' | '保城市';

/** 微调三档：0 标准 / 1 偏向 / 2 强偏向（档位而非连续滑杆） */
export type TuneLevel = 0 | 1 | 2;

/** 院校层次下限 */
export type SchoolFloor = '不限' | '公办' | '双一流' | '211' | '985';

/** 意向偏好（除黑名单外全部可跳过/「不设限」，PRD G3） */
export interface Preferences {
  /** S3 必选其一 */
  weightPreset?: WeightPreset;
  tune: TuneLevel;
  /** 期望地域（含经济圈标签，如「大湾区」，展开映射在 provinces.json.regionTags） */
  expectedRegions: string[];
  /** 排斥地域 */
  excludedRegions: string[];
  /** 专业黑名单（一级学科大类，绝对约束：任何情况下不自动释放，PRD 决策 #6） */
  majorBlacklist: string[];
  schoolFloor: SchoolFloor;
  /** 办学性质偏好 */
  ownership: '不限' | '公办' | '民办';
}

/** 经济圈标签 → 成员城市映射（provinces.json.regionTags 的结构） */
export type RegionTagMap = Record<string, string[]>;
