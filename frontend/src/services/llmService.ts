/**
 * Mock 大模型服务（PRD 9.3 硬边界）：
 * - 只做自然语言意向解析，绝不参与任何数字计算（规则引擎硬算全部数字）；
 * - 关键词规则解析 + 1.2–2s 随机延迟 + 固定 JSON schema 输出；
 * - 输出必须过白名单校验（地域/专业枚举），数字类输出一律拒绝；
 * - 无命中返回 PARSE_FAILED，前端回退表单补填（REQ-006 不阻塞）。
 * 第⑩步替换为真实 DeepSeek/智谱/千问调用时，本 schema 不变。
 */
import candidatesJson from '@/data/mock/candidates.gd.json';
import type { LlmIntention, LlmParseRequest, LlmParseResponse, WeightPreset } from '@/types/llm';
import { getRegionTags } from './provinceService';
import { randomDelay } from './delay';

/** 模拟 LLM 思考延迟 1.2–2s（PRD：超时阈值 3s 由调用方控制） */
const LLM_DELAY: [number, number] = [1200, 2000];

/** 白名单：专业黑名单可选项（一级学科大类，与候选库 majorsInGroup 匹配口径一致） */
export const MAJOR_BLACKLIST_OPTIONS = [
  '临床医学类',
  '护理类',
  '药学类',
  '师范类',
  '法学类',
  '土木类',
  '化工与制药类',
  '生物类',
  '材料类',
] as const;

/** 黑名单关键词 → 白名单条目（US3：「别学医」→ 临床医学类/护理类） */
const BLACKLIST_RULES: [RegExp, string[]][] = [
  [/医学|学医|医院|从医/, ['临床医学类']],
  [/护理|护士/, ['护理类']],
  [/药学|制药|药剂/, ['药学类']],
  [/师范|当老师|当教师|教书|不想教书|怕当老师/, ['师范类']],
  [/法学|律师|司法/, ['法学类']],
  [/土木|工地|施工/, ['土木类']],
  [/化工|化学工程/, ['化工与制药类']],
  [/生物工程|生物技术|学生物/, ['生物类']],
  [/材料科学|材料工程|学材料/, ['材料类']],
];

/** 权重预设关键词（PRD 8.2 三选一） */
const PRESET_RULES: [RegExp, WeightPreset][] = [
  [/保专业|专业优先|专业为主|看重专业/, '保专业'],
  [/保学校|学校优先|名校|看重学校|看学校/, '保学校'],
  [/保城市|城市优先|大城市|去大城市|看重城市/, '保城市'],
];

/** 全部候选城市（演示数据的城市并集，地域白名单来源之一） */
const ALL_CITIES: string[] = (() => {
  const raw = candidatesJson as unknown as { candidates: { city: string }[] };
  return [...new Set(raw.candidates.map((c) => c.city))];
})();

/** 地域白名单 = 经济圈标签 + 候选城市 + 「广东」 */
function regionWhitelist(): string[] {
  const tags = Object.keys(getRegionTags());
  return [...new Set([...tags, ...ALL_CITIES, '广东'])];
}

/** 从单句中提取地域 token（区分期望/排斥：句中含否定词则计入排斥） */
function extractRegions(text: string, whitelist: string[]): { expected: string[]; excluded: string[] } {
  const expected = new Set<string>();
  const excluded = new Set<string>();
  const clauses = text.split(/[，,。;；！!？?\s]+/).filter(Boolean);
  const NEGATION = /(不想去|别去|不去|不要去|排除|避开|远离|离开)/;
  for (const clause of clauses) {
    const negated = NEGATION.test(clause);
    for (const region of whitelist) {
      if (clause.includes(region)) {
        (negated ? excluded : expected).add(region);
      }
    }
  }
  return { expected: [...expected], excluded: [...excluded] };
}

/** 白名单校验 + 数字防线（PRD 9.3：数字类输出一律拒绝；本规则引擎只会产出白名单内的值） */
function validate(raw: LlmIntention, whitelist: string[]): LlmIntention | null {
  const rejectIfNumeric = (values: string[]) => values.some((v) => /\d/.test(v));
  if (rejectIfNumeric(raw.expectedRegions) || rejectIfNumeric(raw.excludedRegions) || rejectIfNumeric(raw.majorBlacklist)) {
    return null;
  }
  const wl = new Set(whitelist);
  const majorWl = new Set<string>(MAJOR_BLACKLIST_OPTIONS);
  const intention: LlmIntention = {
    expectedRegions: raw.expectedRegions.filter((r) => wl.has(r)),
    excludedRegions: raw.excludedRegions.filter((r) => wl.has(r)),
    majorBlacklist: raw.majorBlacklist.filter((m) => majorWl.has(m)),
  };
  if (raw.weightPreset) intention.weightPreset = raw.weightPreset;
  return intention;
}

/** 意向解析主入口 */
export async function parseIntention(req: LlmParseRequest): Promise<LlmParseResponse> {
  await randomDelay(...LLM_DELAY);

  const text = req.text.trim();
  if (!text) return { code: 'PARSE_FAILED', message: '未输入任何内容' };

  const whitelist = regionWhitelist();

  // ① 地域（含经济圈标签，支持否定句计入排斥地域）
  const { expected, excluded } = extractRegions(text, whitelist);

  // ② 专业黑名单
  const blacklist = new Set<string>();
  for (const [pattern, entries] of BLACKLIST_RULES) {
    if (pattern.test(text)) entries.forEach((e) => blacklist.add(e));
  }

  // ③ 权重预设
  let weightPreset: WeightPreset | undefined;
  for (const [pattern, preset] of PRESET_RULES) {
    if (pattern.test(text)) {
      weightPreset = preset;
      break;
    }
  }

  // 无任何命中 → 回退表单（REQ-006）
  if (expected.length === 0 && excluded.length === 0 && blacklist.size === 0 && !weightPreset) {
    return { code: 'PARSE_FAILED', message: '未能从这段话中识别出明确的地域/专业/权重意向' };
  }

  const validated = validate(
    {
      expectedRegions: expected,
      excludedRegions: excluded,
      majorBlacklist: [...blacklist],
      weightPreset,
    },
    whitelist,
  );
  if (!validated) {
    return { code: 'PARSE_FAILED', message: '解析结果未通过白名单校验（数字类输出一律拒绝）' };
  }

  return { code: 'OK', data: validated };
}
