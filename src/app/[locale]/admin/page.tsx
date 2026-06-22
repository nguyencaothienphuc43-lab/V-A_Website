"use client";
import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import toast from "react-hot-toast";
import {
  Package, FileText, Plus, RefreshCw, ChevronDown, ChevronUp,
  Plane, Ship, Truck, Users, LayoutDashboard
} from "lucide-react";
import type { Shipment, Quote, ShipmentStatus } from "@/types";
import { STATUS_COLORS } from "@/types";
import { format } from "date-fns";

type AdminTab = "dashboard" | "shipments" | "quotes";

export default function AdminPage() {
  const params = useParams();
  const locale = params.locale as string;
  const supabase = createClient();

  const [tab, setTab] = useState<AdminTab>("dashboard");
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedShipment, setExpandedShipment] = useState<string | null>(null);

  // Add shipment modal
  const [showAddShipment, setShowAddShipment] = useState(false);
  const [newShipment, setNewShipment] = useState({
    tracking_number: "", service_type: "air", origin_country: "Vietnam", origin_city: "",
    dest_country: "", dest_city: "", description: "", weight_kg: "", status: "pending",
    customer_name: "", customer_email: "", estimated_delivery: "",
  });

  // Add tracking event modal
  const [showAddEvent, setShowAddEvent] = useState<string | null>(null);
  const [newEvent, setNewEvent] = useState({ location: "", status: "", description: "", description_vi: "" });

  const load = useCallback(async () => {
    setLoading(true);
    const [{ data: s }, { data: q }] = await Promise.all([
      supabase.from("shipments").select("*, tracking_events(*)").order("created_at", { ascending: false }),
      supabase.from("quotes").select("*").order("created_at", { ascending: false }),
    ]);
    setShipments(s || []);
    setQuotes(q || []);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();

    // Subscribe to real-time changes in quotes
    const subscription = supabase
      .channel('quotes-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'quotes' },
        (payload) => {
          console.log('Quote changed:', payload);
          load(); // Reload all quotes when any change happens
        }
      )
      .subscribe();

    // Cleanup subscription on unmount
    return () => {
      supabase.removeChannel(subscription);
    };
  }, [load]);

  const handleAddShipment = async () => {
    const { error } = await supabase.from("shipments").insert({
      ...newShipment,
      weight_kg: newShipment.weight_kg ? parseFloat(newShipment.weight_kg) : null,
    });
    if (error) { toast.error(error.message); return; }
    toast.success("Shipment created.");
    setShowAddShipment(false);
    setNewShipment({ tracking_number: "", service_type: "air", origin_country: "Vietnam", origin_city: "",
      dest_country: "", dest_city: "", description: "", weight_kg: "", status: "pending",
      customer_name: "", customer_email: "", estimated_delivery: "" });
    load();
  };

  const handleUpdateStatus = async (id: string, status: ShipmentStatus) => {
    await supabase.from("shipments").update({ status, updated_at: new Date().toISOString() }).eq("id", id);
    toast.success("Status updated.");
    load();
  };

  const handleAddEvent = async (shipmentId: string) => {
    const { error } = await supabase.from("tracking_events").insert({ shipment_id: shipmentId, ...newEvent });
    if (error) { toast.error(error.message); return; }
    toast.success("Event added.");
    setShowAddEvent(null);
    setNewEvent({ location: "", status: "", description: "", description_vi: "" });
    load();
  };

  const handleQuoteStatus = async (id: string, status: string, price?: number) => {
    await supabase.from("quotes").update({ status, ...(price ? { final_price_usd: price } : {}) }).eq("id", id);
    toast.success("Quote updated.");
    load();
  };

  const stats = {
    total: shipments.length,
    active: shipments.filter(s => !["delivered","cancelled"].includes(s.status)).length,
    pendingQuotes: quotes.filter(q => q.status === "pending").length,
    delivered: shipments.filter(s => s.status === "delivered").length,
  };

  const TabBtn = ({ id, Icon, label }: { id: AdminTab; Icon: any; label: string }) => (
    <button onClick={() => setTab(id)}
      className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
        tab === id ? "bg-navy-800 text-white" : "text-gray-600 hover:bg-gray-100"
      }`}>
      <Icon className="w-4 h-4" />{label}
    </button>
  );

  return (
    <div className="max-w-7xl mx-auto px-4 py-10">
      <div className="flex items-center justify-between mb-8">
        <h1 className="font-display text-2xl font-bold text-navy-800">Admin Dashboard</h1>
        <button onClick={load} className="btn-ghost text-sm">
          <RefreshCw className="w-4 h-4" /> Refresh
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-8 bg-gray-50 p-1.5 rounded-xl w-fit">
        <TabBtn id="dashboard" Icon={LayoutDashboard} label="Dashboard" />
        <TabBtn id="shipments" Icon={Package}         label={`Shipments (${shipments.length})`} />
        <TabBtn id="quotes"    Icon={FileText}         label={`Quotes (${quotes.length})`} />
      </div>

      {/* Dashboard tab */}
      {tab === "dashboard" && (
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {[
            { label: "Total Shipments", value: stats.total,        color: "bg-indigo-50 text-indigo-600" },
            { label: "Active",          value: stats.active,       color: "bg-brand-50 text-brand-600"    },
            { label: "Pending Quotes",  value: stats.pendingQuotes, color: "bg-amber-50 text-amber-600"  },
            { label: "Delivered",       value: stats.delivered,    color: "bg-green-50 text-green-600"  },
          ].map(({ label, value, color }) => (
            <div key={label} className="card">
              <div className={`text-3xl font-display font-bold mb-1 ${color.split(" ")[1]}`}>{value}</div>
              <div className="text-sm text-gray-500">{label}</div>
            </div>
          ))}
        </div>
      )}

      {/* Shipments tab */}
      {tab === "shipments" && (
        <div>
          <div className="flex justify-between items-center mb-5">
            <h2 className="font-semibold text-navy-800">Shipments</h2>
            <button onClick={() => setShowAddShipment(true)} className="btn-primary text-sm py-2">
              <Plus className="w-4 h-4" /> Add Shipment
            </button>
          </div>

          {loading ? <div className="text-center py-20 text-gray-400">Loading…</div> : (
            <div className="space-y-3">
              {shipments.map((s) => (
                <div key={s.id} className="card">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-navy-100 flex items-center justify-center">
                        {s.service_type === "air" ? <Plane className="w-4 h-4 text-navy-600" /> :
                         s.service_type === "sea" ? <Ship  className="w-4 h-4 text-navy-600" /> :
                         <Truck className="w-4 h-4 text-navy-600" />}
                      </div>
                      <div>
                        <div className="font-mono font-semibold text-navy-800 text-sm">{s.tracking_number}</div>
                        <div className="text-xs text-gray-400">{s.origin_city} → {s.dest_city} · {s.weight_kg}kg</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <select value={s.status}
                        onChange={e => handleUpdateStatus(s.id, e.target.value as ShipmentStatus)}
                        className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 bg-white focus:outline-none focus:ring-1 focus:ring-brand-400">
                        {["pending","picked_up","in_transit","customs","out_for_delivery","delivered","exception","cancelled"].map(st => (
                          <option key={st} value={st}>{st.replace("_"," ")}</option>
                        ))}
                      </select>
                      <button onClick={() => setShowAddEvent(s.id)}
                        className="text-xs text-brand-600 hover:text-brand-700 font-medium whitespace-nowrap">
                        + Event
                      </button>
                      <button onClick={() => setExpandedShipment(expandedShipment === s.id ? null : s.id)}
                        className="text-gray-400 hover:text-gray-600">
                        {expandedShipment === s.id ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Expanded events */}
                  {expandedShipment === s.id && (
                    <div className="mt-4 pt-4 border-t border-gray-100">
                      {s.tracking_events && s.tracking_events.length > 0 ? (
                        <div className="space-y-2">
                          {s.tracking_events.sort((a, b) =>
                            new Date(b.event_time).getTime() - new Date(a.event_time).getTime()
                          ).map((e) => (
                            <div key={e.id} className="flex items-start gap-3 text-xs">
                              <div className="w-1.5 h-1.5 rounded-full bg-brand-400 mt-1.5 flex-shrink-0" />
                              <div>
                                <span className="font-medium text-navy-700">{e.status}</span>
                                <span className="text-gray-400 mx-1">·</span>
                                <span className="text-gray-500">{e.location}</span>
                                <span className="text-gray-400 mx-1">·</span>
                                <span className="text-gray-400">{format(new Date(e.event_time), "MMM d HH:mm")}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-xs text-gray-400">No tracking events yet.</p>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Quotes tab */}
      {tab === "quotes" && (
        <div className="space-y-3">
          {quotes.map((q) => (
            <div key={q.id} className="card">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <div className="font-medium text-navy-800">{q.contact_name} · {q.company}</div>
                  <div className="text-sm text-gray-500">{q.contact_email} · {q.contact_phone}</div>
                  <div className="text-xs text-gray-400 mt-1 capitalize">
                    {q.service_type} · {q.origin_city} → {q.dest_city} · {q.weight_kg}kg
                  </div>
                  {q.special_requirements && (
                    <div className="text-xs text-gray-400 mt-1">Note: {q.special_requirements}</div>
                  )}
                  {q.estimated_price_usd && (
                    <div className="text-xs text-brand-600 mt-1">Client estimate: ${q.estimated_price_usd}</div>
                  )}
                </div>
                <div className="flex flex-col items-end gap-2">
                  <span className={`tracking-badge ${
                    q.status === "pending"  ? "bg-yellow-100 text-yellow-700" :
                    q.status === "quoted"   ? "bg-brand-100 text-brand-700"    :
                    q.status === "accepted" ? "bg-green-100 text-green-700"  :
                    "bg-gray-100 text-gray-500"
                  }`}>{q.status}</span>
                  <div className="text-xs text-gray-400">{format(new Date(q.created_at), "MMM d, yyyy")}</div>
                  {q.status === "pending" && (
                    <div className="flex gap-2 mt-1">
                      <button onClick={() => handleQuoteStatus(q.id, "reviewing")}
                        className="text-xs bg-indigo-50 text-indigo-600 px-2.5 py-1 rounded-lg font-medium hover:bg-indigo-100 transition-colors">
                        Review
                      </button>
                      <button onClick={() => {
                        const price = parseFloat(prompt("Enter final price (USD):") || "0");
                        if (price > 0) handleQuoteStatus(q.id, "quoted", price);
                      }} className="text-xs bg-brand-50 text-brand-600 px-2.5 py-1 rounded-lg font-medium hover:bg-brand-100 transition-colors">
                        Send Quote
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Shipment Modal */}
      {showAddShipment && (
        <Modal title="Add Shipment" onClose={() => setShowAddShipment(false)}>
          <div className="grid sm:grid-cols-2 gap-4">
            {[
              { label: "Tracking Number *", key: "tracking_number" },
              { label: "Customer Name",     key: "customer_name"  },
              { label: "Customer Email",    key: "customer_email" },
              { label: "Origin City",       key: "origin_city"    },
              { label: "Origin Country",    key: "origin_country" },
              { label: "Dest City",         key: "dest_city"      },
              { label: "Dest Country",      key: "dest_country"   },
              { label: "Weight (kg)",       key: "weight_kg", type: "number" },
              { label: "Est. Delivery",     key: "estimated_delivery", type: "date" },
            ].map(({ label, key, type = "text" }) => (
              <div key={key}>
                <label className="block text-xs font-medium text-gray-600 mb-1">{label}</label>
                <input type={type} className="input-field text-sm py-2"
                  value={(newShipment as any)[key]}
                  onChange={e => setNewShipment(f => ({ ...f, [key]: e.target.value }))} />
              </div>
            ))}
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Service Type</label>
              <select className="input-field text-sm py-2" value={newShipment.service_type}
                onChange={e => setNewShipment(f => ({ ...f, service_type: e.target.value }))}>
                <option value="air">Air Freight</option>
                <option value="sea">Sea Freight</option>
                <option value="road">Road Freight</option>
              </select>
            </div>
          </div>
          <div className="flex justify-end gap-3 mt-5">
            <button onClick={() => setShowAddShipment(false)} className="btn-ghost">Cancel</button>
            <button onClick={handleAddShipment} className="btn-primary text-sm">Create Shipment</button>
          </div>
        </Modal>
      )}

      {/* Add Event Modal */}
      {showAddEvent && (
        <Modal title="Add Tracking Event" onClose={() => setShowAddEvent(null)}>
          <div className="space-y-4">
            {[
              { label: "Location *",          key: "location",        placeholder: "e.g. Ho Chi Minh City, VN" },
              { label: "Status *",            key: "status",          placeholder: "e.g. Shipment picked up"   },
              { label: "Description (EN)",    key: "description",     placeholder: "English description"       },
              { label: "Description (VI)",    key: "description_vi",  placeholder: "Mô tả tiếng Việt"          },
            ].map(({ label, key, placeholder }) => (
              <div key={key}>
                <label className="block text-xs font-medium text-gray-600 mb-1">{label}</label>
                <input className="input-field text-sm py-2" placeholder={placeholder}
                  value={(newEvent as any)[key]}
                  onChange={e => setNewEvent(f => ({ ...f, [key]: e.target.value }))} />
              </div>
            ))}
          </div>
          <div className="flex justify-end gap-3 mt-5">
            <button onClick={() => setShowAddEvent(null)} className="btn-ghost">Cancel</button>
            <button onClick={() => handleAddEvent(showAddEvent)} className="btn-primary text-sm">Add Event</button>
          </div>
        </Modal>
      )}
    </div>
  );
}

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <h3 className="font-display font-semibold text-navy-800">{title}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none">×</button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}
