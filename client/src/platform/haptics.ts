import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics';
import { isNative } from './index';

export async function hapticLight(): Promise<void> {
  if (!isNative) return;
  try {
    await Haptics.impact({ style: ImpactStyle.Light });
  } catch {
    /* noop */
  }
}

export async function hapticMedium(): Promise<void> {
  if (!isNative) return;
  try {
    await Haptics.impact({ style: ImpactStyle.Medium });
  } catch {
    /* noop */
  }
}

export async function hapticHeavy(): Promise<void> {
  if (!isNative) return;
  try {
    await Haptics.impact({ style: ImpactStyle.Heavy });
  } catch {
    /* noop */
  }
}

export async function hapticSuccess(): Promise<void> {
  if (!isNative) return;
  try {
    await Haptics.notification({ type: NotificationType.Success });
  } catch {
    /* noop */
  }
}

export async function hapticWarning(): Promise<void> {
  if (!isNative) return;
  try {
    await Haptics.notification({ type: NotificationType.Warning });
  } catch {
    /* noop */
  }
}

export async function hapticError(): Promise<void> {
  if (!isNative) return;
  try {
    await Haptics.notification({ type: NotificationType.Error });
  } catch {
    /* noop */
  }
}
