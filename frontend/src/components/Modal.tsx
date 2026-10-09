/** 通用弹窗：标题/正文/确认取消；二次确认与「我已核对过一分一段表」声明勾选复用 */
import type { ReactNode } from 'react';
import styles from './Modal.module.css';

interface ModalProps {
  open: boolean;
  title: string;
  children?: ReactNode;
  confirmText?: string;
  cancelText?: string;
  onConfirm?: () => void;
  onCancel?: () => void;
  /** 额外声明勾选（如偏差 >500 名时「我已核对过一分一段表」） */
  checkbox?: {
    label: string;
    checked: boolean;
    onChange: (checked: boolean) => void;
  };
  /** 确认按钮在勾选未满足时置灰 */
  confirmDisabled?: boolean;
}

export default function Modal({
  open,
  title,
  children,
  confirmText = '确认',
  cancelText = '取消',
  onConfirm,
  onCancel,
  checkbox,
  confirmDisabled = false,
}: ModalProps) {
  if (!open) return null;
  return (
    <div className={styles.overlay} onClick={onCancel} role="presentation">
      <div
        className={`${styles.card} screen-in`}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label={title}
      >
        <div className={styles.title}>{title}</div>
        {children && <div className={styles.body}>{children}</div>}
        {checkbox && (
          <label className={styles.checkboxRow}>
            <input
              type="checkbox"
              checked={checkbox.checked}
              onChange={(e) => checkbox.onChange(e.target.checked)}
              className={styles.checkbox}
            />
            <span>{checkbox.label}</span>
          </label>
        )}
        <div className={styles.actions}>
          <button type="button" className={`${styles.btn} ${styles.cancel} tap`} onClick={onCancel}>
            {cancelText}
          </button>
          <button
            type="button"
            className={`${styles.btn} ${styles.confirm} ${confirmDisabled ? styles.confirmDisabled : ''}`}
            onClick={confirmDisabled ? undefined : onConfirm}
            disabled={confirmDisabled}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
