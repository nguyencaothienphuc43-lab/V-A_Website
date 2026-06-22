import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Ship, CheckCircle, ArrowRight } from "lucide-react";
import Reveal from "@/components/ui/Reveal";

export const metadata: Metadata = { title: "Sea Freight" };

const FEATURE_IMAGES = ["/images/sea.jpg", "/images/warehouse.jpg", "/images/cta.jpg"];

export default async function SeaFreightPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "servicePages.sea" });

  return (
    <div>
      {/* Hero */}
      <section className="relative text-white py-28 overflow-hidden">
        <Image src="/images/sea.jpg" alt="Container port from above" fill priority sizes="100vw" className="object-cover" />
        <div className="absolute inset-0 bg-gradient-to-br from-navy-900/95 via-blue-900/85 to-indigo-900/70" />
        <div className="relative max-w-5xl mx-auto px-4">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-2xl bg-blue-500/20 border border-blue-400/30 flex items-center justify-center">
              <Ship className="w-6 h-6 text-blue-400" />
            </div>
            <p className="section-label text-blue-400">{t("label")}</p>
          </div>
          <h1 className="font-display text-4xl md:text-6xl font-bold mb-6 leading-tight">
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

      {/* Services list + feature cards */}
      <section className="py-20 bg-white">
        <div className="max-w-6xl mx-auto px-4">
          <Reveal>
            <h2 className="font-display text-3xl md:text-4xl font-bold text-navy-800 mb-10">{t("offerTitle")}</h2>
          </Reveal>
          <div className="grid lg:grid-cols-2 gap-12 items-start">
            <Reveal delay={100}>
              <ul className="space-y-5">
                {[1, 2, 3, 4, 5, 6, 7].map(n => (
                  <li key={n} className="flex items-start gap-3 text-base md:text-lg text-gray-600">
                    <CheckCircle className="w-6 h-6 text-blue-500 flex-shrink-0 mt-0.5" />
                    {t(`item${n}` as any)}
                  </li>
                ))}
              </ul>
            </Reveal>
            <div className="space-y-6">
              {FEATURE_IMAGES.map((img, i) => (
                <Reveal key={i} delay={150 + i * 120}>
                  <div className="group relative rounded-2xl overflow-hidden shadow-md hover:shadow-xl
                                  hover:-translate-y-1 transition-all duration-500">
                    <div className="relative h-48">
                      <Image src={img} alt={t(`f${i + 1}Title` as any)} fill sizes="(max-width: 1024px) 100vw, 50vw" className="object-cover transition-transform duration-700 group-hover:scale-105" />
                      <div className="absolute inset-0 bg-gradient-to-r from-navy-900/80 to-navy-900/30" />
                    </div>
                    <div className="absolute inset-0 flex flex-col justify-center p-6 text-white">
                      <h3 className="font-display font-bold text-xl mb-2">{t(`f${i + 1}Title` as any)}</h3>
                      <p className="text-sm text-gray-200 leading-relaxed max-w-sm">{t(`f${i + 1}Desc` as any)}</p>
                    </div>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
