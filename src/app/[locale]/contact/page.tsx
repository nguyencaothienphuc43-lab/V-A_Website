"use client";
import { useState } from "react";
import { useTranslations } from "next-intl";
import toast from "react-hot-toast";
import { Send, MapPin, Phone, Mail, Clock } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export default function ContactPage() {
  const t = useTranslations("contact");
  const supabase = createClient();

  const [form, setForm] = useState({ name: "", email: "", phone: "", message: "" });
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.email || !form.message) {
      toast.error("Email and message are required.");
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.from("contact_messages").insert({
        name: form.name || null,
        email: form.email,
        phone: form.phone || null,
        message: form.message,
      });
      if (error) throw error;
      setSubmitted(true);
      toast.success(t("success"));
    } catch (err) {
      console.error("Contact submission error:", err);
      toast.error(`${t("error")} ${err instanceof Error ? `(${err.message})` : ""}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      {/* Header */}
      <div className="text-center mb-12">
        <p className="section-label mb-3">{t("label")}</p>
        <h1 className="section-title mb-4">{t("title")}</h1>
        <p className="text-gray-500 max-w-xl mx-auto">{t("sub")}</p>
      </div>

      <div className="grid lg:grid-cols-[1fr_360px] gap-8 items-start">
        {/* Form */}
        <div className="card">
          {submitted ? (
            <div className="text-center py-16">
              <div className="w-16 h-16 rounded-full bg-brand-100 flex items-center justify-center mx-auto mb-6">
                <Send className="w-8 h-8 text-brand-600" />
              </div>
              <h2 className="font-display text-2xl font-bold text-navy-800 mb-3">{t("send")}</h2>
              <p className="text-gray-500 max-w-sm mx-auto">{t("success")}</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">{t("name")}</label>
                <input className="input-field" value={form.name} onChange={(e) => set("name", e.target.value)} autoComplete="name" />
              </div>
              <div className="grid sm:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">{t("email")} *</label>
                  <input type="email" required className="input-field" value={form.email}
                    onChange={(e) => set("email", e.target.value)} autoComplete="email" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">{t("phone")}</label>
                  <input type="tel" className="input-field" value={form.phone}
                    onChange={(e) => set("phone", e.target.value)} autoComplete="tel" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">{t("message")} *</label>
                <textarea rows={6} required className="input-field resize-none" value={form.message}
                  onChange={(e) => set("message", e.target.value)} />
              </div>
              <button type="submit" disabled={loading} className="btn-primary w-full justify-center py-4">
                {loading
                  ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  : <><Send className="w-4 h-4" /> {t("send")}</>}
              </button>
            </form>
          )}
        </div>

        {/* Info card — harmonised navy panel */}
        <aside className="rounded-2xl bg-navy-800 text-white p-8 shadow-lg">
          <h2 className="font-display text-2xl font-bold mb-6">{t("infoTitle")}</h2>
          <ul className="space-y-5 text-sm">
            <li className="flex gap-3">
              <MapPin className="w-5 h-5 text-brand-300 shrink-0 mt-0.5" />
              <span className="text-navy-100 leading-relaxed">{t("address")}</span>
            </li>
            <li className="flex gap-3">
              <MapPin className="w-5 h-5 text-brand-300 shrink-0 mt-0.5" />
              <span className="text-navy-100 leading-relaxed">{t("office")}</span>
            </li>
            <li className="flex gap-3 items-center">
              <Phone className="w-5 h-5 text-brand-300 shrink-0" />
              <a href={`tel:${t("phoneValue")}`} className="text-navy-100 hover:text-white transition-colors">{t("phoneValue")}</a>
            </li>
            <li className="flex gap-3 items-center">
              <Mail className="w-5 h-5 text-brand-300 shrink-0" />
              <a href={`mailto:${t("emailValue")}`} className="text-navy-100 hover:text-white transition-colors">{t("emailValue")}</a>
            </li>
            <li className="flex gap-3 items-center">
              <Clock className="w-5 h-5 text-brand-300 shrink-0" />
              <span className="text-navy-100">{t("hours")}</span>
            </li>
          </ul>
        </aside>
      </div>
    </div>
  );
}
