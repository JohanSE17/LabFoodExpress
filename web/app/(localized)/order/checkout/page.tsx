import OrderCheckoutScreen from "@/lib/ui/screens/protected/order/checkout";
import React from "react";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getMessages } from "next-intl/server";
import { ThemeProvider } from "@/lib/providers/ThemeProvider";

export default async function OrderCheckoutPage() {
  const locale = await getLocale();
  const messages = await getMessages({ locale });

  return (
    <ThemeProvider>
      <NextIntlClientProvider messages={messages} locale={locale}>
        <OrderCheckoutScreen />
      </NextIntlClientProvider>
    </ThemeProvider>
  );
}

