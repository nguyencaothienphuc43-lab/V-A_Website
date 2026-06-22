"use client";
import { useState } from "react";
import { useTranslations } from "next-intl";
import { useParams } from "next/navigation";
import toast from "react-hot-toast";
import { Calculator, Send, Plane, Ship, Truck } from "lucide-react";
import { estimateQuote, type ServiceType } from "@/types";
import { createClient } from "@/lib/supabase/client";

const INCOTEMS = ["EXW","FCA","FAS","FOB","CFR","CIF","CPT","CIP","DPU","DAP","DDP"];

export default function QuotePage() {
  const t = useTranslations("quote");
  const params = useParams();
  const locale = params.locale as string;
  const supabase = createClient();

  const [form, setForm] = useState({
    contact_name: "", contact_email: "", contact_phone: "", company: "",
    service_type: "air" as ServiceType,
    origin_country: "", origin_city: "", dest_country: "", dest_city: "",
    cargo_type: "", weight_kg: "", volume_cbm: "", pieces: "",
    incoterm: "FOB", special_requirements: "",
  });

  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const estimate = form.weight_kg && form.volume_cbm
    ? estimateQuote(form.service_type, parseFloat(form.weight_kg), parseFloat(form.volume_cbm))
    : null;

  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const handleSubmit = async () => {
    if (!form.contact_name || !form.contact_email) {
      toast.error("Name and email are required."); return;
    }
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const { error } = await supabase.from("quotes").insert({
        ...form,
        customer_id: user?.id ?? null,
        weight_kg: form.weight_kg ? parseFloat(form.weight_kg) : null,
        volume_cbm: form.volume_cbm ? parseFloat(form.volume_cbm) : null,
        pieces: form.pieces ? parseInt(form.pieces) : null,
        estimated_price_usd: estimate?.total ?? null,
      });
      if (error) {
        console.error("Quote submission error:", error);
        throw error;
      }
      setSubmitted(true);
      toast.success(t("success"));
    } catch (err) {
      console.error("Full error:", err);
      toast.error(`Error: ${err instanceof Error ? err.message : "Something went wrong"}`);
    } finally {
      setLoading(false);
    }
  };

  const ServiceBtn = ({ type, Icon, label }: { type: ServiceType; Icon: any; label: string }) => (
    <button type="button" onClick={() => set("service_type", type)}
      className={`flex-1 flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${
        form.service_type === type
          ? "border-brand-500 bg-brand-50 text-brand-700"
          : "border-gray-200 text-gray-500 hover:border-gray-300"
      }`}>
      <Icon className="w-5 h-5" />
      <span className="text-xs font-semibold">{label}</span>
    </button>
  );

  if (submitted) return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <div className="w-16 h-16 rounded-full bg-brand-100 flex items-center justify-center mx-auto mb-6">
          <Send className="w-8 h-8 text-brand-600" />
        </div>
        <h2 className="font-display text-2xl font-bold text-navy-800 mb-3">Quote Request Sent!</h2>
        <p className="text-gray-500">{t("success")}</p>
      </div>
    </div>
  );

  return (
    <div className="max-w-5xl mx-auto px-4 py-16">
      <div className="text-center mb-12">
        <p className="section-label mb-3">Quotation</p>
        <h1 className="section-title mb-4">{t("title")}</h1>
        <p className="text-gray-500">{t("sub")}</p>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Form */}
        <div className="lg:col-span-2 space-y-8">

          {/* Contact info */}
          <div className="card">
            <h3 className="font-display font-semibold text-navy-800 mb-5">{t("contactInfo")}</h3>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">{t("name")} *</label>
                <input className="input-field" value={form.contact_name} onChange={e => set("contact_name", e.target.value)} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">{t("email")} *</label>
                <input type="email" className="input-field" value={form.contact_email} onChange={e => set("contact_email", e.target.value)} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">{t("phone")}</label>
                <input className="input-field" value={form.contact_phone} onChange={e => set("contact_phone", e.target.value)} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">{t("company")}</label>
                <input className="input-field" value={form.company} onChange={e => set("company", e.target.value)} />
              </div>
            </div>
          </div>

          {/* Shipment details */}
          <div className="card">
            <h3 className="font-display font-semibold text-navy-800 mb-5">{t("shipmentDetails")}</h3>

            {/* Service type */}
            <label className="block text-sm font-medium text-gray-700 mb-2">{t("serviceType")}</label>
            <div className="flex gap-3 mb-5">
              <ServiceBtn type="air"  Icon={Plane} label="Air Freight"  />
              <ServiceBtn type="sea"  Icon={Ship}  label="Sea Freight"  />
              <ServiceBtn type="road" Icon={Truck} label="Road Freight" />
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Origin Country</label>
                <input placeholder="e.g. Vietnam" className="input-field" value={form.origin_country}
                  onChange={e => set("origin_country", e.target.value)} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Origin City</label>
                <input placeholder="e.g. Ho Chi Minh City" className="input-field" value={form.origin_city}
                  onChange={e => set("origin_city", e.target.value)} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Destination Country</label>
                <input placeholder="e.g. United States" className="input-field" value={form.dest_country}
                  onChange={e => set("dest_country", e.target.value)} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Destination City</label>
                <input placeholder="e.g. Los Angeles" className="input-field" value={form.dest_city}
                  onChange={e => set("dest_city", e.target.value)} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">{t("cargoType")}</label>
                <input placeholder="e.g. Electronics, Garments…" className="input-field" value={form.cargo_type}
                  onChange={e => set("cargo_type", e.target.value)} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">{t("incoterm")}</label>
                <select className="input-field" value={form.incoterm} onChange={e => set("incoterm", e.target.value)}>
                  {INCOTEMS.map(i => <option key={i}>{i}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">{t("weight")} (kg)</label>
                <input type="number" min="0" step="0.1" className="input-field" value={form.weight_kg}
                  onChange={e => set("weight_kg", e.target.value)} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">{t("volume")} (CBM)</label>
                <input type="number" min="0" step="0.001" className="input-field" value={form.volume_cbm}
                  onChange={e => set("volume_cbm", e.target.value)} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">{t("pieces")}</label>
                <input type="number" min="1" className="input-field" value={form.pieces}
                  onChange={e => set("pieces", e.target.value)} />
              </div>
            </div>

            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-1.5">{t("special")}</label>
              <textarea rows={3} className="input-field resize-none" value={form.special_requirements}
                onChange={e => set("special_requirements", e.target.value)} />
            </div>
          </div>
        </div>

        {/* Sidebar: estimate + submit */}
        <div className="space-y-5">

          {/* Cost estimate */}
          <div className="card border-brand-100 bg-brand-50/50 sticky top-24">
            <div className="flex items-center gap-2 mb-5">
              <Calculator className="w-5 h-5 text-brand-600" />
              <h3 className="font-display font-semibold text-navy-800">{t("estimatedCost")}</h3>
            </div>

            {estimate ? (
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Base rate</span>
                  <span className="font-medium">${estimate.baseRate}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Fuel surcharge</span>
                  <span className="font-medium">${estimate.fuelSurcharge}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Handling</span>
                  <span className="font-medium">${estimate.handlingFee}</span>
                </div>
                <div className="border-t border-brand-200 pt-3 flex justify-between">
                  <span className="font-semibold text-navy-800">Estimate Total</span>
                  <span className="font-bold text-brand-700 text-lg">${estimate.total} USD</span>
                </div>
                <p className="text-xs text-gray-400 leading-relaxed">{t("disclaimer")}</p>
                <div className="bg-brand-100 rounded-lg px-3 py-2 text-xs text-brand-700 font-medium">
                  Transit: {estimate.transit}
                </div>
              </div>
            ) : (
              <p className="text-sm text-gray-400">Enter weight and volume to see an estimate.</p>
            )}
          </div>

          <button onClick={handleSubmit} disabled={loading}
            className="btn-primary w-full justify-center py-4">
            {loading
              ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              : <><Send className="w-4 h-4" /> {t("submit")}</>
            }
          </button>
        </div>
      </div>
    </div>
  );
}
