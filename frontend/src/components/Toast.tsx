/** 底部浮层提示（ToastProvider 持有状态，本组件只负责视觉） */
import styles from './Toast.module.css';

interface ToastProps {
  message: string | null;
}

export default function Toast({ message }: ToastProps) {
  if (!message) return null;
  return (
    <div className={`${styles.toast} toast-in`} role="status">
      {message}
    </div>
  );
}
