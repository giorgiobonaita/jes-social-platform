import { Capacitor } from '@capacitor/core';
import { supabase } from './supabase';

export async function initPushNotifications() {
  if (!Capacitor.isNativePlatform()) return;

  try {
    const { PushNotifications } = await import('@capacitor/push-notifications');

    if (Capacitor.getPlatform() === 'android') {
      await PushNotifications.createChannel({
        id: 'jes_default',
        name: 'Notifiche JES',
        description: 'Like, commenti, follower e messaggi',
        importance: 5,
        sound: 'default',
        vibration: true,
        visibility: 1,
      });
    }

    await PushNotifications.removeAllListeners();

    PushNotifications.addListener('registration', async ({ value: token }) => {
      if (!token) return;
      // Usa auth_id dalla sessione — più robusto di passare userId come parametro
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user?.id) return;
      await supabase
        .from('users')
        .update({ push_token: token })
        .eq('auth_id', session.user.id);
    });

    PushNotifications.addListener('registrationError', (err) => {
      console.error('Push registration error:', err);
    });

    PushNotifications.addListener('pushNotificationActionPerformed', (action) => {
      const data = action.notification.data;
      if (!data?.url) return;
      const url = data.url as string;
      const path = url.startsWith('http') ? new URL(url).pathname : url;
      // Store path for home page to pick up, then navigate there
      try { localStorage.setItem('jes_push_nav', path); } catch {}
      window.location.href = '/home';
    });

    const permResult = await PushNotifications.requestPermissions();
    if (permResult.receive !== 'granted') return;

    await PushNotifications.register();

  } catch (e) {
    console.error('Push init error:', e);
  }
}
