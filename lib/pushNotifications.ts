import { Capacitor } from '@capacitor/core';
import { supabase } from './supabase';

export async function initPushNotifications(userId: string) {
  if (!Capacitor.isNativePlatform()) return;

  try {
    const { PushNotifications } = await import('@capacitor/push-notifications');

    const permResult = await PushNotifications.requestPermissions();
    if (permResult.receive !== 'granted') return;

    await PushNotifications.register();

    PushNotifications.addListener('registration', async ({ value: token }) => {
      await supabase.from('users').update({ push_token: token }).eq('id', userId);
    });

    PushNotifications.addListener('registrationError', (err) => {
      console.error('Push registration error:', err);
    });

    PushNotifications.addListener('pushNotificationActionPerformed', (action) => {
      const data = action.notification.data;
      if (data?.url) {
        const url = data.url as string;
        // Navigate within the app using the relative path
        const path = url.startsWith('http') ? new URL(url).pathname : url;
        window.location.href = path;
      }
    });
  } catch (e) {
    console.error('Push init error:', e);
  }
}
