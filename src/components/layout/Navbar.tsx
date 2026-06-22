"use client";
import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { createClient } from "@/lib/supabase/client";
import { Menu, X, ChevronDown, Globe, LogOut, User } from "lucide-react";
import type { User as SupaUser } from "@supabase/supabase-js";
import type { Profile } from "@/types";

export default function Navbar({ locale }: { locale: string }) {
  const t = useTranslations("nav");
  const pathname = usePathname();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [servicesOpen, setServicesOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const servicesTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [user, setUser] = useState<SupaUser | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const supabase = createClient();

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        const { data } = await supabase.from("profiles").select("*").eq("id", session.user.id).single();
        setProfile(data);
      } else {
        setProfile(null);
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const switchLocale = () => {
    const newLocale = locale === "en" ? "vi" : "en";
    const segments = pathname.split("/");
    if (["en", "vi"].includes(segments[1])) segments[1] = newLocale;
    else segments.splice(1, 0, newLocale);
    router.push(segments.join("/") || "/");
  };

  const l = (path: string) => `/${locale}${path}`;

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push(l("/"));
  };

  const services = [
    { href: l("/services/air-freight"),  label: t("airFreight")  },
    { href: l("/services/sea-freight"),  label: t("seaFreight")  },
    { href: l("/services/road-freight"), label: t("roadFreight") },
  ];

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 h-[115px] transition-all duration-300 ${
      scrolled ? "bg-white/95 backdrop-blur-sm shadow-sm border-b border-gray-100" : "bg-white"
    }`}>
      <div className="w-full px-40s sm:px-60 lg:px-8 h-full flex items-center justify-between gap-5">

        {/* Logo + wordmark */}
        <Link href={l("/")} className="flex items-center gap-[0px] group shrink-100">
          <Image
            src="/logo2.png"
            alt="V&A Express — International Logistics"
            width={900}
            height={70}
            priority
            style={{ height: "var(--logo-h)" }}
            className="w-auto transition-transform duration-200 group-hover:scale-1"
          />
          <div className="flex flex-col leading-none text-[#3B557E]">
            {/* EXPRESS */}
            <span
              className="font-display font-extrabold tracking-tight"
              style={{ fontSize: "calc(var(--logo-h) / 7 * 1.15)", marginTop: "calc(var(--logo-h) / 4.5)" }}
            >
              EXPRESS
            </span>
            {/* "International Logistics" = 50% of EXPRESS */}
            <span
              className="font-display font-medium tracking-wide"
              style={{ fontSize: "calc(var(--logo-h) / 7 * 1.5 / 2)", marginTop: "calc(var(--logo-h) / 60)" }}
            >
              International Logistics
            </span>
          </div>
        </Link>

        {/* Desktop Nav */}
        <div className="hidden xl:flex items-center gap-7 3xl:gap-12 shrink-0">
          <NavLink href={l("/")} active={pathname === `/${locale}` || pathname === l("/")}>{t("home")}</NavLink>
          <NavLink href={l("/about")} active={pathname === l("/about")}>{t("about")}</NavLink>

          {/* Services dropdown */}
          <div
            className="relative"
            onMouseEnter={() => {
              if (servicesTimeoutRef.current) {
                clearTimeout(servicesTimeoutRef.current);
                servicesTimeoutRef.current = null;
              }
              setServicesOpen(true);
            }}
            onMouseLeave={() => {
              servicesTimeoutRef.current = setTimeout(() => {
                setServicesOpen(false);
              }, 111);
            }}
          >
            <button
              className={`flex items-center gap-1 px-2 2xl:px-5 py-2.5 rounded-full font-display text-lg font-medium border transition-all duration-200
                hover:-translate-y-0.5 active:translate-y-0 focus:outline-none focus:ring-2 focus:ring-brand-300 focus:ring-offset-2 ${
                servicesOpen
                  ? "text-brand-600 bg-brand-50 border-brand-300 shadow-sm"
                  : "text-gray-600 border-gray-200 hover:text-brand-600 hover:bg-brand-50 hover:border-brand-300 hover:shadow-sm"
              }`}
            >
              {t("services")} <ChevronDown className="w-5 h-5" />
            </button>
            {servicesOpen && (
              <div className="absolute top-full left-0 mt-2 w-80 bg-white rounded-xl shadow-xl border border-gray-100 py-3 z-50 animate-fade-in">
                {services.map((s) => (
                  <Link key={s.href} href={s.href}
                    className="block px-6 py-4 font-display text-lg text-gray-600 hover:text-brand-600 hover:bg-brand-50 transition-colors">
                    {s.label}
                  </Link>
                ))}
              </div>
            )}
          </div>

          <NavLink href={l("/tracking")} active={pathname.includes("/tracking")}>{t("tracking")}</NavLink>
          <NavLink href={l("/blog")} active={pathname.includes("/blog")}>{t("blog")}</NavLink>
          <NavLink href={l("/contact")} active={pathname.includes("/contact")}>{t("contact")}</NavLink>
        </div>

        {/* Right side */}
        <div className="hidden xl:flex items-center gap-1 2xl:gap-5 shrink-0">
          <button onClick={switchLocale}
            className="flex items-center gap-1.5 font-display text-lg text-gray-500 hover:text-navy-800 px-2 py-2.5 rounded-lg hover:bg-gray-50 transition-colors">
            <Globe className="w-5 h-5" />
            {locale === "en" ? "VI" : "EN"}
          </button>

          {user ? (
            <div className="flex items-center gap-1.5">
              <Link href={l(profile?.role === "admin" ? "/admin" : "/portal")}
                className="flex items-center gap-2 font-display text-lg text-gray-600 hover:text-navy-800 px-2 py-2.5 rounded-lg hover:bg-gray-50 transition-colors">
                <User className="w-5 h-5" />
                {profile?.full_name?.split(" ")[0] || t("portal")}
              </Link>
              <button onClick={handleLogout}
                className="flex items-center gap-1 text-lg text-gray-400 hover:text-red-500 px-2 py-2.5 rounded-lg transition-colors">
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          ) : (
            <Link href={l("/auth/login")} className="btn-ghost font-display text-lg whitespace-nowrap px-3">{t("login")}</Link>
          )}

          <Link href={l("/quote")} className="btn-primary font-display text-lg py-3 whitespace-nowrap">{t("quote")}</Link>
        </div>

        {/* Mobile */}
        <button className="xl:hidden p-3 rounded-lg text-gray-600 hover:bg-gray-100"
          onClick={() => setMenuOpen(!menuOpen)}>
          {menuOpen ? <X className="w-10 h-10" /> : <Menu className="w-10 h-10" />}
        </button>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="xl:hidden absolute top-full left-0 right-0 bg-white border-t border-gray-100 shadow-xl">
          <div className="px-4 py-4 space-y-1 max-h-[80vh] overflow-y-auto">
            <MobileLink href={l("/")} onClick={() => setMenuOpen(false)}>{t("home")}</MobileLink>
            <MobileLink href={l("/about")} onClick={() => setMenuOpen(false)}>{t("about")}</MobileLink>
            <div className="pl-2 py-1">
              <div className="text-base font-semibold text-gray-400 uppercase tracking-wider py-1">{t("services")}</div>
              {services.map(s => (
                <MobileLink key={s.href} href={s.href} onClick={() => setMenuOpen(false)}>{s.label}</MobileLink>
              ))}
            </div>
            <MobileLink href={l("/tracking")} onClick={() => setMenuOpen(false)}>{t("tracking")}</MobileLink>
            <MobileLink href={l("/blog")} onClick={() => setMenuOpen(false)}>{t("blog")}</MobileLink>
            <MobileLink href={l("/contact")} onClick={() => setMenuOpen(false)}>{t("contact")}</MobileLink>
            <div className="border-t border-gray-100 pt-3 mt-3 flex flex-col gap-2">
              <button onClick={() => { switchLocale(); setMenuOpen(false); }}
                className="flex items-center gap-2 text-[1.75rem] text-gray-500 px-3 py-2">
                <Globe className="w-8 h-8" /> {locale === "en" ? "Tiếng Việt" : "English"}
              </button>
              {user ? (
                <>
                  <Link href={l(profile?.role === "admin" ? "/admin" : "/portal")} onClick={() => setMenuOpen(false)}
                    className="text-[1.75rem] text-gray-700 px-3 py-2">{t("portal")}</Link>
                  <button onClick={handleLogout} className="text-[1.75rem] text-red-500 px-3 py-2 text-left">{t("logout")}</button>
                </>
              ) : (
                <Link href={l("/auth/login")} onClick={() => setMenuOpen(false)}
                  className="text-[1.75rem] text-gray-700 px-3 py-2">{t("login")}</Link>
              )}
              <Link href={l("/quote")} onClick={() => setMenuOpen(false)} className="btn-primary justify-center text-[1.75rem]">{t("quote")}</Link>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}

function NavLink({ href, active, children }: { href: string; active: boolean; children: React.ReactNode }) {
  return (
    <Link href={href} className={`px-2 2xl:px-4 py-2.5 rounded-full font-display text-lg font-medium whitespace-nowrap border transition-all duration-200
      hover:-translate-y-0.5 active:translate-y-0 focus:outline-none focus:ring-2 focus:ring-brand-300 focus:ring-offset-2 ${
      active
        ? "text-white bg-brand-500 border-brand-500 shadow-md shadow-brand-500/30"
        : "text-gray-600 border-gray-200 hover:text-brand-600 hover:bg-brand-50 hover:border-brand-300 hover:shadow-sm"
    }`}>
      {children}
    </Link>
  );
}

function MobileLink({ href, onClick, children }: { href: string; onClick: () => void; children: React.ReactNode }) {
  return (
    <Link href={href} onClick={onClick}
      className="block px-3 py-3 font-display text-[1.75rem] text-gray-700 hover:text-brand-600 hover:bg-brand-50 rounded-lg transition-colors">
      {children}
    </Link>
  );
}
