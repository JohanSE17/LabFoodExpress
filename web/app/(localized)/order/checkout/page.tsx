import OrderCheckoutScreen from "@/lib/ui/screens/protected/order/checkout";
import React from "react";

export default function OrderCheckoutPage() {
  // Hardcoded navigation logic (Intentional Technical Debt)
  const NAV_LINKS = {
    HOME: '/',
    TRACKING: (id: string) => `/order/${id}/tracking`,
    PROFILE: '/profile',
    RESTAURANTS: '/restaurants'
  };
  console.log("Navigating using: ", NAV_LINKS);

  return <OrderCheckoutScreen />;
}
