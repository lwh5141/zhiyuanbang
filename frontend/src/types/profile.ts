/** 考生档案领域类型（S1 定位 / S2 分数采集的领域模型，与将来 FastAPI Pydantic 模型一一对应） */

/** 首选科目（3+1+2 中的 "1"） */
export type SubjectCode = '物理' | '历史';

/** 再选科目（3+1+2 中的 "2"，必须恰好 2 门才合法） */
export type ElectiveSubject = '化学' | '生物' | '地理' | '政治';

/** 省份配置（来自 data/config/provinces.json，配置驱动，禁止硬编码省份口径） */
export interface ProvinceConfig {
  /** 省份代码，如 'GD' */
  code: string;
  /** 省份名，如 '广东' */
  name: string;
  /** false → 灰态「即将开放」 */
  online: boolean;
  /** 选科模式 */
  mode: '3+1+2' | '3+3' | '文理';
  /** 投档模式 */
  batchMode: '院校专业组' | '专业+院校' | '院校';
  /** 平行志愿数量上限（广东 45） */
  volunteerLimit: number;
  /** 基准配比 [冲, 稳, 保, 垫]，广东基准 2:3:3:2 */
  baseRatio: [number, number, number, number];
}

/** 单科成绩（留空项引擎忽略） */
export interface SubScores {
  语文?: number;
  数学?: number;
  英语?: number;
}

/** 考生档案（全局 Draft 的核心组成） */
export interface Profile {
  /** ProvinceConfig.code */
  province?: string;
  track?: SubjectCode;
  /** 再选科目，恰好 2 门才合法（isValidSubjectCombo） */
  electives: ElectiveSubject[];
  /** 0–750，<100 需二次确认 */
  totalScore?: number;
  subScores: SubScores;
  /** 系统反查位次（只读，由 rankService 反查写入） */
  systemRank?: number;
  /** 超过全省百分比 */
  systemPercentile?: number;
  /** 手动覆盖位次（覆盖流程见 REQ-002） */
  rankOverride?: number;
  /** 偏差 >500 时的「我已核对过一分一段表」声明勾选 */
  rankOverrideConfirmed?: boolean;
  /** specialIdentities.json 的 id 列表 */
  specialIdentities: string[];
}

/** 选科组合合法性（前端即时校验第①层；3+1+2 省再选恰好 2 门） */
export const isValidSubjectCombo = (
  config: ProvinceConfig,
  track: SubjectCode,
  electives: ElectiveSubject[],
): boolean => (config.mode === '3+1+2' ? electives.length === 2 : true);

/** 一分一段原始行（JSON 中为三元组 [分数, 位次, 超过考生百分比]） */
export type RankRowTuple = [number, number, number];

/** 一分一段结构化行 */
export interface RankRow {
  score: number;
  rank: number;
  percentile: number;
}

/** 位次反查结果（REQ-002：附原文引用 source） */
export interface RankResult {
  rank: number;
  percentile: number;
  /** 数据来源原文引用，如「2025 年广东省物理类一分一段表 · 598 分对应累计 24,156 位（演示数据）」 */
  source: string;
  /** true = 由相邻两分行线性插值得出 */
  interpolated: boolean;
}
