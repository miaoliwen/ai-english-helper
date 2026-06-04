import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.aienglish.helper',
  appName: 'AI英语解题助手',
  webDir: 'dist',
  server: {
    androidScheme: 'https'
  },
  plugins: {
    CapacitorCamera: {
      android: {
        // 允许用户从相机拍照或从相册选择
        saveToGallery: false
      }
    }
  }
};

export default config;
