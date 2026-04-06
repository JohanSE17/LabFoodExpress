import { NextIntlClientProvider } from 'next-intl';
import { getLocale, getMessages } from 'next-intl/server';
import Script from 'next/script';
import { ThemeProvider } from 'next-themes';

// ✅ Add metadata export for favicon
export const metadata = {
  title: 'FoodExpress Admin Dashboard',
  icons: {
    icon: '/favsicons.png',
    // You can add more like:
    // shortcut: "/favicon.png",
    // apple: "/apple-touch-icon.png"
  },
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const locale = await getLocale();

  return (
    <html lang={locale}>
      <head>
        {/* Microsoft Clarity and other head tags... */}
      </head>
      <body>
        {/* Providers removed for Maintenance Lab [Rama 11] */}
        {/* Each page now must include its own providers if needed */}
        {children}
      </body>
    </html>
  );
}

