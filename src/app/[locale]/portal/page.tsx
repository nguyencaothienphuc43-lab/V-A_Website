import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Package, FileText, Clock } from "lucide-react";
import { STATUS_COLORS, type Shipment, type Quote } from "@/types";
import { format } from "date-fns";

export default async function PortalPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect(`/${locale}/auth/login`);

  const [{ data: profile }, { data: shipments }, { data: quotes }] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", user.id).single(),
    supabase.from("shipments").select("*, tracking_events(*)").eq("customer_id", user.id).order("created_at", { ascending: false }).limit(10),
    supabase.from("quotes").select("*").eq("customer_id", user.id).order("created_at", { ascending: false }).limit(10),
  ]);

  const l = (p: string) => `/${locale}${p}`;

  return (
    <div className="max-w-6xl mx-auto px-4 py-12">
      <div className="mb-10">
        <h1 className="font-display text-3xl font-bold text-navy-800">
          Welcome back, {profile?.full_name?.split(" ")[0] || "there"} 👋
        </h1>
        <p className="text-gray-500 mt-1">Here's an overview of your shipments and quotes.</p>
      </div>

      {/* Stat cards */}
      <div className="grid sm:grid-cols-3 gap-5 mb-10">
        {[
          { label: "Active Shipments", value: shipments?.filter(s => !["delivered","cancelled"].includes(s.status)).length ?? 0, Icon: Package, color: "text-brand-600 bg-brand-50" },
          { label: "Pending Quotes",   value: quotes?.filter(q => q.status === "pending").length ?? 0,     Icon: FileText, color: "text-amber-600 bg-amber-50"  },
          { label: "Total Shipments",  value: shipments?.length ?? 0,                                       Icon: Clock,    color: "text-indigo-600 bg-indigo-50" },
        ].map(({ label, value, Icon, color }) => (
          <div key={label} className="card flex items-center gap-4">
            <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${color}`}>
              <Icon className="w-5 h-5" />
            </div>
            <div>
              <div className="text-2xl font-bold font-display text-navy-800">{value}</div>
              <div className="text-sm text-gray-500">{label}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        {/* Shipments */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display font-bold text-lg text-navy-800">My Shipments</h2>
            <Link href={l("/tracking")} className="text-sm text-brand-600 hover:underline">Track →</Link>
          </div>
          <div className="space-y-3">
            {shipments && shipments.length > 0 ? shipments.map((s: Shipment) => (
              <div key={s.id} className="card py-4 px-5 flex items-center justify-between hover:shadow-sm transition-shadow">
                <div>
                  <div className="font-mono font-semibold text-navy-800 text-sm">{s.tracking_number}</div>
                  <div className="text-xs text-gray-400 mt-0.5">{s.origin_city} → {s.dest_city}</div>
                </div>
                <div className="text-right">
                  <span className={`tracking-badge ${STATUS_COLORS[s.status]}`}>
                    {s.status.replace("_", " ")}
                  </span>
                  {s.estimated_delivery && (
                    <div className="text-xs text-gray-400 mt-1">{format(new Date(s.estimated_delivery), "MMM d")}</div>
                  )}
                </div>
              </div>
            )) : (
              <div className="card text-center py-10 text-gray-400">
                <Package className="w-8 h-8 mx-auto mb-3 opacity-40" />
                No shipments yet.
              </div>
            )}
          </div>
        </div>

        {/* Quotes */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display font-bold text-lg text-navy-800">My Quotes</h2>
            <Link href={l("/quote")} className="text-sm text-brand-600 hover:underline">New quote →</Link>
          </div>
          <div className="space-y-3">
            {quotes && quotes.length > 0 ? quotes.map((q: Quote) => (
              <div key={q.id} className="card py-4 px-5 flex items-center justify-between hover:shadow-sm transition-shadow">
                <div>
                  <div className="font-medium text-navy-800 text-sm capitalize">{q.service_type} — {q.origin_city} → {q.dest_city}</div>
                  <div className="text-xs text-gray-400 mt-0.5">{format(new Date(q.created_at), "MMM d, yyyy")}</div>
                </div>
                <div className="text-right">
                  <span className={`tracking-badge ${
                    q.status === "pending" ? "bg-yellow-100 text-yellow-700" :
                    q.status === "quoted"  ? "bg-brand-100 text-brand-700"    :
                    q.status === "accepted"? "bg-green-100 text-green-700"  :
                    "bg-gray-100 text-gray-500"
                  }`}>{q.status}</span>
                  {q.final_price_usd && (
                    <div className="text-xs font-semibold text-brand-700 mt-1">${q.final_price_usd} USD</div>
                  )}
                </div>
              </div>
            )) : (
              <div className="card text-center py-10 text-gray-400">
                <FileText className="w-8 h-8 mx-auto mb-3 opacity-40" />
                No quotes yet.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
