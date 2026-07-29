import { Capacitor } from '@capacitor/core';
import { supabase } from './supabase';

export async function initPushNotifications(userId: string) {
  if (!Capacitor.isNativePlatform()) return;

  try {
    const { PushNotifications } = await import('@capacitor/push-notifications');

    // Android 8+ richiede un canale notifiche esplicito
    if (Capacitor.getPlatform() === 'android') {
      await PushNotifications.createChannel({
        id: 'jes_default',
        name: 'Notifiche JES',
        description: 'Like, commenti, follower e messaggi',
        importance: 5,        // IMPORTANCE_HIGH
        sound: 'default',
        vibration: true,
        visibility: 1,        // VISIBILITY_PUBLIC
      });
    }

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
        const path = url.startsWith('http') ? new URL(url).pathname : url;
        window.location.href = path;
      }
    });
  } catch (e) {
    console.error('Push init error:', e);
  }
}
