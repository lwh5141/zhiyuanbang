import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

/**
 * Vite 配置
 * - react 插件：JSX 转换 + Fast Refresh
 * - '@' 别名指向 src/（Vite 会把以 '/' 开头的别名解析到项目根，无需 node 依赖）
 * - 端口 3000：默认的 5173 在部分 Windows 机器上会落入系统保留端口段（Hyper-V/WSL 动态排除），
 *   绑定会报 EACCES，故固定改用 3000；
 *   若 3000 偶被占用，Vite 默认自动顺延到 3001（strictPort 未开启）
 * - host 用 localhost：单机开发无需局域网暴露，也避免 Windows 防火墙首次弹窗；
 *   如需手机真机预览，把 host 改回 true 后重启即可（首次会弹防火墙授权框，点"允许"）
 */
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': '/src',
    },
  },
  server: {
    port: 3000,
    host: 'localhost',
  },
});
