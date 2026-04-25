import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.jessocial.app',
  appName: 'JES Social',
  webDir: 'out',
  android: {
    buildOptions: {
      releaseType: 'AAB',
    },
  },
  server: {
    url: 'https://jessocial.com',
    cleartext: false,
  },
};

export default config;
