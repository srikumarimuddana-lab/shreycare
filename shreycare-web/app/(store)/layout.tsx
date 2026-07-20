import { sanityClient } from "@/lib/sanity/client";
import { siteSettingsQuery } from "@/lib/sanity/queries";
import { StoreChrome } from "@/components/layout/StoreChrome";
import type { SiteSettings } from "@/types";

export const revalidate = 60;

export default async function StoreLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const settings: SiteSettings | null = await sanityClient.fetch(siteSettingsQuery);

  return (
    <StoreChrome announcementText={settings?.announcementBar}>
      {children}
    </StoreChrome>
  );
}
