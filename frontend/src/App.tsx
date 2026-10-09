/**
 * App 根组件：HashRouter 路由装配 + AppProvider + ToastProvider。
 * 路由：/ → HomePage；/plan → PlanPage；/me → MePage；/wizard/:step → WizardLayout（1..5）；
 * 其余路径重定向首页。Tab 布局仅包裹三 Tab 页（向导无底栏）。
 */
import { HashRouter, Navigate, Outlet, Route, Routes } from 'react-router-dom';
import TabBar from '@/components/TabBar';
import { AppProvider } from '@/store/AppContext';
import { ToastProvider } from '@/store/useToast';
import HomePage from '@/pages/HomePage';
import MePage from '@/pages/MePage';
import PlanPage from '@/pages/PlanPage';
import WizardLayout from '@/pages/wizard/WizardLayout';
import styles from './App.module.css';

/** 三 Tab 页共用布局：内容 + 底部 TabBar */
function TabLayout() {
  return (
    <>
      <div className={styles.tabPage}>
        <Outlet />
      </div>
      <TabBar />
    </>
  );
}

export default function App() {
  return (
    <AppProvider>
      <ToastProvider>
        <HashRouter>
          <Routes>
            <Route element={<TabLayout />}>
              <Route path="/" element={<HomePage />} />
              <Route path="/plan" element={<PlanPage />} />
              <Route path="/me" element={<MePage />} />
            </Route>
            <Route path="/wizard/:step" element={<WizardLayout />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </HashRouter>
      </ToastProvider>
    </AppProvider>
  );
}
