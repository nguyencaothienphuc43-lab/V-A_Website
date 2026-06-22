import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import Hero from "@/components/home/Hero";
import ServicesSection from "@/components/home/ServicesSection";
import WhyUs from "@/components/home/WhyUs";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight } from "lucide-react";

export const metadata: Metadata = {
  title: "V&A Express — Global Logistics from Vietnam",
};

export default async function HomePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "home" });

  return (
    <>
      <Hero locale={locale} />
      <ServicesSection locale={locale} />
      <WhyUs />

      {/* CTA Banner */}
      <section className="relative py-24 overflow-hidden">
        <Image
          src="/images/cta.jpg"
          alt="Freight truck on the highway"
          fill
          sizes="100vw"
          className="object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-brand-700/95 via-brand-600/90 to-brand-500/80" />
        <div className="relative max-w-4xl mx-auto px-4 text-center text-white">
          <h2 className="font-display text-3xl md:text-4xl font-bold mb-4">
            {t("ctaTitle")}
          </h2>
          <p className="text-brand-100 text-lg mb-8">
            {t("ctaSub")}
          </p>
          <Link href={`/${locale}/quote`} className="inline-flex items-center gap-2 bg-white text-brand-600 hover:bg-brand-50
                     font-semibold px-8 py-4 rounded-xl shadow-lg transition-all hover:shadow-xl hover:-translate-y-0.5">
            {t("ctaBtn")} <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>
    </>
  );
}
