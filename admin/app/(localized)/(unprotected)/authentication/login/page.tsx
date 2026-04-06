// Component

import LoginEmailPasswordScreen from '@/lib/ui/screens/authentication/sign-in-email-password';
import { NextIntlClientProvider } from 'next-intl';
import { getLocale, getMessages } from 'next-intl/server';
import { ThemeProvider } from 'next-themes';

export default async function LoginPage() {
  const locale = await getLocale();
  const messages = await getMessages({ locale });

  return (
    <ThemeProvider attribute="class">
      <NextIntlClientProvider messages={messages} locale={locale}>
        <LoginEmailPasswordScreen />
      </NextIntlClientProvider>
    </ThemeProvider>
  );
}

