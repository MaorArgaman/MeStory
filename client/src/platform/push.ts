import { PushNotifications } from '@capacitor/push-notifications';
import type { Token, PushNotificationSchema, ActionPerformed } from '@capacitor/push-notifications';
import { isNative, platform } from './index';
import api from '@/services/api';

let registered = false;

export interface PushHandlers {
  onForeground?: (notification: PushNotificationSchema) => void;
  onTap?: (action: ActionPerformed) => void;
}

export async function initPushNotifications(handlers: PushHandlers = {}): Promise<void> {
  if (!isNative || registered) return;

  try {
    let perm = await PushNotifications.checkPermissions();
    if (perm.receive === 'prompt' || perm.receive === 'prompt-with-rationale') {
      perm = await PushNotifications.requestPermissions();
    }
    if (perm.receive !== 'granted') return;

    await PushNotifications.register();

    await PushNotifications.addListener('registration', async (token: Token) => {
      try {
        await api.post('/notifications/register-device', {
          token: token.value,
          platform,
        });
      } catch (err) {
        console.warn('[push] register-device failed', err);
      }
    });

    await PushNotifications.addListener('registrationError', (err) => {
      console.warn('[push] registration error', err);
    });

    await PushNotifications.addListener('pushNotificationReceived', (n) => {
      handlers.onForeground?.(n);
    });

    await PushNotifications.addListener('pushNotificationActionPerformed', (a) => {
      handlers.onTap?.(a);
    });

    registered = true;
  } catch (err) {
    console.warn('[push] init failed', err);
  }
}

export async function unregisterPush(): Promise<void> {
  if (!isNative) return;
  try {
    await PushNotifications.removeAllListeners();
    registered = false;
  } catch {
    /* noop */
  }
}
