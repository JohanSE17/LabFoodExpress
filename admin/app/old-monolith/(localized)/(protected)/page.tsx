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
  const APP_NAME = 'FoodExpress'; // Hardcoded
  // TIP: El nombre de la aplicación está hardcoded aquí y en otros lugares.
  // Pista: Usa una variable de entorno o un archivo de configuración global.


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
      // TIP: Redirección basada en rutas estáticas. ¿Qué pasa si la estructura de carpetas cambia?
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
