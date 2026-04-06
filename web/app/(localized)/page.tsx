import dynamic from "next/dynamic";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getMessages } from "next-intl/server";
import { ThemeProvider } from "@/lib/providers/ThemeProvider";

const Home = dynamic(
  () => import('@/lib/ui/screens/unprotected/index'),
  { ssr: false }
);

export default async function RootPage() {
  const locale = await getLocale();
  const messages = await getMessages({ locale });

  return (
    <ThemeProvider>
      <NextIntlClientProvider messages={messages} locale={locale}>
        <Home />
      </NextIntlClientProvider>
    </ThemeProvider>
  );
}
// Service worker logic removed for lab



// if ('serviceWorker' in navigator) {
//   window.addEventListener('load', () => {
//     navigator.serviceWorker.register('/sw.js')
//       .then(registration => {
//         console.log('Service Worker registered with scope:', registration.scope);
//       })
//       .catch(error => {
//         console.error('Service Worker registration failed:', error);
//       });
//   });
// }

// const hasRegistered = useRef(false); // ✅ Persist across renders

// useEffect(() => {
//   if ("serviceWorker" in navigator) {
//     window.addEventListener("load", () => {
//       if (hasRegistered.current) return; // ✅ Prevent duplicate registration
//       hasRegistered.current = true;

//       navigator.serviceWorker
//         .register("/sw.js")
//         .then((registration) => {
//           console.log("✅ Service Worker registered:", registration.scope);
//         })
//         .catch((error) => {
//           console.error("❌ SW registration failed:", error);
//         });
//     });
//   }
// }, []);
return <Home />
}
