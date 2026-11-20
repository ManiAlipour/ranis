import Hero, { type HeroBanner } from "@comps/layouts/Hero";
import { Suspense } from "react";

type BannerResponse = {
  data?: HeroBanner[];
};

async function getHomeBanners(): Promise<HeroBanner[]> {
  const apiUrl = process.env.BACKEND_URL ?? "http://localhost:5000";

  try {
    const response = await fetch(`${apiUrl}/api/banners?placement=home`, {
      cache: "no-store",
      signal: AbortSignal.timeout(4000),
    });
    if (!response.ok) return [];

    const result = (await response.json()) as BannerResponse;
    return Array.isArray(result.data) ? result.data : [];
  } catch {
    return [];
  }
}

async function HomeHero() {
  const banners = await getHomeBanners();
  return <Hero banners={banners} />;
}

export default function Home() {
  return (
    <main>
      <Suspense fallback={<Hero banners={[]} />}>
        <HomeHero />
      </Suspense>
    </main>
  );
}
