import { useEffect, useRef } from 'react';
import toast from 'react-hot-toast';

/**
 * Detects online/offline transitions and shows a toast notification.
 * The "back online" toast dismisses the offline toast automatically.
 */
export function useOfflineDetection() {
  const offlineToastId = useRef<string | null>(null);

  useEffect(() => {
    const handleOffline = () => {
      offlineToastId.current = toast.error('אין חיבור לאינטרנט — השינויים יישמרו כשהחיבור יחזור', {
        id: 'offline-toast',
        duration: Infinity,
        icon: '📡',
      });
    };

    const handleOnline = () => {
      toast.dismiss('offline-toast');
      toast.success('החיבור חזר!', { duration: 3000, icon: '✅' });
    };

    window.addEventListener('offline', handleOffline);
    window.addEventListener('online', handleOnline);

    return () => {
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('online', handleOnline);
    };
  }, []);
}

export default useOfflineDetection;
