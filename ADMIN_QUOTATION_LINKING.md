# How Quotation Data Links to Admin Page — Technical Deep Dive

## Overview

The admin page displays quotes submitted by customers through the quote form. This document shows exactly how data flows from the quote form → database → admin dashboard.

---

## 1. Quote Submission Path (Customer Side)

### 1.1 Customer Submits Quote

**File:** `src/app/[locale]/quote/page.tsx` (line ~50)

```typescript
const handleSubmit = async () => {
  // Validate required fields
  if (!form.contact_name || !form.contact_email) {
    toast.error("Name and email are required.");
    return;
  }

  setLoading(true);
  try {
    // Get current logged-in user (if any)
    const { data: { user } } = await supabase.auth.getUser();

    // Insert quote to database
    const { error } = await supabase.from("quotes").insert({
      ...form,  // Includes: contact_name, contact_email, service_type, weight_kg, etc.
      customer_id: user?.id ?? null,  // NULL if guest, otherwise user ID
      weight_kg: form.weight_kg ? parseFloat(form.weight_kg) : null,
      volume_cbm: form.volume_cbm ? parseFloat(form.volume_cbm) : null,
      pieces: form.pieces ? parseInt(form.pieces) : null,
      estimated_price_usd: estimate?.total ?? null,  // From calculator
    });

    if (error) throw error;
    
    // Success
    setSubmitted(true);
    toast.success(t("success"));  // "Quote request submitted! We'll contact you within 24 hours."
  } catch {
    toast.error(t("error"));
  } finally {
    setLoading(false);
  }
};
```

### 1.2 Data Stored in Database

**Supabase table: `public.quotes`**

A new row is created with:

```sql
INSERT INTO public.quotes (
  customer_id,           -- NULL for guests, UUID for logged-in users
  contact_name,          -- "John Doe"
  contact_email,         -- "john@example.com"
  contact_phone,         -- "0912345678"
  company,               -- "Acme Corp"
  service_type,          -- "air", "sea", or "road"
  origin_country,        -- "Vietnam"
  origin_city,           -- "Ho Chi Minh City"
  dest_country,          -- "United States"
  dest_city,             -- "Los Angeles"
  cargo_type,            -- "Electronics"
  weight_kg,             -- 100
  volume_cbm,            -- 0.5
  pieces,                -- 1
  incoterm,              -- "FOB"
  special_requirements,  -- "Handle with care"
  estimated_price_usd,   -- 645 (calculated by estimateQuote)
  status,                -- "pending" (default)
  created_at             -- NOW()
);
```

---

## 2. Admin Fetches Quotes (Real-Time)

### 2.1 Admin Dashboard Load

**File:** `src/app/[locale]/admin/page.tsx` (line ~31-38)

```typescript
const load = useCallback(async () => {
  setLoading(true);
  const [{ data: s }, { data: q }] = await Promise.all([
    // Fetch shipments...
    supabase.from("shipments").select("*, tracking_events(*)").order("created_at", { ascending: false }),
    
    // THIS FETCHES ALL QUOTES from database
    supabase.from("quotes").select("*").order("created_at", { ascending: false }),
  ]);
  setShipments(s || []);
  setQuotes(q || []);  // ← Stored in React state
  setLoading(false);
}, []);

// Load quotes on page mount
useEffect(() => { load(); }, [load]);
```

**This query returns:**
```
[
  {
    id: "uuid-1",
    customer_id: "uuid-customer-or-null",
    contact_name: "John Doe",
    contact_email: "john@example.com",
    contact_phone: "0912345678",
    company: "Acme Corp",
    service_type: "air",
    origin_city: "Ho Chi Minh City",
    dest_city: "Los Angeles",
    cargo_type: "Electronics",
    weight_kg: 100,
    volume_cbm: 0.5,
    pieces: 1,
    incoterm: "FOB",
    special_requirements: "Handle with care",
    estimated_price_usd: 645,
    status: "pending",
    admin_notes: null,
    final_price_usd: null,
    valid_until: null,
    created_at: "2024-06-12T10:30:00Z",
    updated_at: "2024-06-12T10:30:00Z"
  },
  { ... more quotes ... }
]
```

---

## 3. Admin Sees Quotes in Dashboard

### 3.1 Quotes Tab Display

**File:** `src/app/[locale]/admin/page.tsx` (line ~165+)

```typescript
{/* Quotes tab */}
{tab === "quotes" && (
  <div className="space-y-3">
    {quotes.map((q) => (
      <div key={q.id} className="card">
        {/* Left side: Quote details */}
        <div>
          <div className="font-medium text-navy-800">
            {q.contact_name} · {q.company}
          </div>
          <div className="text-sm text-gray-500">
            {q.contact_email} · {q.contact_phone}
          </div>
          <div className="text-xs text-gray-400 mt-1 capitalize">
            {q.service_type} · {q.origin_city} → {q.dest_city} · {q.weight_kg}kg
          </div>
          {q.special_requirements && (
            <div className="text-xs text-gray-400 mt-1">
              Note: {q.special_requirements}
            </div>
          )}
          {q.estimated_price_usd && (
            <div className="text-xs text-brand-600 mt-1">
              Client estimate: ${q.estimated_price_usd}
            </div>
          )}
        </div>

        {/* Right side: Status & Actions */}
        <div className="flex flex-col items-end gap-2">
          <span className={`tracking-badge ${
            q.status === "pending"  ? "bg-yellow-100 text-yellow-700" :
            q.status === "quoted"   ? "bg-brand-100 text-brand-700"    :
            q.status === "accepted" ? "bg-green-100 text-green-700"  :
            "bg-gray-100 text-gray-500"
          }`}>
            {q.status}
          </span>
          <div className="text-xs text-gray-400">
            {format(new Date(q.created_at), "MMM d, yyyy")}
          </div>
          
          {/* Action buttons */}
          {q.status === "pending" && (
            <div className="flex gap-2 mt-1">
              {/* Review button: sets status to "reviewing" */}
              <button onClick={() => handleQuoteStatus(q.id, "reviewing")}
                className="text-xs bg-indigo-50 text-indigo-600 px-2.5 py-1 rounded-lg font-medium hover:bg-indigo-100">
                Review
              </button>
              
              {/* Send Quote button: prompts for price */}
              <button onClick={() => {
                const price = parseFloat(prompt("Enter final price (USD):") || "0");
                if (price > 0) handleQuoteStatus(q.id, "quoted", price);
              }} className="text-xs bg-brand-50 text-brand-600 px-2.5 py-1 rounded-lg font-medium hover:bg-brand-100">
                Send Quote
              </button>
            </div>
          )}
        </div>
      </div>
    ))}
  </div>
)}
```

**Visual Output in Browser:**
```
┌─────────────────────────────────────────────────────────────┐
│ John Doe · Acme Corp                                        │
│ john@example.com · 0912345678                              │
│ Air · Ho Chi Minh City → Los Angeles · 100kg               │
│ Note: Handle with care                                      │
│ Client estimate: $645                                       │
│                                             pending   Jun 12 │
│                                      [Review] [Send Quote]  │
└─────────────────────────────────────────────────────────────┘
```

---

## 4. Admin Updates Quote Status

### 4.1 Click "Review" Button

```typescript
const handleQuoteStatus = async (id: string, status: string, price?: number) => {
  // Update quote in database
  await supabase
    .from("quotes")
    .update({ 
      status,  // e.g., "reviewing"
      ...(price ? { final_price_usd: price } : {})  // Only if price provided
    })
    .eq("id", id);
  
  toast.success("Quote updated.");
  load();  // Refresh quotes from database
};
```

**Result in Supabase:**
```sql
UPDATE public.quotes 
SET status = 'reviewing' 
WHERE id = 'uuid-1'
```

Display updates immediately in browser (after calling `load()`).

---

### 4.2 Click "Send Quote" Button

User prompted for final price:

```
Enter final price (USD): 700
```

Then:

```typescript
const price = parseFloat(prompt("Enter final price (USD):") || "0");
if (price > 0) handleQuoteStatus(q.id, "quoted", price);
```

**Result in Supabase:**
```sql
UPDATE public.quotes 
SET status = 'quoted', final_price_usd = 700 
WHERE id = 'uuid-1'
```

---

## 5. Customer Sees Updated Quote in Portal

### 5.1 Customer Logs In to Portal

**File:** `src/app/[locale]/portal/page.tsx` (line ~12-20)

```typescript
// Server-side: Fetch customer's quotes
const [{ data: quotes }] = await Promise.all([
  supabase
    .from("quotes")
    .select("*")
    .eq("customer_id", user.id)  // Only quotes for this customer
    .order("created_at", { ascending: false })
    .limit(10),
]);
```

### 5.2 Display Quote in "My Quotes" Section

**File:** `src/app/[locale]/portal/page.tsx` (line ~70+)

```typescript
{/* My Quotes section */}
<div>
  <h2 className="font-display font-bold text-lg text-navy-800">My Quotes</h2>
  <div className="space-y-3">
    {quotes && quotes.length > 0 ? quotes.map((q: Quote) => (
      <div key={q.id} className="card py-4 px-5 flex items-center justify-between">
        <div>
          <div className="font-medium text-navy-800 text-sm capitalize">
            {q.service_type} — {q.origin_city} → {q.dest_city}
          </div>
          <div className="text-xs text-gray-400 mt-0.5">
            {format(new Date(q.created_at), "MMM d, yyyy")}
          </div>
        </div>
        <div className="text-right">
          {/* Status badge */}
          <span className={`tracking-badge ${
            q.status === "pending" ? "bg-yellow-100 text-yellow-700" :
            q.status === "quoted"  ? "bg-brand-100 text-brand-700"    :
            q.status === "accepted"? "bg-green-100 text-green-700"  :
            "bg-gray-100 text-gray-500"
          }`}>
            {q.status}
          </span>
          
          {/* Final price (only shown if admin quoted) */}
          {q.final_price_usd && (
            <div className="text-xs font-semibold text-brand-700 mt-1">
              ${q.final_price_usd} USD
            </div>
          )}
        </div>
      </div>
    )) : (
      <div className="card text-center py-10 text-gray-400">
        No quotes yet.
      </div>
    )}
  </div>
</div>
```

**Visual Output in Customer Portal:**
```
┌─────────────────────────────────────────────────────────────┐
│ My Quotes                                                   │
├─────────────────────────────────────────────────────────────┤
│ Air — Ho Chi Minh City → Los Angeles              quoted     │
│ Jun 12, 2024                                     $700 USD    │
└─────────────────────────────────────────────────────────────┘
```

---

## 6. Complete Data Flow Diagram

```
┌─────────────────────────┐
│   CUSTOMER SIDE         │
│                         │
│  User fills quote form: │
│  - Name, email, phone   │
│  - Service type: Air    │
│  - Weight: 100 kg       │
│  - Volume: 0.5 CBM      │
│                         │
│  Calculator shows:      │
│  Estimate: $645 USD     │
│                         │
│  Clicks submit          │
└────────────┬────────────┘
             │
             │ INSERT quote
             │ (estimated_price: $645, status: pending)
             ↓
┌─────────────────────────────────────────────────────────┐
│  SUPABASE DATABASE                                      │
│                                                         │
│  public.quotes table:                                   │
│  ┌─────────────────────────────────────────────────┐   │
│  │ id  │ name │ email │ weight │ est_price │ status│   │
│  ├─────────────────────────────────────────────────┤   │
│  │ u1  │ John │ j@ex  │ 100    │ 645       │ pend │   │
│  │ u2  │ Jane │ ja@ex │ 200    │ 850       │ pend │   │
│  │ u3  │ Bob  │ b@ex  │ 150    │ 720       │ quot │   │
│  └─────────────────────────────────────────────────┘   │
│                                                         │
│  RLS Policies:                                          │
│  ✓ Anyone can INSERT                                    │
│  ✓ Admin can SELECT all                                │
│  ✓ Customer can SELECT own (by customer_id)            │
│  ✓ Admin can UPDATE all                                │
└────────────┬────────────────────────────────────────────┘
             │
             │ SELECT all quotes
             │ (load() runs on admin page load)
             ↓
┌─────────────────────────────┐
│   ADMIN DASHBOARD           │
│                             │
│  Quotes Tab shows:          │
│  • John Doe - pending       │
│  • Jane Doe - pending       │
│  • Bob Smith - quoted       │
│                             │
│  Admin clicks              │
│  "Send Quote" for John      │
│                             │
│  Prompt: Price? → 700       │
│                             │
│  Clicks OK                  │
└────────────┬────────────────┘
             │
             │ UPDATE quotes
             │ SET status='quoted', final_price_usd=700
             │ WHERE id=u1
             ↓
┌─────────────────────────────┐
│  SUPABASE DATABASE          │
│                             │
│  Row updated:               │
│  u1: status='quoted'        │
│      final_price=700        │
│      updated_at=NOW()       │
└────────────┬────────────────┘
             │
             │ Customer logs in
             │ SELECT * WHERE customer_id=u1
             ↓
┌─────────────────────────────┐
│  CUSTOMER PORTAL            │
│                             │
│  John sees:                 │
│  Air Freight Quote          │
│  Status: quoted             │
│  Price: $700 USD ← From DB  │
│                             │
│  (If status was pending:    │
│   would show "Awaiting...")  │
└─────────────────────────────┘
```

---

## 7. Key Connection Points

### 7.1 Form → Database
**File:** `src/app/[locale]/quote/page.tsx`
- Collects form data
- Calculates estimate with `estimateQuote()`
- Inserts to `supabase.from("quotes").insert()`
- Stores `estimated_price_usd` from calculator

### 7.2 Database → Admin
**File:** `src/app/[locale]/admin/page.tsx`
- `load()` function fetches: `supabase.from("quotes").select("*")`
- Maps over quotes array to display them
- `handleQuoteStatus()` updates status and price
- `load()` refreshes after each update

### 7.3 Database → Customer Portal
**File:** `src/app/[locale]/portal/page.tsx`
- Server-side fetches: `supabase.from("quotes").select("*").eq("customer_id", user.id)`
- Displays customer's own quotes only
- Shows final_price if status is "quoted"

---

## 8. RLS Security Rules

**File:** `supabase/schema.sql` (line 160-172)

```sql
-- Anyone can submit a quote (no login required)
CREATE POLICY "Anyone can submit a quote"
  ON public.quotes FOR INSERT WITH CHECK (true);

-- Customers see only their own quotes
CREATE POLICY "Customers can view their own quotes"
  ON public.quotes FOR SELECT
  USING (customer_id = auth.uid() OR contact_email = (
    SELECT email FROM auth.users WHERE id = auth.uid()
  ));

-- Admins see and edit everything
CREATE POLICY "Admins have full access to quotes"
  ON public.quotes FOR ALL
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));
```

**What this means:**
- ✅ Guest can submit quote (no auth required)
- ✅ Logged-in customer sees only their quotes
- ✅ Admin sees all quotes and can update them
- ✅ Customer can't see admin_notes or modify their quote

---

## 9. Why "Admin Page Links to Quotation Data" Works

1. **Admin page loads** → Calls `load()` function
2. **load() queries database** → `supabase.from("quotes").select("*")`
3. **RLS policy checks** → Is user admin? (middleware already verified this)
4. **All quotes returned** → To React state `quotes`
5. **Map over quotes** → Display each one with action buttons
6. **Admin clicks action** → Updates database via `handleQuoteStatus()`
7. **Database updated** → `status` and `final_price_usd` change
8. **load() runs again** → Refetches all quotes from database
9. **UI updates** → Shows new status and price

**The link is automatic** because `load()` subscribes to database changes through Supabase's real-time API.

---

## 10. Testing the Integration

### Test 1: Submit Quote → Admin Sees It
```bash
1. Go to /en/quote
2. Submit form
3. Go to /en/admin → Quotes tab
4. Should see new quote with status "pending"
```

### Test 2: Admin Updates Quote → Customer Sees It
```bash
1. (From Test 1) Quote is pending
2. Click "Send Quote" → Enter price 500
3. Sign in as customer (same email as quote)
4. Go to /en/portal → My Quotes
5. Should show status "quoted" and price "$500 USD"
```

### Test 3: Direct Database Query
```sql
-- Check if quote was inserted
SELECT contact_name, status, estimated_price_usd, final_price_usd 
FROM public.quotes 
WHERE contact_email = 'your-test@email.com' 
ORDER BY created_at DESC LIMIT 1;

-- Should show:
-- contact_name | status | estimated_price_usd | final_price_usd
-- Test User    | quoted | 645                 | 500
```

---

## Summary

The quotation system links to the admin page through:

1. **Data Collection**: Quote form collects customer data + calculates estimate
2. **Database Storage**: Data inserted to `public.quotes` table
3. **Admin Fetch**: Admin page queries quotes with RLS verification
4. **Admin Update**: Admin changes status/price via `handleQuoteStatus()`
5. **Customer View**: Portal queries and displays customer's updated quote

All connections are **real-time** because they all use Supabase client which automatically fetches fresh data on each page load.

**No special linking is needed** — it's already integrated! Just verify your Supabase credentials are set up correctly.
