import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { isNative, syncStorageSet, syncStorageRemove } from '@/platform';
import { initPushNotifications, unregisterPush } from '@/platform/push';

export function useNativeAuthSync() {
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isNative) return;

    if (user) {
      const token = localStorage.getItem('token');
      if (token) syncStorageSet('token', token);
      syncStorageSet('user', JSON.stringify(user));

      void initPushNotifications({
        onTap: (action) => {
          const data = (action.notification.data ?? {}) as Record<string, string>;
          const path = data.url || data.path;
          if (typeof path === 'string' && path.startsWith('/')) {
            navigate(path);
          }
        },
      });
    } else {
      syncStorageRemove('token');
      syncStorageRemove('user');
      void unregisterPush();
    }
  }, [user, navigate]);
}
