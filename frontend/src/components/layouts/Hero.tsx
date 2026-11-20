"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

export type HeroBanner = {
  _id?: string;
  title: string;
  subtitle?: string;
  imageUrl: string;
  linkUrl?: string;
};

const defaultBanner: HeroBanner = {
  title: "روایت تازه‌ای از زیبایی تو",
  subtitle:
    "مجموعه‌ای از پوشاک زنانه با طراحی دلنشین و کیفیتی ماندگار؛ برای روزهایی که می‌خواهی خودت باشی و بدرخشی.",
  imageUrl: "/images/default-banner.svg",
  linkUrl: "/shop",
};

export default function Hero({ banners }: { banners: HeroBanner[] }) {
  const slides = banners.length > 0 ? banners : [defaultBanner];
  const [activeIndex, setActiveIndex] = useState(0);
  const activeBanner = slides[activeIndex] ?? slides[0];

  useEffect(() => {
    if (slides.length < 2) return;

    const interval = window.setInterval(() => {
      setActiveIndex((index) => (index + 1) % slides.length);
    }, 6000);

    return () => window.clearInterval(interval);
  }, [slides.length]);

  return (
    <section
      aria-label="بنرهای فروشگاه"
      aria-roledescription="اسلایدر"
      className="relative isolate flex min-h-[470px] items-center overflow-hidden bg-primary sm:min-h-[540px] lg:min-h-[620px]"
      dir="rtl"
    >
      {slides.map((banner, index) => (
        <div
          aria-hidden="true"
          className={`absolute inset-0 -z-20 bg-cover bg-center transition-opacity duration-700 ${index === activeIndex ? "opacity-100" : "opacity-0"}`}
          key={banner._id ?? `${banner.imageUrl}-${index}`}
          style={{ backgroundImage: `url("${banner.imageUrl}")` }}
        />
      ))}
      <div className="absolute inset-0 -z-10 bg-[linear-gradient(270deg,rgba(37,25,15,0.84)_0%,rgba(49,34,21,0.64)_36%,rgba(49,34,21,0.12)_100%)]" />
      <div className="absolute inset-0 -z-10 bg-gradient-to-t from-primary/35 via-transparent to-primary/10" />

      <div
        aria-live="polite"
        className="mx-auto w-full max-w-7xl px-5 py-16 sm:px-8 lg:px-12"
        key={activeBanner._id ?? activeBanner.title}
      >
        <div className="max-w-xl text-right text-primary-foreground">
          <p className="mb-4 inline-flex items-center gap-2 text-xs font-medium tracking-wide text-[#f0d49c] sm:text-sm">
            <span aria-hidden="true" className="h-px w-8 bg-accent" />
            استایل ماندگار، انتخابی برای تو
          </p>
          <h1 className="text-4xl font-black leading-[1.45] tracking-tight sm:text-5xl lg:text-6xl">
            {activeBanner.title}
          </h1>
          {activeBanner.subtitle && (
            <p className="mt-5 max-w-lg text-sm leading-7 text-primary-foreground/85 sm:text-base sm:leading-8">
              {activeBanner.subtitle}
            </p>
          )}
          <Link
            className="mt-8 inline-flex min-h-12 items-center justify-center rounded-full bg-accent px-7 text-sm font-bold text-accent-foreground shadow-lg shadow-black/15 transition hover:-translate-y-0.5 hover:bg-[#d5aa59] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent"
            href={activeBanner.linkUrl || "/shop"}
          >
            مشاهده محصولات
            <span aria-hidden="true" className="mr-2 text-lg leading-none">
              ←
            </span>
          </Link>
        </div>
      </div>

      {slides.length > 1 && (
        <div className="absolute bottom-6 left-1/2 flex -translate-x-1/2 items-center gap-2">
          {slides.map((banner, index) => (
            <button
              aria-label={`نمایش بنر ${index + 1}: ${banner.title}`}
              aria-pressed={index === activeIndex}
              className={`h-2 rounded-full transition-all focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent ${index === activeIndex ? "w-8 bg-accent" : "w-2 bg-white/70 hover:bg-white"}`}
              key={banner._id ?? `${banner.imageUrl}-${index}-control`}
              onClick={() => setActiveIndex(index)}
              type="button"
            />
          ))}
        </div>
      )}
    </section>
  );
}
