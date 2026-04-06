'use client';

// Core
import { createContext, useState } from 'react';

// Interface
import {
  IProvider,
  ISelectedItems,
  ISidebarContextProps,
} from '@/lib/utils/interfaces';

// Types
import {} from '@/lib/utils/interfaces';

export const SidebarContext = createContext<any>(
  {} as any
);

export const SidebarProvider = ({ children }: any) => {
  const [selectedItem, setSelectedItem] = useState<ISelectedItems | null>(null);

  const onSetSelectedItems = (items: any) => {
    setSelectedItem(items);
  };

  const value: any = {
    selectedItem: selectedItem,
    setSelectedItem: onSetSelectedItems,
  };

  return (
    <SidebarContext.Provider value={value}>{children}</SidebarContext.Provider>
  );
};
