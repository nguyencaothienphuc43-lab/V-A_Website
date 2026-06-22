"use client";
import { useState, useRef, useEffect, useCallback } from "react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import Image from "next/image";
import { Plane, Package, ArrowRight } from "lucide-react";

export default function Hero({ locale }: { locale: string }) {
  const t = useTranslations("hero");
  const [trackValue, setTrackValue] = useState("");
  const l = (p: string) => `/${locale}${p}`;

  const planeRef = useRef<SVGSVGElement>(null);
  const [planeRotation, setPlaneRotation] = useState(0);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    const el = planeRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const dx = e.clientX - cx;
    const dy = e.clientY - cy;
    // atan2 gives angle from positive X axis; Lucide Plane icon faces ~-45deg by default
    const angle = Math.atan2(dy, dx) * (180 / Math.PI) + 45;
    setPlaneRotation(angle);
  }, []);

  useEffect(() => {
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, [handleMouseMove]);

  const routes = [
    { label: t("routeAir"),  sub: t("routeAirDays")  },
    { label: t("routeSea"),  sub: t("routeSeaDays")  },
    { label: t("routeRoad"), sub: t("routeRoadDays") },
  ];

  // Endpoints for the pulsing city pins (match the arc start/end coords below)
  const pins: [number, number, string][] = [
    [110, 480, "#DC9A8A"], [1520, 170, "#DC9A8A"],
    [70, 300, "#F59E0B"],  [1500, 360, "#F59E0B"],
    [180, 580, "#6480C7"], [1560, 470, "#6480C7"],
  ];

  return (
    <section className="relative bg-navy-800 text-white overflow-hidden min-h-[calc(100vh-115px)] flex items-center">
      {/* Port photo background */}
      <Image
        src="/images/hero.jpg"
        alt="Container ships at port"
        fill
        priority
        className="object-cover"
      />
      {/* Dark overlay so text stays readable */}
      <div className="absolute inset-0 opacity-[0.88] bg-gradient-to-br from-navy-900/95 via-navy-800/85 to-navy-900/70" />

      {/* Animated route lines — flowing dashes, pulsing pins, planes in flight */}
      <div className="absolute inset-0 opacity-90 pointer-events-none">
        <svg viewBox="0 0 1606 700" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full object-cover">
          <path id="heroArc1" d="M 110 480 Q 480 120 900 250 T 1520 170" stroke="#DC9A8A" strokeWidth="1.6"
            fill="none" className="route-flow" />
          <path id="heroArc2" d="M 70 300 Q 430 190 780 300 T 1500 360" stroke="#F59E0B" strokeWidth="1.5"
            fill="none" className="route-flow" style={{ animationDuration: "4.6s" }} />
          <path id="heroArc3" d="M 180 580 Q 680 470 1060 520 T 1560 470" stroke="#6480C7" strokeWidth="1.3"
            fill="none" className="route-flow" style={{ animationDuration: "5.6s" }} />

          {/* Pulsing origin / destination pins */}
          {pins.map(([cx, cy, c], i) => (
            <circle key={i} cx={cx} cy={cy} r="5" fill={c}
              className="route-pin-pulse" style={{ animationDelay: `${i * 0.3}s` }} />
          ))}

          {/* Little aircraft tracing each arc */}
          {["#heroArc1", "#heroArc2", "#heroArc3"].map((p, i) => (
            <path key={p} d="M0,-3.5 L10,0 L0,3.5 L2.5,0 Z" fill="#ffffff" opacity="0.95">
              <animateMotion dur={`${7 + i * 1.6}s`} repeatCount="indefinite" rotate="auto">
                <mpath href={p} />
              </animateMotion>
            </path>
          ))}
        </svg>
      </div>

      <div className="relative w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Intro */}
        <div className="max-w-4xl animate-slide-up">
          <h1 className="font-display text-5xl md:text-6xl lg:text-7xl font-bold leading-[1.08] mb-8">
            {t("tagline").split(",")[0]},
            <br />
            <span className="text-brand-300">{t("tagline").split(",")[1]}</span>
          </h1>

          <p className="text-navy-150 text-xl md:text-2xl leading-relaxed mb-10 max-w-2xl">{t("sub")}</p>

          <div className="flex flex-wrap gap-4">
            <Link href={l("/quote")} className="btn-primary text-lg px-8 py-4">
              {t("cta_quote")} <ArrowRight className="w-5 h-5" />
            </Link>
            {/* Track Shipment — frosted translucent-white fill */}
            <Link
              href={l("/tracking")}
              className="inline-flex items-center gap-2 bg-white/40 hover:bg-white/60 backdrop-blur-sm
                         text-white border border-white/40 font-semibold rounded-lg text-lg px-8 py-4
                         transition-all duration-200 hover:-translate-y-0.5
                         focus:outline-none focus:ring-2 focus:ring-white/60 focus:ring-offset-2 focus:ring-offset-navy-800"
            >
              <Package className="w-5 h-5" /> {t("cta_track")}
            </Link>
          </div>
        </div>

        {/* Quick Track — centered card, sub-text anchored at the bottom */}
        <div
          className="animate-fade-in mt-8 bg-brand-500/80 rounded-3xl px-7 py-9 lg:px-12 lg:py-10
                     shadow-2xl shadow-brand-900/50 ring-1 ring-brand-300/40 text-center"
        >
          {/* Title */}
          <div className="flex items-center justify-center gap-3">
            <Plane
              ref={planeRef}
              className="w-10 h-10 text-white transition-transform duration-100 ease-out"
              style={{ transform: `rotate(${planeRotation}deg)` }}
            />
            <h2 className="font-display font-bold text-white text-3xl lg:text-4xl">{t("quickTrack")}</h2>
          </div>

          {/* Input + Track button, centered */}
          <div className="flex gap-4 mt-7 max-w-2xl mx-auto">
            <input
              type="text"
              value={trackValue}
              onChange={(e) => setTrackValue(e.target.value)}
              placeholder="VAX-20240001"
              className="flex-1 min-w-0 bg-white/15 border-2 border-white/70 rounded-xl px-6 py-5
                         text-white placeholder-white/60 font-mono text-xl text-center
                         focus:outline-none focus:border-white focus:ring-2 focus:ring-white/60 transition-colors"
            />
            <Link
              href={trackValue ? `${l("/tracking")}?q=${encodeURIComponent(trackValue)}` : l("/tracking")}
              className="inline-flex items-center justify-center bg-white text-brand-600 hover:bg-navy-50
                         font-bold rounded-xl whitespace-nowrap text-xl px-6 py-5 shadow-sm
                         transition-colors focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-brand-500"
            >
              {t("trackBtn")}
            </Link>
          </div>

          {/* Route highlights, centered */}
          <div className="flex items-center justify-center gap-8 lg:gap-16 mt-4">
            {routes.map((s) => (
              <div key={s.label} className="text-center whitespace-nowrap">
                <div className="text-lg font-bold text-white">{s.label}</div>
                <div className="text-base text-white/80 mt-1">{s.sub}</div>
              </div>
            ))}
          </div>

          {/* Sub-text at the bottom of the outlay */}
          <p className="text-base text-white/85 mt-7">{t("trackHint")}</p>
        </div>
      </div>
    </section>
  );
}
