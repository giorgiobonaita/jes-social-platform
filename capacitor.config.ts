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
    errorPath: '/index.html',
    androidScheme: 'https',
  },
  plugins: {
    PushNotifications: {
      presentationOptions: ['badge', 'sound', 'alert'],
    },
  },
};

export default config;
