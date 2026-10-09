/**
 * S4 对话式意向细化（US3 / REQ-006）：
 * 自然语言输入 → mock LLM 解析（1.2–2s）→ 结构化确认卡；
 * 解析失败 → 回退表单补填（不阻塞）；全部可跳过（「不设限」）。
 */
import { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { IcSend } from '@/icons';
import {
  MAJOR_BLACKLIST_OPTIONS,
  parseIntention,
} from '@/services/llmService';
import { getRegionTags } from '@/services/provinceService';
import { useApp } from '@/store/AppContext';
import { useToast } from '@/store/useToast';
import type { LlmIntention } from '@/types/llm';
import styles from './wizard.module.css';
import chat from './Step4Chat.module.css';

/** 地域候选：经济圈标签 + 「广东」（白名单口径与 llmService 一致） */
const REGION_OPTIONS = [...Object.keys(getRegionTags()), '广东'];

interface ChatMessage {
  id: number;
  role: 'user' | 'ai';
  kind: 'text' | 'confirm' | 'fallback';
  text?: string;
  data?: LlmIntention;
  /** 回退表单中的草拟意向 */
  draftIntention?: LlmIntention;
}



export default function Step4Chat() {
  const navigate = useNavigate();
  const { draft, dispatch } = useApp();
  const { show } = useToast();
  const { preferences } = draft;

  const nextIdRef = useRef(1);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: nextIdRef.current++,
      role: 'ai',
      kind: 'text',
      text: '用一句话说说你的想法吧，比如「别学医、打死不学师范，最好留在大湾区」。我可以帮你翻译成结构化条件。',
    },
  ]);
  const [input, setInput] = useState('');
  const [thinking, setThinking] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);

  const push = (msg: Omit<ChatMessage, 'id'>) => {
    setMessages((prev) => [...prev, { ...msg, id: nextIdRef.current++ }]);
    // 等渲染后滚到底部
    setTimeout(() => listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: 'smooth' }), 30);
  };

  const send = async () => {
    const text = input.trim();
    if (!text || thinking) return;
    setInput('');
    push({ role: 'user', kind: 'text', text });
    setThinking(true);
    try {
      const res = await parseIntention({ text, province: draft.profile.province, preset: preferences.weightPreset });
      if (res.code === 'OK' && res.data) {
        push({ role: 'ai', kind: 'confirm', text: '我把你的意思翻译成了下面这些条件，请确认：', data: res.data });
      } else {
        push({
          role: 'ai',
          kind: 'fallback',
          text: `${res.message ?? '没能解析出明确意向'}。没关系，用下面的表单直接补填即可（不阻塞）：`,
        });
      }
    } finally {
      setThinking(false);
    }
  };

  const applyIntention = (data: LlmIntention) => {
    dispatch({
      type: 'UPDATE_PREFS',
      patch: {
        expectedRegions: data.expectedRegions,
        excludedRegions: data.excludedRegions,
        majorBlacklist: data.majorBlacklist,
        ...(data.weightPreset ? { weightPreset: data.weightPreset } : {}),
      },
    });
    show('意向已保存 · 草稿已自动保存');
  };

  return (
    <div className={`${styles.body} screen-in`}>
      <div className={styles.sectionTitle}>聊聊你的意向（可跳过）</div>
      <div className={styles.sectionSub}>期望/排斥地域、专业黑名单；说不出也没关系，全部可不设限</div>

      {/* 对话区 */}
      <div className={chat.chatBox} ref={listRef}>
        {messages.map((msg) => (
          <div key={msg.id} className={msg.role === 'user' ? chat.rowUser : chat.rowAi}>
            <div className={msg.role === 'user' ? chat.bubbleUser : chat.bubbleAi}>
              {msg.text}
              {msg.kind === 'confirm' && msg.data && (
                <div className={chat.confirmCard}>
                  <ConfirmRow label="期望地域" values={msg.data.expectedRegions} empty="不设限" />
                  <ConfirmRow label="排斥地域" values={msg.data.excludedRegions} empty="不设限" />
                  <ConfirmRow label="专业黑名单" values={msg.data.majorBlacklist} empty="不设限" />
                  <ConfirmRow label="权重预设" values={msg.data.weightPreset ? [msg.data.weightPreset] : []} empty="维持现状" />
                  <button
                    type="button"
                    className={`${styles.primary} tap`}
                    style={{ marginTop: 12 }}
                    onClick={() => applyIntention(msg.data as LlmIntention)}
                  >
                    确认，按这个来
                  </button>
                </div>
              )}
              {msg.kind === 'fallback' && (
                <FallbackForm
                  onApply={(data) => {
                    applyIntention(data);
                    push({ role: 'ai', kind: 'text', text: '已保存你的意向，可继续补充或直接下一步。' });
                  }}
                />
              )}
            </div>
          </div>
        ))}
        {thinking && <div className={chat.thinking}>正在解析你的意向…（模拟大模型 1.2–2s）</div>}
      </div>

      {/* 输入区 */}
      <div className={chat.inputRow}>
        <input
          className={chat.input}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') void send();
          }}
          placeholder="例如：别学医，最好离家近"
          aria-label="意向输入"
        />
        <button type="button" className={`${chat.sendBtn} tap`} onClick={() => void send()} disabled={thinking} aria-label="发送">
          <IcSend />
        </button>
      </div>

      <div className={chat.summary}>
        当前意向：期望 {preferences.expectedRegions.join('、') || '不设限'} · 排斥{' '}
        {preferences.excludedRegions.join('、') || '不设限'} · 黑名单{' '}
        {preferences.majorBlacklist.join('、') || '不设限'}
      </div>

      <button type="button" className={`${styles.primary} tap`} onClick={() => navigate('/wizard/5')}>
        下一步
      </button>
      <button
        type="button"
        className={`${styles.linkBtn} tap`}
        onClick={() => {
          dispatch({
            type: 'UPDATE_PREFS',
            patch: { expectedRegions: [], excludedRegions: [], majorBlacklist: [] },
          });
          show('已按「不设限」处理，可随时回来补充');
          navigate('/wizard/5');
        }}
      >
        跳过，全部不设限
      </button>
    </div>
  );
}

/** 结构化确认卡的一行 */
function ConfirmRow({ label, values, empty }: { label: string; values: string[]; empty: string }) {
  return (
    <div className={chat.confirmRow}>
      <span className={chat.confirmLabel}>{label}</span>
      <span className={chat.confirmValue}>{values.length > 0 ? values.join('、') : empty}</span>
    </div>
  );
}

/** 解析失败回退表单（REQ-006 不阻塞） */
function FallbackForm({ onApply }: { onApply: (data: LlmIntention) => void }) {
  const [expected, setExpected] = useState<string[]>([]);
  const [excluded, setExcluded] = useState<string[]>([]);
  const [blacklist, setBlacklist] = useState<string[]>([]);

  const toggle = (list: string[], setList: (v: string[]) => void, value: string) => {
    setList(list.includes(value) ? list.filter((v) => v !== value) : [...list, value]);
  };

  const ChipGroup = ({
    options,
    selected,
    onToggle,
  }: {
    options: readonly string[];
    selected: string[];
    onToggle: (value: string) => void;
  }) => (
    <div className={chat.chipRow}>
      {options.map((opt) => (
        <button
          key={opt}
          type="button"
          className={`${chat.chip} tap ${selected.includes(opt) ? chat.chipOn : ''}`}
          onClick={() => onToggle(opt)}
        >
          {opt}
        </button>
      ))}
    </div>
  );

  return (
    <div className={chat.fallback}>
      <div className={chat.fallbackLabel}>期望地域（可多选 / 不选=不设限）</div>
      <ChipGroup options={REGION_OPTIONS} selected={expected} onToggle={(v) => toggle(expected, setExpected, v)} />
      <div className={chat.fallbackLabel}>排斥地域（可多选）</div>
      <ChipGroup options={REGION_OPTIONS} selected={excluded} onToggle={(v) => toggle(excluded, setExcluded, v)} />
      <div className={chat.fallbackLabel}>专业黑名单（按大类整体拉黑）</div>
      <ChipGroup
        options={MAJOR_BLACKLIST_OPTIONS}
        selected={blacklist}
        onToggle={(v) => toggle(blacklist, setBlacklist, v)}
      />
      <button
        type="button"
        className={`${styles.primary} tap`}
        style={{ marginTop: 12 }}
        onClick={() => onApply({ expectedRegions: expected, excludedRegions: excluded, majorBlacklist: blacklist })}
      >
        保存这些条件
      </button>
    </div>
  );
}


