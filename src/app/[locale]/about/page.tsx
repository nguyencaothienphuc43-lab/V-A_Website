import type { Metadata } from "next";
import Image from "next/image";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { MapPin, Phone, Mail, Clock } from "lucide-react";
import Reveal from "@/components/ui/Reveal";
import CountUp from "@/components/ui/CountUp";

export const metadata: Metadata = { title: "About Us" };

const STATS = [
  { key: "packages",  value: 7255 },
  { key: "tons",      value: 8500 },
  { key: "km",        value: 5348 },
  { key: "customers", value: 3125 },
] as const;

const OFFERS = [
  { key: "fast",         image: "/images/air.jpg" },
  { key: "versatility",  image: "/images/sea.jpg" },
  { key: "transparency", image: "/images/warehouse.jpg" },
  { key: "team",         image: "/images/road.jpg" },
] as const;

export default async function AboutPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "about" });
  const w = await getTranslations({ locale, namespace: "whyUs" });

  const contacts = [
    { Icon: MapPin, label: t("headOffice"),   value: t("headOfficeValue") },
    { Icon: MapPin, label: t("branchOffice"), value: t("branchOfficeValue") },
    { Icon: Clock,  label: t("hoursLabel"),   value: t("hoursValue") },
    { Icon: Phone,  label: t("phoneLabel"),   value: "(+84) 909 987 068",    href: "tel:+84909987068" },
    { Icon: Mail,   label: t("emailLabel"),   value: "mkt@vaexpress.com.vn", href: "mailto:mkt@vaexpress.com.vn" },
  ];

  return (
    <div>
      {/* Hero */}
      <section className="relative bg-navy-800 text-white py-24 overflow-hidden">
        <Image
          src="/images/sea.jpg"
          alt="Container terminal"
          fill
          priority
          sizes="100vw"
          className="object-cover"
        />
        <div className="absolute inset-0 bg-navy-900/85" />
        <div className="relative max-w-4xl mx-auto px-4 text-center">
          <p className="section-label text-brand-300 mb-3">{t("label")}</p>
          <h1 className="font-display text-4xl md:text-5xl font-bold mb-6">
            {t("title1")}<br />{t("title2")}
          </h1>
          <p className="text-navy-100 text-lg leading-relaxed max-w-2xl mx-auto">
            {t("intro")}
          </p>
        </div>
      </section>

      {/* Story — centred text-first layout */}
      <section className="py-24 bg-white">
        <div className="max-w-5xl mx-auto px-4">
          <Reveal className="text-center mb-16">
            <p className="section-label mb-4">{t("storyLabel")}</p>
            <h2 className="font-display text-4xl md:text-5xl font-bold text-navy-800 leading-tight mb-8">
              {t("storyTitle")}
            </h2>
            <p className="text-gray-500 text-lg md:text-xl leading-relaxed max-w-3xl mx-auto mb-5">
              {t("storyP1")}
            </p>
            <p className="text-gray-500 text-lg md:text-xl leading-relaxed max-w-3xl mx-auto">
              {t("storyP2")}
            </p>
          </Reveal>
          <Reveal delay={200}>
            <div className="relative h-[400px] md:h-[480px] rounded-3xl overflow-hidden shadow-2xl group">
              <Image
                src="/images/warehouse.jpg"
                alt="V&A Express warehouse operations"
                fill
                sizes="100vw"
                className="object-cover transition-transform duration-700 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-navy-900/40 to-transparent" />
            </div>
          </Reveal>
        </div>
      </section>

      {/* Stats strip — expanded */}
      <section className="relative py-24 overflow-hidden">
        <Image
          src="/images/cta.jpg"
          alt="Freight truck on the highway"
          fill
          sizes="100vw"
          className="object-cover"
        />
        <div className="absolute inset-0 bg-brand-700/90" />
        <div className="relative max-w-7xl mx-auto px-4 grid grid-cols-2 md:grid-cols-4 gap-10 text-center text-white">
          {STATS.map(({ key, value }, i) => (
            <Reveal key={key} delay={i * 120}>
              <div className="font-display text-5xl md:text-6xl font-bold mb-2">
                <CountUp end={value} />
              </div>
              <div className="text-base md:text-lg text-brand-100 font-medium">{w(`${key}.label` as any)}</div>
              <div className="text-sm text-brand-200/70 mt-1">{w(`${key}.desc` as any)}</div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* What we offer — image cards */}
      <section className="py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4">
          <Reveal className="text-center mb-14">
            <h2 className="font-display text-4xl md:text-5xl font-bold text-navy-800">{t("offerTitle")}</h2>
          </Reveal>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {OFFERS.map(({ key, image }, i) => (
              <Reveal key={key} delay={i * 120}>
                <div className="group relative h-[420px] rounded-2xl overflow-hidden shadow-lg
                                hover:shadow-2xl hover:-translate-y-2 transition-all duration-500 cursor-default">
                  <Image
                    src={image}
                    alt={t(`offer.${key}.title` as any)}
                    fill
                    sizes="(max-width: 768px) 100vw, 25vw"
                    className="object-cover transition-transform duration-700 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-navy-900/90 via-navy-900/40 to-transparent" />
                  <div className="absolute inset-x-0 bottom-0 p-6 text-white">
                    <h3 className="font-display font-bold text-xl mb-2 group-hover:text-brand-300 transition-colors">
                      {t(`offer.${key}.title` as any)}
                    </h3>
                    <p className="text-sm text-gray-200 leading-relaxed opacity-0 translate-y-3
                                  group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-500">
                      {t(`offer.${key}.desc` as any)}
                    </p>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Contact */}
      <section className="py-20 bg-white">
        <div className="max-w-4xl mx-auto px-4">
          <Reveal className="text-center mb-12">
            <h2 className="section-title">{t("contactTitle")}</h2>
          </Reveal>
          <div className="grid md:grid-cols-2 gap-6">
            {contacts.map(({ Icon, label, value, href }, i) => (
              <Reveal key={label} delay={i * 100}>
                <div className="card flex items-start gap-4 h-full hover:shadow-md transition-shadow">
                  <div className="w-10 h-10 rounded-xl bg-brand-50 flex items-center justify-center flex-shrink-0">
                    <Icon className="w-5 h-5 text-brand-600" />
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-0.5">{label}</div>
                    {href
                      ? <a href={href} className="text-navy-800 font-medium hover:text-brand-600 transition-colors">{value}</a>
                      : <div className="text-navy-800 font-medium">{value}</div>
                    }
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
