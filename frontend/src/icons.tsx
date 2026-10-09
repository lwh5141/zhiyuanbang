/**
 * 全部内联 SVG 图标（沿用原型极简几何写法，不引入图标库）。
 * active 用于 TabBar 选中态填充（原型：color === C.sky 时加 16% 底色填充）。
 */
interface IconProps {
  /** 描边/填充色（支持 CSS 变量字符串） */
  color?: string;
  size?: number;
  /** 选中态：图标内部加淡色填充 */
  active?: boolean;
}

export function IcHome({ color = 'var(--c-ink)', size = 22, active = false }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M4 11.2 12 4.5l8 6.7V19a1.4 1.4 0 0 1-1.4 1.4h-4v-5h-5.2v5h-4A1.4 1.4 0 0 1 4 19v-7.8z"
        stroke={color}
        strokeWidth="1.8"
        strokeLinejoin="round"
        fill={active ? 'var(--c-sky-fill)' : 'none'}
      />
    </svg>
  );
}

export function IcPlan({ color = 'var(--c-ink)', size = 22, active = false }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect
        x="5"
        y="3.5"
        width="14"
        height="17"
        rx="2.4"
        stroke={color}
        strokeWidth="1.8"
        fill={active ? 'var(--c-sky-fill)' : 'none'}
      />
      <path
        d="M8.5 9h7M8.5 12.5h7M8.5 16h4.5"
        stroke={color}
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function IcMe({ color = 'var(--c-ink)', size = 22, active = false }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle
        cx="12"
        cy="8.2"
        r="3.7"
        stroke={color}
        strokeWidth="1.8"
        fill={active ? 'var(--c-sky-fill)' : 'none'}
      />
      <path
        d="M4.8 20c1.1-3.4 3.9-5.1 7.2-5.1s6.1 1.7 7.2 5.1"
        stroke={color}
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function IcChevron({ color = '#9FB6C9', size = 18 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="m9 5.5 6.5 6.5L9 18.5"
        stroke={color}
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function IcBack({ color = 'var(--c-ink)', size = 20 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M15 5.5 8.5 12 15 18.5"
        stroke={color}
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function IcCheck({ color = 'var(--c-sky)', size = 16 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="10" fill={color} />
      <path
        d="m8 12.2 2.6 2.6 5.2-5.6"
        stroke="#fff"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function IcInfo({ color = 'var(--c-sub)', size = 14 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="9" stroke={color} strokeWidth="1.8" />
      <path d="M12 8.2v.2M12 11.5v5" stroke={color} strokeWidth="1.9" strokeLinecap="round" />
    </svg>
  );
}

export function IcPin({ color = 'var(--c-sub)', size = 13 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M12 21s7-6.1 7-11a7 7 0 1 0-14 0c0 4.9 7 11 7 11z" stroke={color} strokeWidth="1.8" />
      <circle cx="12" cy="10" r="2.4" stroke={color} strokeWidth="1.8" />
    </svg>
  );
}

export function IcPlay({ color = '#fff', size = 17 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M7 5.5v13M7 5.5 16.5 12 7 18.5v-13z" fill={color} />
    </svg>
  );
}

export function IcSend({ color = 'var(--c-sky)', size = 18 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M3.5 20.5 21 12 3.5 3.5l3 7 8.5 1.5-8.5 1.5-3 7z" stroke={color} strokeWidth="1.8" strokeLinejoin="round" fill="none" />
    </svg>
  );
}
