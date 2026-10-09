import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

/**
 * Vite 配置
 * - react 插件：JSX 转换 + Fast Refresh
 * - '@' 别名指向 src/（Vite 会把以 '/' 开头的别名解析到项目根，无需 node 依赖）
 * - 端口 3000：默认的 5173 落在本机 Windows 排除端口段（Hyper-V/WSL 保留 5153-5252），
 *   绑定必报 EACCES，故换到远离动态排除段聚集区（4200-9600）的 3000；
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
