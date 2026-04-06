import dynamic from 'next/dynamic';
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getMessages } from "next-intl/server";
import { ThemeProvider } from "@/lib/providers/ThemeProvider";

// Dynamically import the component with SSR disabled
const PersonalInfoScreen = dynamic(
  () => import('@/lib/ui/screens/protected/profile').then(mod => mod.PersonalInfoScreen),
  { ssr: false }
);

export default async function PersonalInfo() {
  const locale = await getLocale();
  const messages = await getMessages({ locale });

  return (
    <ThemeProvider>
      <NextIntlClientProvider messages={messages} locale={locale}>
        <PersonalInfoScreen />
      </NextIntlClientProvider>
    </ThemeProvider>
  );
}

