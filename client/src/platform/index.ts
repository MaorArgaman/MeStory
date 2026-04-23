import { Capacitor } from '@capacitor/core';

export const isNative = Capacitor.isNativePlatform();
export const platform = Capacitor.getPlatform() as 'ios' | 'android' | 'web';
export const isIOS = platform === 'ios';
export const isAndroid = platform === 'android';

export * from './storage';
export * from './share';
export * from './files';
export * from './haptics';
export * from './network';
export * from './push';
export * from './nativeInit';
