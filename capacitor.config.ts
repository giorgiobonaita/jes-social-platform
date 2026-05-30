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
    GoogleAuth: {
      scopes: ['profile', 'email'],
      serverClientId: '150769005493-7g08be855vvjm4ackl08tobqji6r2ku3.apps.googleusercontent.com',
      forceCodeForRefreshToken: true,
    },
    PushNotifications: {
      presentationOptions: ['badge', 'sound', 'alert'],
    },
  },
};

export default config;
