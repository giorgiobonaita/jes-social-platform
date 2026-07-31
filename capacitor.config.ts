import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.jes.social',
  appName: 'JES Social',
  webDir: 'out',
  server: {
    errorPath: 'index.html',
    androidScheme: 'https',
  },
  plugins: {
    PushNotifications: {
      presentationOptions: ['badge', 'sound', 'alert'],
    },
    GoogleAuth: {
      scopes: ['profile', 'email'],
      serverClientId: '150769005493-7g08be855vvjm4ackl08tobqji6r2ku3.apps.googleusercontent.com',
      iosClientId: '150769005493-1qd5qi8kclhgvmn1tnalqbu0hoct5t2h.apps.googleusercontent.com',
      forceCodeForRefreshToken: true,
    },
  },
};

export default config;
