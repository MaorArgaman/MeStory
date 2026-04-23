import { Network } from '@capacitor/network';
import { isNative } from './index';

export interface NetStatus {
  connected: boolean;
  connectionType: string;
}

export async function getNetworkStatus(): Promise<NetStatus> {
  if (isNative) {
    const s = await Network.getStatus();
    return { connected: s.connected, connectionType: s.connectionType };
  }
  return {
    connected: typeof navigator !== 'undefined' ? navigator.onLine : true,
    connectionType: 'unknown',
  };
}

export function onNetworkChange(cb: (s: NetStatus) => void): () => void {
  if (isNative) {
    const handle = Network.addListener('networkStatusChange', (s) => {
      cb({ connected: s.connected, connectionType: s.connectionType });
    });
    return () => {
      void handle.then((h) => h.remove());
    };
  }

  const onOnline = () => cb({ connected: true, connectionType: 'unknown' });
  const onOffline = () => cb({ connected: false, connectionType: 'none' });
  window.addEventListener('online', onOnline);
  window.addEventListener('offline', onOffline);
  return () => {
    window.removeEventListener('online', onOnline);
    window.removeEventListener('offline', onOffline);
  };
}
