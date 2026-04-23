import { App } from '@capacitor/app';
import { StatusBar, Style } from '@capacitor/status-bar';
import { SplashScreen } from '@capacitor/splash-screen';
import { Keyboard } from '@capacitor/keyboard';
import { isNative, isAndroid } from './index';
import { hydrateStorageFromNative } from './storage';

const HYDRATE_KEYS = ['token', 'user', 'language', 'currency', 'theme'];

let initialized = false;

export async function initNative(navigate: (path: string) => void): Promise<void> {
  if (!isNative || initialized) return;
  initialized = true;

  await hydrateStorageFromNative(HYDRATE_KEYS);

  try {
    await StatusBar.setStyle({ style: Style.Dark });
    await StatusBar.setBackgroundColor({ color: '#111123' });
  } catch {
    /* iOS without hideable status bar can throw */
  }

  try {
    await SplashScreen.hide({ fadeOutDuration: 250 });
  } catch {
    /* noop */
  }

  try {
    const parseUrl = (rawUrl: string) => {
      try {
        const u = new URL(rawUrl);
        const schemeHost = `${u.protocol}//${u.host}`;
        if (rawUrl.startsWith('mestory://')) {
          return rawUrl.replace('mestory://', '/');
        }
        if (
          u.hostname === 'app.mestory-ai.com' ||
          u.hostname === 'mestory-ai.com' ||
          u.hostname.endsWith('.mestory-ai.com')
        ) {
          return u.pathname + u.search + u.hash;
        }
        void schemeHost;
      } catch {
        /* noop */
      }
      return null;
    };

    await App.addListener('appUrlOpen', (event) => {
      const path = parseUrl(event.url);
      if (path) navigate(path);
    });
  } catch {
    /* noop */
  }

  if (isAndroid) {
    try {
      await App.addListener('backButton', ({ canGoBack }) => {
        if (canGoBack) {
          window.history.back();
        } else {
          void App.exitApp();
        }
      });
    } catch {
      /* noop */
    }
  }

  try {
    await Keyboard.addListener('keyboardWillShow', (info) => {
      document.documentElement.style.setProperty(
        '--keyboard-height',
        `${info.keyboardHeight}px`,
      );
      document.body.classList.add('keyboard-open');
    });
    await Keyboard.addListener('keyboardWillHide', () => {
      document.documentElement.style.setProperty('--keyboard-height', '0px');
      document.body.classList.remove('keyboard-open');
    });
  } catch {
    /* noop */
  }

  document.documentElement.classList.add('is-native', `is-${isAndroid ? 'android' : 'ios'}`);
}
