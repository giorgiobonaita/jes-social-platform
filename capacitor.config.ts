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
    androidScheme: 'https',
  },
};

export default config;
