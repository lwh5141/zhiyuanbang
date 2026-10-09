/**
 * Mock LLM 请求/响应 schema（PRD 9.3：字段不再变，将来直连 FastAPI 完全一致）。
 * 防线：输出必须过 schema 校验 + 枚举白名单；数字类输出一律拒绝；失败回退表单不阻塞。
 */
import type { WeightPreset } from './preference';

export interface LlmParseRequest {
  /** 用户自然语言意向原文 */
  text: string;
  /** 当前省份（供后端语境参考） */
  province?: string;
  /** 当前已选权重预设 */
  preset?: WeightPreset;
}

/** 结构化意向（解析成功时嵌入 data） */
export interface LlmIntention {
  expectedRegions: string[];
  excludedRegions: string[];
  majorBlacklist: string[];
  weightPreset?: WeightPreset;
}

export interface LlmParseResponse {
  code: 'OK' | 'PARSE_FAILED' | 'TIMEOUT';
  /** code === 'OK' 时必有；前端使用前仍需过白名单二次校验 */
  data?: LlmIntention;
  message?: string;
}
