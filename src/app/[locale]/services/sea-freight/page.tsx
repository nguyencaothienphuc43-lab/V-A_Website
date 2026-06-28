import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { ArrowRight } from "lucide-react";
import Reveal from "@/components/ui/Reveal";

export const metadata: Metadata = { title: "Sea Freight" };

const FEATURE_IMAGES = ["/images/cta.jpg", "/images/cargo-types.jpg", "/images/road.jpg"];

export default async function SeaFreightPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "servicePages.sea" });
  const tHome = await getTranslations({ locale, namespace: "home" });

  return (
    <div>
      {/* Hero */}
      <section className="relative text-white py-32 md:py-40 overflow-hidden">
        <Image src="/images/sea.jpg" alt="Container port from above" fill priority sizes="100vw" className="object-cover" />
        <div className="absolute inset-0 bg-gradient-to-br from-navy-900/95 via-blue-900/85 to-indigo-900/70" />
        <div className="relative max-w-5xl mx-auto px-4">
          <h1 className="font-display text-4xl md:text-6xl lg:text-7xl font-bold mb-6 leading-tight">
            {t("title1")}<br />{t("title2")}
          </h1>
          <p className="text-navy-200 text-lg md:text-xl max-w-2xl leading-relaxed mb-10">
            {t("desc")}
          </p>
          <Link href={`/${locale}/quote`} className="btn-primary text-lg px-8 py-4">
            {t("cta")} <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>

      {/* Services offered */}
      <section className="py-24 bg-white">
        <div className="max-w-6xl mx-auto px-4">
          <Reveal>
            <h2 className="font-display text-3xl md:text-4xl font-bold text-navy-800 text-center mb-16">
              {t("offerTitle")}
            </h2>
          </Reveal>
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <Reveal delay={100}>
              <div className="relative rounded-3xl overflow-hidden shadow-2xl aspect-[4/3]">
                <Image
                  src="/images/port-aerial.jpg"
                  alt={t("offerTitle")}
                  fill
                  sizes="(max-width: 1024px) 100vw, 50vw"
                  className="object-cover"
                />
              </div>
            </Reveal>
            <Reveal delay={200}>
              <ul className="space-y-3">
                {[1, 2, 3, 4, 5, 6, 7].map(n => (
                  <li key={n} className="flex items-start gap-4 p-4 rounded-xl bg-gray-50 hover:bg-blue-50 transition-colors duration-300">
                    <span className="flex-shrink-0 w-8 h-8 rounded-lg bg-blue-500 text-white flex items-center justify-center text-sm font-bold">
                      {String(n).padStart(2, "0")}
                    </span>
                    <span className="text-base md:text-lg text-gray-700 leading-relaxed pt-0.5">
                      {t(`item${n}` as any)}
                    </span>
                  </li>
                ))}
              </ul>
            </Reveal>
          </div>
        </div>
      </section>

      {/* Feature cards */}
      <section className="py-24 bg-gray-50">
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid md:grid-cols-3 gap-8">
            {FEATURE_IMAGES.map((img, i) => (
              <Reveal key={i} delay={100 + i * 120} className="h-full">
                <div className="group h-full flex flex-col bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl
                                border border-gray-100 transition-all duration-500 hover:-translate-y-1">
                  <div className="relative h-52 flex-shrink-0 overflow-hidden">
                    <Image
                      src={img}
                      alt={t(`f${i + 1}Title` as any)}
                      fill
                      sizes="(max-width: 768px) 100vw, 33vw"
                      className="object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                  </div>
                  <div className="p-6 flex-grow flex flex-col">
                    <h3 className="font-display font-bold text-xl text-navy-800 mb-3">
                      {t(`f${i + 1}Title` as any)}
                    </h3>
                    <p className="text-gray-500 leading-relaxed">
                      {t(`f${i + 1}Desc` as any)}
                    </p>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="relative py-20 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-navy-800 via-navy-900 to-blue-900" />
        <Reveal>
          <div className="relative max-w-3xl mx-auto px-4 text-center text-white">
            <h2 className="font-display text-3xl md:text-4xl font-bold mb-4">
              {tHome("ctaTitle")}
            </h2>
            <p className="text-navy-200 text-lg mb-8">{tHome("ctaSub")}</p>
            <Link href={`/${locale}/quote`} className="btn-primary text-lg px-8 py-4">
              {t("cta")} <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </Reveal>
      </section>
    </div>
  );
}
