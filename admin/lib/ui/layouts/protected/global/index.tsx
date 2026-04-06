/* eslint-disable react-hooks/exhaustive-deps */
'use client';

// Interface
import { IProvider } from '@/lib/utils/interfaces';

const RootLayout = ({ children }: any) => {
  return <div className="h-full">{children}</div>;
};

export default RootLayout;
