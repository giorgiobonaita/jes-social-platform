import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import { supabase } from './supabase';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export async function registerPushToken(userId: string) {
  if (!Device.isDevice) return;

  const { status: existing } = await Notifications.getPermissionsAsync();
  let finalStatus = existing;

  if (existing !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') return;

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'JES',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#F07B1D',
    });
  }

  const token = (await Notifications.getExpoPushTokenAsync()).data;

  // Salva token su Supabase
  await supabase.from('push_tokens').upsert(
    { user_id: userId, token, platform: Platform.OS },
    { onConflict: 'user_id' }
  );

  return token;
}

export async function sendPushNotification(
  toUserId: string,
  title: string,
  body: string,
  data?: Record<string, any>
) {
  const { data: row } = await supabase
    .from('push_tokens')
    .select('token')
    .eq('user_id', toUserId)
    .maybeSingle();

  if (!row?.token) return;

  await fetch('https://exp.host/--/api/v2/push/send', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      to: row.token,
      title,
      body,
      data: data || {},
      sound: 'default',
      priority: 'high',
    }),
  });
}
