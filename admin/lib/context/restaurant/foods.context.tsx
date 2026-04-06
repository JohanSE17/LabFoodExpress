'use client';

// Core
import { createContext, useState } from 'react';

// Interface
import {
  IFoodContextPropData,
  IFoodContextProps,
  IFoodNew,
  IFoodProvider,
  IVariationForm,
} from '@/lib/utils/interfaces';

// Types

export const FoodsContext = createContext({} as any);

export const FoodsProvider = ({ children }: any) => {
  // Form Visibility
  const [isFoodFormVisible, setFoodFormVisible] = useState<boolean>(false);

  const [foodContextData, setFoodContextData] =
    useState<IFoodContextPropData | null>({
      food: {
        _id: '',
        data: {} as any,
        variations: [] as any[],
      },
      isEditing: false,
    });

  // Form Flow
  const [activeIndex, setActiveIndex] = useState<number>(0);

  // Functions
  const onFoodFormVisible = (status: boolean) => {
    setFoodFormVisible(status);
  };

  const onActiveStepChange = (activeStep: number) => {
    setActiveIndex(activeStep);
  };

  const onClearFoodData = () => {
    setActiveIndex(0);
    onFoodFormVisible(false);
    onSetFoodContextData({
      food: {
        _id: '',
        data: {} as any,
        variations: [] as any[],
      },

      isEditing: false,
    });
  };

  const onSetFoodContextData = (data: Partial<any>) => {
    setFoodContextData((prevData) => ({
      ...prevData,
      ...data,
    }));
  };

  const value: any = {
    // Form Visibility
    isFoodFormVisible,
    onFoodFormVisible,
    // Active Step
    activeIndex,
    onActiveStepChange,
    // Clear
    onClearFoodData,
    // Context Data
    foodContextData,
    onSetFoodContextData,
  };

  return (
    <FoodsContext.Provider value={value}>{children}</FoodsContext.Provider>
  );
};
