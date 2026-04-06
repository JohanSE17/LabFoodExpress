import { DirectionProvider } from "@/lib/context/direction/DirectionContext";
import { ThemeProvider } from "@/lib/providers/ThemeProvider";
import { DirectionHandler } from "@/lib/ui/layouts/global/rtl/DirectionHandler";
// import InstallPWA from "@/lib/ui/pwa/InstallPWA";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getMessages } from "next-intl/server";
import Script from "next/script";

export const metadata = {
  title: "FoodExpress",
  description: "FoodExpress — Pide comida en minutos",
  manifest: "/manifest.json",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const locale = await getLocale();
  const rtlLocales = ["ar", "hr", "fa", "ur"];
  const baseLocale = locale.split("-")[0];
  const dir =
    rtlLocales.includes(locale) || rtlLocales.includes(baseLocale)
      ? "rtl"
      : "ltr";

  return (
    <html lang={locale} dir={dir} suppressHydrationWarning>
      <head>
        {/* Head content... */}
      </head>
      <body className={dir === "rtl" ? "rtl" : ""}>
        {/* Providers removed for Maintenance Lab [Rama 11] */}
        {children}
      </body>
    </html>
  );
}

