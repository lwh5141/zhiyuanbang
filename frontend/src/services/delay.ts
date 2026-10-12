/**
 * 服务层通用延迟工具（随机延迟只允许出现在 services/，engine 保持纯函数）。
 * 将来第⑩步接入真实后端时，把各 service 内部替换为 fetch，本文件可删除。
 */

/** 固定延迟 */
export function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** 随机延迟 [minMs, maxMs]（模拟真实网络抖动） */
export function randomDelay(minMs: number, maxMs: number): Promise<void> {
  const ms = Math.floor(minMs + Math.random() * (maxMs - minMs));
  return delay(ms);
}
