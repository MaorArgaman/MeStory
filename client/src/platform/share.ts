import { Share } from '@capacitor/share';
import { isNative } from './index';

export interface ShareOptions {
  title?: string;
  text?: string;
  url?: string;
  dialogTitle?: string;
}

export async function shareContent(options: ShareOptions): Promise<boolean> {
  try {
    if (isNative) {
      await Share.share({
        title: options.title,
        text: options.text,
        url: options.url,
        dialogTitle: options.dialogTitle ?? options.title,
      });
      return true;
    }

    if (typeof navigator !== 'undefined' && 'share' in navigator) {
      await (navigator as Navigator & {
        share: (data: ShareOptions) => Promise<void>;
      }).share({
        title: options.title,
        text: options.text,
        url: options.url,
      });
      return true;
    }

    if (options.url) {
      await navigator.clipboard.writeText(options.url);
      return true;
    }
  } catch (err) {
    if ((err as Error)?.name === 'AbortError') return false;
    console.warn('[share] failed', err);
  }
  return false;
}
