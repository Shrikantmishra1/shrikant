import Script from 'next/script';
import { getSettings } from '@/lib/settings';

// Optional Google Analytics 4. Set the ID in Admin → Settings (or NEXT_PUBLIC_GA_ID).
export default async function Analytics() {
  const { gaId: id } = await getSettings();
  if (!id || !/^G-[A-Z0-9]+$/.test(id)) return null;
  return (
    <>
      <Script src={`https://www.googletagmanager.com/gtag/js?id=${id}`} strategy="afterInteractive" />
      <Script id="ga4" strategy="afterInteractive">
        {`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments)}gtag('js',new Date());gtag('config','${id}');`}
      </Script>
    </>
  );
}
