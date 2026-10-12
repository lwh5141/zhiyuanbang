/** 底部三 Tab（首页/方案/我的），沿用原型视觉 */
import { NavLink } from 'react-router-dom';
import { IcHome, IcMe, IcPlan } from '@/icons';
import styles from './TabBar.module.css';

const ITEMS = [
  { to: '/', label: '首页', Icon: IcHome },
  { to: '/plan', label: '方案', Icon: IcPlan },
  { to: '/me', label: '我的', Icon: IcMe },
] as const;

export default function TabBar() {
  return (
    <nav className={styles.bar}>
      {ITEMS.map(({ to, label, Icon }) => (
        <NavLink
          key={to}
          to={to}
          end={to === '/'}
          className={({ isActive }) => `${styles.item} tap ${isActive ? styles.active : ''}`}
        >
          {({ isActive }) => (
            <>
              <Icon color={isActive ? 'var(--c-sky)' : 'var(--c-icon-muted)'} active={isActive} />
              <span className={styles.label}>{label}</span>
            </>
          )}
        </NavLink>
      ))}
    </nav>
  );
}
