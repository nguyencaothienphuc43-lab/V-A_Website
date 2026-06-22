"use client";
import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { Search, Package, Plane, Ship, Truck, CheckCircle, Clock, AlertTriangle } from "lucide-react";
import type { Shipment } from "@/types";
import { STATUS_COLORS } from "@/types";
import { format } from "date-fns";

function TrackingContent({ locale }: { locale: string }) {
  const t = useTranslations("tracking");
  const searchParams = useSearchParams();
  const [query, setQuery] = useState(searchParams.get("q") || "");
  const [results, setResults] = useState<Shipment[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  useEffect(() => {
    const q = searchParams.get("q");
    if (q) { setQuery(q); handleTrack(q); }
  }, []);

  const handleTrack = async (trackingStr?: string) => {
    const q = (trackingStr ?? query).trim();
    if (!q) return;
    setLoading(true);
    setSearched(true);
    try {
      const nums = q.split(",").map((s) => s.trim()).filter(Boolean);
      const res = await fetch(`/api/tracking?numbers=${encodeURIComponent(nums.join(","))}`);
      const data = await res.json();
      setResults(data.shipments || []);
    } finally {
      setLoading(false);
    }
  };

  const ServiceIcon = ({ type }: { type: string }) =>
    type === "air" ? <Plane className="w-4 h-4" /> :
    type === "sea" ? <Ship className="w-4 h-4" /> :
    <Truck className="w-4 h-4" />;

  return (
    <div className="max-w-4xl mx-auto px-4 py-16">
      <div className="text-center mb-12">
        <p className="section-label mb-3">Track & Trace</p>
        <h1 className="section-title mb-4">{t("title")}</h1>
        <p className="text-gray-500">{t("multiple")}</p>
      </div>

      {/* Search */}
      <div className="flex gap-3 mb-12">
        <div className="flex-1 relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleTrack()}
            placeholder={t("placeholder")}
            className="input-field pl-11 font-mono"
          />
        </div>
        <button onClick={() => handleTrack()} disabled={loading}
          className="btn-primary min-w-[100px] justify-center">
          {loading ? (
            <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : t("track")}
        </button>
      </div>

      {/* Results */}
      {searched && !loading && results.length === 0 && (
        <div className="text-center py-16 card">
          <Package className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">{t("notFound")}</p>
        </div>
      )}

      <div className="space-y-6">
        {results.map((shipment) => (
          <div key={shipment.id} className="card shadow-sm hover:shadow-md transition-shadow">
            {/* Header */}
            <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
              <div>
                <div className="flex items-center gap-3 mb-1">
                  <span className="font-mono font-bold text-navy-800 text-lg">{shipment.tracking_number}</span>
                  <span className={`tracking-badge ${STATUS_COLORS[shipment.status]}`}>
                    {t(`statuses.${shipment.status}` as any)}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <ServiceIcon type={shipment.service_type} />
                  <span className="capitalize">{shipment.service_type} Freight</span>
                  {shipment.weight_kg && <span>· {shipment.weight_kg} kg</span>}
                </div>
              </div>
              {shipment.estimated_delivery && (
                <div className="text-right">
                  <div className="text-xs text-gray-400 mb-0.5">{t("estimatedDelivery")}</div>
                  <div className="font-semibold text-navy-800">
                    {format(new Date(shipment.estimated_delivery), "MMM d, yyyy")}
                  </div>
                </div>
              )}
            </div>

            {/* Route bar */}
            <div className="flex items-center gap-3 bg-gray-50 rounded-xl px-5 py-4 mb-6">
              <div className="text-center">
                <div className="text-xs text-gray-400 mb-0.5">From</div>
                <div className="font-semibold text-navy-800 text-sm">{shipment.origin_city}</div>
                <div className="text-xs text-gray-400">{shipment.origin_country}</div>
              </div>
              <div className="flex-1 flex items-center gap-1">
                <div className="flex-1 border-t-2 border-dashed border-gray-200" />
                <ServiceIcon type={shipment.service_type} />
                <div className="flex-1 border-t-2 border-dashed border-gray-200" />
              </div>
              <div className="text-center">
                <div className="text-xs text-gray-400 mb-0.5">To</div>
                <div className="font-semibold text-navy-800 text-sm">{shipment.dest_city}</div>
                <div className="text-xs text-gray-400">{shipment.dest_country}</div>
              </div>
            </div>

            {/* Timeline */}
            {shipment.tracking_events && shipment.tracking_events.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">{t("history")}</h4>
                <div className="space-y-0">
                  {shipment.tracking_events.sort((a, b) =>
                    new Date(b.event_time).getTime() - new Date(a.event_time).getTime()
                  ).map((event, i) => (
                    <div key={event.id} className="flex gap-4">
                      {/* Dot + line */}
                      <div className="flex flex-col items-center">
                        <div className={`w-3 h-3 rounded-full flex-shrink-0 mt-1 ${
                          i === 0 ? "bg-brand-500 ring-4 ring-brand-100" : "bg-gray-200"
                        }`} />
                        {i < shipment.tracking_events!.length - 1 && (
                          <div className="w-0.5 bg-gray-100 flex-1 my-1 min-h-[20px]" />
                        )}
                      </div>
                      {/* Content */}
                      <div className="pb-5">
                        <div className="font-medium text-sm text-navy-800">{event.status}</div>
                        <div className="text-sm text-gray-500 mt-0.5">
                          {locale === "vi" && event.description_vi ? event.description_vi : event.description}
                        </div>
                        <div className="text-xs text-gray-400 mt-1.5 flex items-center gap-1.5">
                          <Clock className="w-3 h-3" />
                          {event.location} · {format(new Date(event.event_time), "MMM d, yyyy HH:mm")}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export default function TrackingPage({ params }: { params: Promise<{ locale: string }> }) {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" /></div>}>
      <TrackingPageInner params={params} />
    </Suspense>
  );
}

async function TrackingPageInner({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  return <TrackingContent locale={locale} />;
}
