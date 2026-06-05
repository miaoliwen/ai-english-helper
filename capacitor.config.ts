import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.aienglish.helper',
  appName: 'AI英语解题助手',
  webDir: 'dist',
  plugins: {
    CapacitorCamera: {}
  }
};

export default config;
