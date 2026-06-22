# Quotation System — Quick Start Checklist

## Status: ✅ ALREADY INTEGRATED

Your quotation system is fully functional. Follow this checklist to activate and customize it.

---

## 🎯 5-Minute Quick Start

### Step 1: Verify It Works (2 min)
```bash
# Start your dev server
npm run dev

# In browser, go to:
http://localhost:3000/en/quote

# Fill form and submit → should see success page
```

✅ If you see success page, quotation system is active!

---

### Step 2: Update Pricing (1 min)

Edit **`src/types/index.ts`** (line ~100):

```typescript
export const SERVICE_RATES = {
  air: {
    base: 150,        // ← Change this to your base air freight fee
    perKg: 4.5,       // ← Change this to your per-kg rate
    fuel: 0.15,       // ← Fuel surcharge (0.15 = 15%)
    handling: 75,     // ← Handling fee
    transit: "3–7 business days"  // Display text
  },
  sea: {
    base: 350,        // ← Change for sea freight
    perKg: 0.35,
    fuel: 0.12,
    handling: 120,
    transit: "15–35 business days"
  },
  road: {
    base: 80,         // ← Change for road freight
    perKg: 0.8,
    fuel: 0.10,
    handling: 50,
    transit: "3–10 business days"
  }
};
```

Save file → Page reloads automatically → New rates active!

---

### Step 3: View in Admin Dashboard (2 min)

```
1. Go to http://localhost:3000/en/admin
2. Sign in as admin (or become admin in Supabase)
3. Click "Quotes" tab
4. See all submitted quotes
5. Click "Review" → "Send Quote" → Enter final price
6. Quote status changes to "quoted"
```

✅ Quote system fully operational!

---

## 📋 Complete Integration Workflow

### Customer Side
```
Quote Form Page
  ↓ (enter: name, email, shipment details)
Real-time Calculator
  ↓ (shows: base + fuel + handling = total estimate)
Submit Button
  ↓ (clicks "Submit Quote Request")
Success Message
  ↓ (shows "We'll contact within 24 hours")
Customer Portal
  ↓ (customer logs in to /portal)
My Quotes Section
  ↓ (shows quote status and final price when admin responds)
```

### Admin Side
```
Admin Dashboard → Quotes Tab
  ↓ (sees list of all pending quotes)
Click "Review"
  ↓ (status → "reviewing")
Click "Send Quote"
  ↓ (enter final price USD)
Quote Updated
  ↓ (status → "quoted", final_price set)
Notify Customer
  ↓ (optional: send email notification)
Customer Sees Quote
  ↓ (in their /portal)
Customer Accepts/Declines
  ↓ (in customer portal)
```

---

## 🔧 Customization Options

### Option A: Simple Rate Update (2 minutes)
Change `SERVICE_RATES` in `src/types/index.ts`
```typescript
// Just update these numbers:
air: { base: 180, perKg: 5.2, fuel: 0.18, handling: 95, ... }
```
✅ Rates update immediately on quote page

---

### Option B: Add Admin Quote Filtering (10 minutes)

In `src/app/[locale]/admin/page.tsx`, add this state:

```typescript
const [quoteFilter, setQuoteFilter] = useState<"all" | "pending" | "reviewing" | "quoted">("pending");
```

Then filter quotes:
```typescript
{tab === "quotes" && (
  <div>
    <div className="flex gap-2 mb-4">
      {(["all", "pending", "reviewing", "quoted"] as const).map(f => (
        <button
          key={f}
          onClick={() => setQuoteFilter(f)}
          className={`px-3 py-1.5 rounded-lg text-sm ${
            quoteFilter === f ? "bg-blue-500 text-white" : "bg-gray-100"
          }`}
        >
          {f}
        </button>
      ))}
    </div>
    {quotes.filter(q => quoteFilter === "all" || q.status === quoteFilter).map(q => (
      // ... display quote
    ))}
  </div>
)}
```

✅ Admin can now filter quotes by status

---

### Option C: Add Email Notifications (30 minutes)

When admin sends a quote, notify customer:

```typescript
// In admin page, after sending quote:
async function sendQuoteNotification(quote: Quote, finalPrice: number) {
  // Option 1: Use Supabase Edge Function
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/send-quote-email`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: quote.contact_email,
        name: quote.contact_name,
        price: finalPrice,
        route: `${quote.origin_city} → ${quote.dest_city}`,
      }),
    }
  );
  
  // Option 2: Use SendGrid API directly
  // Option 3: Use AWS SES
}
```

---

## 📊 Data Flow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    CUSTOMER FLOW                             │
├─────────────────────────────────────────────────────────────┤
│  /quote Page                                                 │
│  • Form: contact_name, contact_email, service_type          │
│  • Inputs: weight_kg, volume_cbm                            │
│        ↓                                                     │
│  Calculator (estimateQuote function)                        │
│  • Calculate chargeableWeight = MAX(kg, cbm * 167)         │
│  • baseRate = SERVICE_RATES[type].base + (weight * perKg)   │
│  • fuelSurcharge = baseRate * fuel%                         │
│  • total = baseRate + fuel + handling                       │
│        ↓                                                     │
│  Submit Button                                              │
│  • Insert to supabase.quotes                               │
│  • Store: estimated_price_usd from calculator               │
│  • Set: status = "pending", customer_id (if logged in)     │
│        ↓                                                     │
│  Success Page                                               │
│  "We'll contact within 24 hours"                            │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                 DATABASE STORAGE                             │
├─────────────────────────────────────────────────────────────┤
│  Supabase: public.quotes table                              │
│  • Row 1: [id, customer_id, contact_email, weight_kg,      │
│            volume_cbm, estimated_price_usd, status,        │
│            admin_notes, final_price_usd, valid_until]      │
│  • Row 2: [...]                                             │
│  • Row 3: [...]                                             │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                    ADMIN FLOW                                │
├─────────────────────────────────────────────────────────────┤
│  /admin → Quotes Tab                                        │
│  • Fetch: SELECT * FROM quotes                             │
│  • Display: All pending quotes (status = "pending")         │
│        ↓                                                     │
│  Admin Actions:                                             │
│  • Click "Review" → Update status to "reviewing"           │
│  • Click "Send Quote" → Prompt for price                   │
│        ↓                                                     │
│  Database Update:                                           │
│  • Set: final_price_usd = [admin's entered value]         │
│  • Set: status = "quoted"                                  │
│  • Set: admin_notes = [optional notes]                     │
│  • Set: valid_until = [DATE]                               │
│        ↓                                                     │
│  (Optional) Send Email                                      │
│  • Notify customer@email.com with final price              │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                  CUSTOMER PORTAL FLOW                        │
├─────────────────────────────────────────────────────────────┤
│  /portal → My Quotes Section                                │
│  • Fetch: SELECT * FROM quotes WHERE customer_id = user    │
│  • Display: All customer's quotes                          │
│        ↓                                                     │
│  Quote Status Display:                                      │
│  • pending → "Awaiting response from V&A Express"          │
│  • reviewing → "We're reviewing your request"              │
│  • quoted → "Final Price: $XXX USD" ← From admin           │
│  • accepted → "Quote accepted - next steps below"          │
│  • declined → "Unfortunately declined"                      │
└─────────────────────────────────────────────────────────────┘
```

---

## 🔐 Security: What's Protected

- ✅ **Public quotes table**: RLS policy allows anyone to INSERT (for guest quotes)
- ✅ **Customer privacy**: Customers only see their own quotes (via customer_id + email)
- ✅ **Admin only**: Only admin role can UPDATE quotes and see admin_notes
- ✅ **Middleware protection**: /admin and /portal routes require login + admin verification
- ✅ **No sensitive data**: Prices only visible after admin quotes

---

## ⚠️ Common Issues & Solutions

| Issue | Solution |
|-------|----------|
| Estimate showing $0 | Did you enter BOTH weight AND volume? |
| Quote not in admin dashboard | Are you logged in as admin? Check Supabase: `SELECT role FROM profiles WHERE id = '[your-id]'` |
| Quotes disappearing | Check RLS policies in Supabase |
| Final price not showing to customer | Did admin click "Send Quote"? Status must be "quoted" |
| Calculator not updating | Did you save the file? Hard refresh browser (Ctrl+Shift+R) |

---

## 📂 File Locations Reference

```
src/
├── types/
│   └── index.ts                           ← SERVICE_RATES, estimateQuote()
├── app/
│   └── [locale]/
│       ├── quote/
│       │   └── page.tsx                   ← Quote form + calculator UI
│       ├── admin/
│       │   └── page.tsx                   ← Admin dashboard + Quotes tab
│       └── portal/
│           └── page.tsx                   ← Customer view of their quotes
├── lib/
│   └── supabase/
│       ├── client.ts                      ← Browser client
│       └── server.ts                      ← Server client
└── messages/
    ├── en.json                            ← Quote page translations
    └── vi.json                            ← Vietnamese translations

supabase/
└── schema.sql                             ← quotes table + RLS policies
```

---

## 🚀 Ready to Deploy?

1. ✅ Customize SERVICE_RATES in `src/types/index.ts`
2. ✅ Test quote form: `/en/quote` → submit → check Supabase
3. ✅ Test admin: `/en/admin` → Quotes tab → send quote
4. ✅ Test customer: `/en/portal` → My Quotes → see final price
5. ✅ Push to GitHub
6. ✅ Deploy to Vercel (auto-deploys on push)
7. ✅ Verify in production

**Your quotation system is ready for customers!**

---

## 📞 Support

- **Question about calculator formula?** → See `src/types/index.ts` line 106-114
- **Question about admin actions?** → See `src/app/[locale]/admin/page.tsx` line 210+
- **Question about database schema?** → See `supabase/schema.sql` line 119-173
- **Question about RLS security?** → See `supabase/schema.sql` line 160-172
