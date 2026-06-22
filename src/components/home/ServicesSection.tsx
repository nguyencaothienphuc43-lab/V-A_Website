import Link from "next/link";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { Plane, Ship, Truck, ArrowRight } from "lucide-react";
import Reveal from "@/components/ui/Reveal";

export default function ServicesSection({ locale }: { locale: string }) {
  const t = useTranslations("services");
  const l = (p: string) => `/${locale}${p}`;

  const services = [
    {
      key: "air",
      href: l("/services/air-freight"),
      Icon: Plane,
      image: "/images/air.jpg",
      detail: "Express · Standard · Charter",
    },
    {
      key: "sea",
      href: l("/services/sea-freight"),
      Icon: Ship,
      image: "/images/sea.jpg",
      detail: "FCL · LCL · Door-to-door",
    },
    {
      key: "road",
      href: l("/services/road-freight"),
      Icon: Truck,
      image: "/images/road.jpg",
      detail: "FTL · LTL · Cross-border",
    },
  ] as const;

  return (
    <section className="relative py-28 overflow-hidden">
      {/* Looping port timelapse background */}
      <video
        autoPlay
        muted
        loop
        playsInline
        src="/videos/port-timelapse.mp4"
        className="absolute inset-0 w-full h-full object-cover"
      />
      {/* Light overlay keeps the cards and text readable over the clip */}
      <div className="absolute inset-0 bg-white/85" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        <Reveal className="text-center mb-20">
          <p className="section-label text-sm mb-4">{t("title")}</p>
          <h2 className="text-4xl md:text-5xl font-display font-bold text-navy-800 leading-tight">{t("sub")}</h2>
        </Reveal>

        <div className="grid md:grid-cols-3 gap-10">
          {services.map(({ key, href, Icon, image, detail }, i) => (
            <Reveal key={key} delay={i * 150}>
              <Link href={href}
                className="group relative block bg-white rounded-2xl shadow-md border border-gray-100
                           hover:shadow-xl transition-all duration-300 hover:-translate-y-1.5 overflow-hidden">

                {/* Photo header */}
                <div className="relative h-64 overflow-hidden">
                  <Image
                    src={image}
                    alt={t(`${key}.name` as any)}
                    fill
                    sizes="(max-width: 768px) 100vw, 33vw"
                    className="object-cover transition-transform duration-500 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-navy-900/60 via-transparent to-transparent" />
                </div>

                <div className="p-8">
                  {/* Icon now sits next to the title */}
                  <div className="flex items-center gap-3 mb-4">
                    <span className="w-12 h-12 rounded-xl bg-brand-500 flex items-center justify-center shadow-md shrink-0
                                     transition-transform duration-300 group-hover:scale-110">
                      <Icon className="w-6 h-6 text-white" />
                    </span>
                    <h3 className="font-display font-bold text-2xl text-navy-800 group-hover:text-brand-600 transition-colors">
                      {t(`${key}.name` as any)}
                    </h3>
                  </div>
                  <p className="text-gray-500 text-base leading-relaxed mb-6">
                    {t(`${key}.desc` as any)}
                  </p>

                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-400">{detail}</span>
                    <ArrowRight className="w-5 h-5 text-gray-300 group-hover:text-brand-500 group-hover:translate-x-1 transition-all" />
                  </div>
                </div>

                {/* Hover accent */}
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-brand-500 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300" />
              </Link>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
