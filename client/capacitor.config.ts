import type { CapacitorConfig } from '@capacitor/cli';

const isDev = process.env.CAP_ENV === 'dev';

const config: CapacitorConfig = {
  appId: 'com.mestory.app',
  appName: 'MeStory',
  webDir: 'dist',
  backgroundColor: '#111123',

  server: isDev
    ? {
        url: 'http://10.0.2.2:5173',
        cleartext: true,
      }
    : {
        androidScheme: 'https',
        iosScheme: 'https',
        hostname: 'app.mestory-ai.com',
        allowNavigation: [
          'mestory-ai.com',
          '*.mestory-ai.com',
          '*.vercel.app',
          '*.supabase.co',
          'accounts.google.com',
          '*.googleusercontent.com',
        ],
      },

  ios: {
    contentInset: 'always',
    limitsNavigationsToAppBoundDomains: false,
    preferredContentMode: 'mobile',
    scrollEnabled: true,
  },

  android: {
    allowMixedContent: false,
    captureInput: true,
    webContentsDebuggingEnabled: isDev,
  },

  plugins: {
    SplashScreen: {
      launchShowDuration: 1500,
      launchAutoHide: true,
      backgroundColor: '#111123',
      showSpinner: false,
      splashFullScreen: true,
      splashImmersive: true,
      androidSplashResourceName: 'splash',
    },
    StatusBar: {
      style: 'DARK',
      backgroundColor: '#111123',
      overlaysWebView: false,
    },
    Keyboard: {
      resize: 'native',
      resizeOnFullScreen: true,
    },
    PushNotifications: {
      presentationOptions: ['badge', 'sound', 'alert'],
    },
  },
};

export default config;
