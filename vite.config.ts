/// <reference types="vitest" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

/**
 * GitHub Pages 저장소 이름 ([저장소명])
 * 배포 주소: https://[계정].github.io/[저장소명]/
 * 실제 GitHub 저장소 이름과 다를 경우 아래 REPO_NAME 문자열을 저장소명으로 수정하세요.
 */
const REPO_NAME = 'My_Car_Manager';

export default defineConfig(({ mode }) => {
  const basePath = mode === 'production' ? `/${REPO_NAME}/` : '/';

  return {
    base: basePath,
    plugins: [
      react(),
      VitePWA({
        registerType: 'prompt',
        includeAssets: [
          'favicon.svg',
          'apple-touch-icon.png',
          'pwa-192x192.png',
          'pwa-512x512.png',
        ],
        manifest: {
          name: '내 차 관리 - 차량 정비·검사·보험',
          short_name: '내 차 관리',
          description:
            '오프라인 우선 차량 정비 내역, 자동차 검사일, 보험 만기 관리 웹앱',
          theme_color: '#1e293b',
          background_color: '#f8fafc',
          display: 'standalone',
          start_url: basePath,
          scope: basePath,
          lang: 'ko-KR',
          icons: [
            {
              src: 'pwa-192x192.png',
              sizes: '192x192',
              type: 'image/png',
            },
            {
              src: 'pwa-512x512.png',
              sizes: '512x512',
              type: 'image/png',
            },
            {
              src: 'pwa-512x512.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'any maskable',
            },
          ],
        },
        workbox: {
          globPatterns: ['**/*.{js,css,html,ico,png,svg,webmanifest}'],
        },
      }),
    ],
    test: {
      environment: 'jsdom',
      globals: true,
      setupFiles: ['./src/testSetup.ts'],
    },
  };
});
