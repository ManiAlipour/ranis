import Image from "next/image";
import Link from "next/link";

const navigation = [
  { title: "صفحهٔ اصلی", href: "/" },
  { title: "فروشگاه", href: "/shop" },
  { title: "دسته‌بندی‌ها", href: "/shop#categories" },
  { title: "جدیدترین‌ها", href: "/shop?sort=newest" },
  { title: "تماس با ما", href: "/contact" },
];

function Icon({ name }: { name: "search" | "user" | "bag" | "menu" }) {
  const common = {
    className: "h-5 w-5",
    fill: "none",
    stroke: "currentColor",
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    strokeWidth: 1.7,
    viewBox: "0 0 24 24",
    "aria-hidden": true as const,
  };

  if (name === "search") {
    return (
      <svg {...common}>
        <circle cx="10.8" cy="10.8" r="6.3" />
        <path d="m16 16 4.2 4.2" />
      </svg>
    );
  }
  if (name === "user") {
    return (
      <svg {...common}>
        <circle cx="12" cy="8" r="3.3" />
        <path d="M5.5 20a6.5 6.5 0 0 1 13 0" />
      </svg>
    );
  }
  if (name === "bag") {
    return (
      <svg {...common}>
        <path d="M5 8h14l1 12H4L5 8Z" />
        <path d="M9 9V6a3 3 0 0 1 6 0v3" />
      </svg>
    );
  }
  return (
    <svg {...common}>
      <path d="M4 7h16M4 12h16M4 17h16" />
    </svg>
  );
}

function SearchForm({ mobile = false }: { mobile?: boolean }) {
  return (
    <form
      action="/shop"
      role="search"
      className={`flex h-11 items-center gap-2 rounded-full border border-border bg-surface px-4 text-muted transition focus-within:border-accent focus-within:ring-2 focus-within:ring-ring/20 ${mobile ? "w-full lg:hidden" : "hidden w-full max-w-xl lg:flex"}`}
    >
      <Icon name="search" />
      <input
        aria-label="جست‌وجوی محصولات"
        className="min-w-0 flex-1 bg-transparent text-sm text-foreground outline-none placeholder:text-muted"
        name="search"
        placeholder="دنبال چه چیزی می‌گردید؟"
        type="search"
      />
      <button
        className="sr-only focus:not-sr-only focus:rounded focus:bg-primary focus:px-2 focus:py-1 focus:text-primary-foreground"
        type="submit"
      >
        جست‌وجو
      </button>
    </form>
  );
}

function Brand() {
  return (
    <Link
      aria-label="رانیس، صفحهٔ اصلی"
      className="flex shrink-0 items-center gap-2"
      href="/"
    >
      <Image
        alt=""
        className="h-11 w-11 object-contain"
        height={44}
        priority
        src="/images/logo.webp"
        width={44}
      />
      <span className="flex flex-col leading-tight">
        <span className="text-xl font-black tracking-tight text-primary">
          رانیس
        </span>
        <span className="mt-1 text-[10px] tracking-[0.2em] text-secondary">
          استایل ماندگار
        </span>
      </span>
    </Link>
  );
}

export default function Header() {
  return (
    <header className="sticky top-0 z-50 border-b border-border/80 bg-background/95 shadow-sm shadow-primary/5 backdrop-blur">
      <div className="bg-primary px-4 py-2 text-center text-[11px] text-primary-foreground sm:text-xs">
        ارسال رایگان برای سفارش‌های بالای ۳ میلیون تومان
      </div>

      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-x-6 gap-y-3 px-4 py-3 sm:px-6 lg:flex-nowrap lg:px-8 lg:py-4">
        <Brand />

        <SearchForm />

        <div className="flex items-center gap-1 sm:gap-2">
          <Link
            aria-label="ورود یا ثبت‌نام"
            className="flex h-10 items-center gap-2 rounded-full px-2 text-primary transition hover:bg-surface-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring sm:px-3"
            href="/login"
          >
            <Icon name="user" />
            <span className="hidden text-sm sm:inline">ورود / ثبت‌نام</span>
          </Link>
          <Link
            aria-label="سبد خرید"
            className="relative flex h-10 w-10 items-center justify-center rounded-full text-primary transition hover:bg-surface-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
            href="/cart"
          >
            <Icon name="bag" />
          </Link>
          <details className="relative lg:hidden">
            <summary
              aria-label="باز کردن منو"
              className="flex h-10 w-10 cursor-pointer list-none items-center justify-center rounded-full text-primary transition hover:bg-surface-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring [&::-webkit-details-marker]:hidden"
            >
              <Icon name="menu" />
            </summary>
            <nav
              aria-label="ناوبری اصلی"
              className="absolute left-0 top-12 z-50 flex w-56 flex-col rounded-2xl border border-border bg-surface p-2 shadow-xl shadow-primary/10"
            >
              {navigation.map((item) => (
                <Link
                  className="rounded-xl px-4 py-3 text-sm text-foreground transition hover:bg-surface-muted hover:text-primary focus-visible:outline-2 focus-visible:outline-ring"
                  href={item.href}
                  key={item.href}
                >
                  {item.title}
                </Link>
              ))}
            </nav>
          </details>
        </div>

        <SearchForm mobile />
      </div>

      <nav
        aria-label="ناوبری اصلی"
        className="hidden border-t border-border/70 lg:block"
      >
        <div className="mx-auto flex max-w-7xl items-center justify-center gap-10 px-8">
          {navigation.map((item) => (
            <Link
              className="relative py-3 text-sm text-muted transition hover:text-primary after:absolute after:inset-x-0 after:bottom-0 after:h-0.5 after:origin-center after:scale-x-0 after:bg-accent after:transition-transform hover:after:scale-x-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
              href={item.href}
              key={item.href}
            >
              {item.title}
            </Link>
          ))}
        </div>
      </nav>
    </header>
  );
}
