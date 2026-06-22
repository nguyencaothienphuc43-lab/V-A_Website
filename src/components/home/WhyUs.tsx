import Image from "next/image";
import { useTranslations } from "next-intl";
import CountUp from "@/components/ui/CountUp";
import Reveal from "@/components/ui/Reveal";

// Statistics from vaexpress.com.vn — each stat sits on its own embedded photo
const STATS = [
  { key: "packages",  value: 7255, suffix: "+", image: "/images/road.jpg" },
  { key: "tons",      value: 8500, suffix: "+", image: "/images/sea.jpg" },
  { key: "km",        value: 5348, suffix: "",  image: "/images/air.jpg" },
  { key: "customers", value: 3125, suffix: "+", image: "/images/cta.jpg" },
] as const;

export default function WhyUs() {
  const t = useTranslations("whyUs");

  return (
    <section className="relative py-24 text-white overflow-hidden">
      {/* Warehouse photo background */}
      <Image
        src="/images/warehouse.jpg"
        alt="Warehouse operations"
        fill
        sizes="100vw"
        className="object-cover"
      />
      <div className="absolute inset-0 bg-navy-900/90" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        <Reveal className="text-center mb-16">
          <h2 className="font-display text-3xl md:text-4xl font-bold text-white">{t("title")}</h2>
        </Reveal>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
          {STATS.map(({ key, value, suffix, image }, i) => (
            <Reveal key={key} delay={i * 120}>
              <div className="group relative h-60 rounded-2xl overflow-hidden border border-white/10 shadow-xl">
                {/* Embedded image */}
                <Image
                  src={image}
                  alt=""
                  fill
                  sizes="(max-width: 1024px) 50vw, 25vw"
                  className="object-cover transition-transform duration-500 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-navy-900/95 via-navy-900/65 to-navy-900/25
                                group-hover:from-brand-900/90 group-hover:via-navy-900/60 transition-colors duration-300" />

                {/* Number + labels anchored to the bottom */}
                <div className="relative h-full flex flex-col justify-end p-5 text-center">
                  <div className="font-display text-4xl font-bold text-white mb-1">
                    <CountUp end={value} suffix={suffix} />
                  </div>
                  <div className="text-sm font-semibold text-brand-300 mb-1">
                    {t(`${key}.label` as any)}
                  </div>
                  <div className="text-xs text-navy-100">
                    {t(`${key}.desc` as any)}
                  </div>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
