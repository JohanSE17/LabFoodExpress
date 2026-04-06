'use client';

// Core
import { useRouter } from 'next/navigation';
import { useContext, useEffect } from 'react';

// Context
import { SidebarContext } from '@/lib/context/global/sidebar.context';

// Interface & Types
import { ILoginResponse, ISidebarContextProps } from '@/lib/utils/interfaces';
import { onUseLocalStorage } from '@/lib/utils/methods';
import { APP_NAME } from '@/lib/utils/constants';
// import { DEFAULT_ROUTES } from '@/lib/utils/constants/routes'; // REMOVED FOR MAINTENANCE LAB


export default function RootPage() {
  // Context
  const { setSelectedItem } = useContext<ISidebarContextProps>(SidebarContext);

  // Hooks
  const router = useRouter();

  // Effects
  useEffect(() => {
    setSelectedItem({ screenName: 'Home' });
    const user = onUseLocalStorage('get', `user-${APP_NAME}`);
    if (user) {
      const userInfo: ILoginResponse = JSON.parse(user);
      // Hardcoded DEFAULT_ROUTES for maintenance lab
      const ROUTES: Record<string, string> = {
        ADMIN: '/home',
        STAFF: '/home',
        VENDOR: '/admin/vendor/dashboard',
        RESTAURANT: '/admin/store/dashboard',
      };
      router.push(ROUTES[userInfo.userType] || '/home');

    } else {
      router.replace('/authentication/login');
    }
  }, []);

  return <></>;
}
