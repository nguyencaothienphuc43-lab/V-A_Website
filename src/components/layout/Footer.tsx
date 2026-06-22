import Link from "next/link";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { Phone, Mail, MapPin, Clock, Plane, Ship, Truck } from "lucide-react";

export default function Footer({ locale }: { locale: string }) {
  const t = useTranslations("footer");
  const n = useTranslations("nav");
  const l = (path: string) => `/${locale}${path}`;

  return (
    <footer className="bg-navy-800 text-white">
      <div className="max-w-8xl mx-0 px-[15%] sm:px-10 lg:px-20">

        {/* Main grid */}
        <div className="py-10 grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-19">

          {/* Brand */}
          <div className="lg:col-span-1">
            <div className="inline-flex items-center gap-3 mb-4">
              <Image
                src="/logo4.png"
                alt="V&A Express — International Logistics"
                width={1000}
                height={900}
                className="h-14 w-auto"
              />
              <div className="flex flex-col leading-none text-white">
                <span className="font-display font-extrabold tracking-tight" style={{ fontSize: "18.4px" }}>EXPRESS</span>
                <span className="font-display font-medium tracking-wide" style={{ fontSize: "12px", marginTop: "3px" }}>International Logistics</span>
              </div>
            </div>
            <p className="font-display font-bold text-navy-0 leading-relaxed mb-6">{t("tagline")}</p>
            <div className="space-y-3 text-base text-navy-20">
              <div className="flex items-start gap-1.5">
                <MapPin className="w-5 h-5 mt-0.5 text-brand-400 flex-shrink-0" />
                <span>{t("address")}</span>
              </div>
              <div className="flex items-start gap-1.5">
                <MapPin className="w-5 h-5 mt-0.5 text-brand-400 flex-shrink-0" />
                <span>{t("office")}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Clock className="w-5 h-5 text-brand-400 flex-shrink-0" />
                <span>{t("hours")}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Phone className="w-5 h-5 text-brand-400 flex-shrink-0" />
                <a href="tel:+84909987068" className="hover:text-white transition-colors">(+84) 909 987 068</a>
              </div>
              <div className="flex items-center gap-1.5">
                <Mail className="w-5 h-5 text-brand-400 flex-shrink-0" />
                <a href="mailto:mkt@vaexpress.com.vn" className="hover:text-white transition-colors">mkt@vaexpress.com.vn</a>
              </div>
            </div>
          </div>

          {/* Services */}
          <div>
            <h4 className="font-display font-bold text-lg text-white mb-4">{t("services")}</h4>
            <ul className="space-y-6">
              {[
                { href: l("/services/air-freight"),  label: n("airFreight"),  Icon: Plane  },
                { href: l("/services/sea-freight"),  label: n("seaFreight"),  Icon: Ship   },
                { href: l("/services/road-freight"), label: n("roadFreight"), Icon: Truck  },
              ].map(({ href, label, Icon }) => (
                <li key={href}>
                  <Link href={href} className="flex items-center gap-5 text-base text-navy-5000 hover:text-brand-400 transition-colors group">
                    <Icon className="w-6 h-7 text-blue-400 group-hover:text-brand-400 transition-colors" />
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company */}
          <div>
            <h4 className="font-display font-bold text-lg text-white mb-4">{t("company")}</h4>
            <ul className="space-y-6">
              {[
                { href: l("/about"),    label: n("about")    },
                { href: l("/tracking"), label: n("tracking") },
                { href: l("/quote"),    label: n("quote")    },
              ].map(({ href, label }) => (
                <li key={href}>
                  <Link href={href} className="text-base text-navy-50 hover:text-brand-400 transition-colors">{label}</Link>
                </li>
              ))}
            </ul>
          </div>

          {/* CTA */}
          <div>
            <h4 className="font-display font-bold text-lg text-white mb-4">{t("contact")}</h4>
            <p className="text-base text-navy-50 mb-4 leading-relaxed">
              {t("ctaText")}
            </p>
            <Link href={l("/quote")} className="btn-primary text-base">{t("ctaBtn")}</Link>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-navy-700 py-5 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-sm text-cyan-200">
            © {new Date().getFullYear()} V&amp;A Express. {t("rights")}
          </p>
          <div className="flex gap-4">
            <Link href={l("/en")} className="text-sm text-cyan-200 hover:text-white transition-colors">EN</Link>
            <Link href={l("/vi")} className="text-sm text-cyan-200 hover:text-white transition-colors">VI</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
