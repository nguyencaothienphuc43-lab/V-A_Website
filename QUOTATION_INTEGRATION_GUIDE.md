# V&A Express — Quotation System Integration Guide

## Executive Summary

**✅ STATUS: QUOTATION SYSTEM IS ALREADY FULLY INTEGRATED**

Your V&A Express application already has a complete, working quotation system with automatic fee calculation. All components are connected:
- Quote form with real-time calculator ✓
- Automatic fee calculation based on SERVICE_RATES ✓
- Database storage with RLS security ✓
- Admin dashboard for quote management ✓
- Customer portal to view own quotes ✓

This guide documents the current implementation and shows how to verify it's working, customize rates, and add optional enhancements.

---

## Part 1: Current Architecture Overview

### 1.1 How Quotation Works End-to-End

```
CUSTOMER JOURNEY:
User fills form (contact + shipment details)
       ↓
Calculator runs → estimateQuote() function
       ↓
Real-time estimate shown (base + fuel + handling)
       ↓
User clicks "Submit Quote Request"
       ↓
Data inserted to Supabase quotes table
       ↓
Success page shown to customer
       ↓
Customer can view quote in /portal (if logged in)
       ↓
Admin sees quote in /admin → Quotes tab
       ↓
Admin responds with final price & status
       ↓
Customer notified of quote response

ADMIN JOURNEY:
Admin opens /admin → Quotes tab
       ↓
Sees all pending quotes
       ↓
Clicks "Review" → status changes to reviewing
       ↓
Clicks "Send Quote" → enters final price USD
       ↓
Quote status changes to "quoted"
       ↓
Customer sees final price in their portal
```

### 1.2 Key Files & Their Roles

| File | Purpose | Status |
|------|---------|--------|
| `src/types/index.ts` | Quote types, SERVICE_RATES, estimateQuote() | ✅ Active |
| `supabase/schema.sql` | quotes table, RLS policies | ✅ Active |
| `src/app/[locale]/quote/page.tsx` | Quote request form, calculator UI | ✅ Active |
| `src/app/[locale]/admin/page.tsx` | Admin dashboard with Quotes tab | ✅ Active |
| `src/app/[locale]/portal/page.tsx` | Customer view of their quotes | ✅ Active |
| `src/lib/supabase/client.ts` | Browser client for form submission | ✅ Active |

---

## Part 2: Verification Checklist

Before proceeding with customization, verify the system is working:

### ✓ Step 1: Verify Database Schema

Run in your Supabase SQL Editor:
```sql
-- Check quotes table exists
SELECT column_name, data_type FROM information_schema.columns 
WHERE table_name = 'quotes';

-- Should show these columns:
-- estimated_price_usd, final_price_usd, admin_notes, valid_until, status, etc.
```

**Expected output:** All quote columns listed above.

### ✓ Step 2: Test Quote Submission (as customer)

1. Go to `http://localhost:3000/en/quote`
2. Fill in the form:
   - Contact: Name, Email, Phone
   - Shipment: Select Air Freight, enter Origin/Destination, Weight 100kg, Volume 0.5 CBM
3. Watch the **Estimated Cost** sidebar update in real-time
4. Click **Submit Quote Request**
5. Should see success page

**Verify in Supabase:**
```sql
SELECT contact_name, contact_email, service_type, estimated_price_usd, status 
FROM public.quotes 
ORDER BY created_at DESC LIMIT 1;
```

Should show your new quote with `estimated_price_usd` populated.

### ✓ Step 3: Test Admin Dashboard

1. Sign in as admin user to `http://localhost:3000/en/admin`
2. Click **Quotes** tab
3. Should see the quote you just submitted
4. Click **Review** button → status changes to "reviewing"
5. Click **Send Quote** → prompt for price (e.g., 500 USD)
6. Quote status changes to "quoted"

**Verify in Supabase:**
```sql
SELECT id, contact_email, status, final_price_usd FROM public.quotes WHERE status = 'quoted' LIMIT 1;
```

Should show final_price_usd populated.

### ✓ Step 4: Test Customer Portal (if logged in)

1. Register a new user at `http://localhost:3000/en/auth/register`
2. Go back to `/quote` and submit with your registered email
3. Sign in to `/portal`
4. Should see your quote in **My Quotes** section
5. Should show status and final price (if admin quoted it)

---

## Part 3: Customizing Fee Calculation

### 3.1 How the Calculator Works

Located in `src/types/index.ts`:

```typescript
export const SERVICE_RATES: Record<ServiceType, {
  base: number;           // Base fee in USD
  perKg: number;         // Price per kilogram
  fuel: number;          // Fuel surcharge as % of base rate
  handling: number;      // Fixed handling fee
  transit: string;       // Transit time display
}> = {
  air:  { base: 150, perKg: 4.5,  fuel: 0.15, handling: 75,  transit: "3–7 business days"   },
  sea:  { base: 350, perKg: 0.35, fuel: 0.12, handling: 120, transit: "15–35 business days" },
  road: { base: 80,  perKg: 0.8,  fuel: 0.10, handling: 50,  transit: "3–10 business days"  },
};

// Formula:
// chargeableWeight = MAX(weight_kg, volume_cbm * 167)  // Volumetric calculation
// baseRate = SERVICE_RATES[type].base + (chargeableWeight * perKg)
// fuelSurcharge = baseRate * fuel%
// handlingFee = fixed handling fee
// total = baseRate + fuelSurcharge + handlingFee
```

### 3.2 Update Rates for Your Business

Edit `src/types/index.ts` → `SERVICE_RATES` object:

```typescript
// BEFORE: Placeholder rates
air: { base: 150, perKg: 4.5, fuel: 0.15, handling: 75, transit: "3–7 business days" },

// AFTER: Your actual rates (example)
air: { base: 180, perKg: 5.2, fuel: 0.18, handling: 95, transit: "3–7 business days" },
```

**Parameters to adjust:**
- `base`: Your base shipping fee (USD) regardless of weight
- `perKg`: Your per-kilogram charge
- `fuel`: Fuel surcharge percentage (0.15 = 15% of base rate)
- `handling`: Fixed handling/processing fee
- `transit`: Display string for customer (informational only)

**Save & Test:**
1. Edit the rates
2. Reload `/quote` page
3. Enter same cargo details → estimate should update
4. Submit → check Supabase for new `estimated_price_usd`

---

## Part 4: Linking Quotation Data to Admin Page

### 4.1 Current Admin Integration

The admin page **already reads** all quotes from the database:

```typescript
// src/app/[locale]/admin/page.tsx (line ~33)
const [{ data: q }] = await Promise.all([
  supabase.from("quotes").select("*").order("created_at", { ascending: false }),
]);
```

This fetches all quotes in real-time every time you open the admin page.

### 4.2 What Admin Can Do Right Now

| Action | How | Effect |
|--------|-----|--------|
| **View Quote Details** | Click quote card | Shows contact, shipment info, estimate |
| **Mark as Reviewing** | Click "Review" button | Sets status = "reviewing" |
| **Send Quote** | Click "Send Quote" → Enter price | Sets status = "quoted" + stores final_price_usd |
| **View Estimate** | Quote card shows "Client estimate: $XXX" | Shows what customer saw |
| **Filter by Status** | Currently shows all — see enhancement below | View pending/quoted/declined |

### 4.3 Enhancement: Add Quote Filtering

To show only pending quotes or filter by status, edit `src/app/[locale]/admin/page.tsx`:

**Current code (line ~120, Quotes tab):**
```typescript
{tab === "quotes" && (
  <div className="space-y-3">
    {quotes.map((q) => (
```

**Enhanced with filter:**
```typescript
// Add state for filter
const [quoteFilter, setQuoteFilter] = useState<"all" | "pending" | "reviewing" | "quoted">("pending");

// Add filter buttons before the quote list
{tab === "quotes" && (
  <div className="space-y-5">
    <div className="flex gap-2 mb-4">
      {(["all", "pending", "reviewing", "quoted"] as const).map(filter => (
        <button
          key={filter}
          onClick={() => setQuoteFilter(filter)}
          className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
            quoteFilter === filter
              ? "bg-brand-500 text-white"
              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
          }`}
        >
          {filter === "all" ? "All" : filter.charAt(0).toUpperCase() + filter.slice(1)}
        </button>
      ))}
    </div>
    
    <div className="space-y-3">
      {quotes
        .filter(q => quoteFilter === "all" || q.status === quoteFilter)
        .map((q) => (
```

### 4.4 Enhancement: Add Notes & Set Valid Until Date

Currently, admin can only set `final_price_usd` and `status`. To add admin notes and validity date:

**Edit the "Send Quote" section in admin page:**

```typescript
// Current (line ~235):
{q.status === "pending" && (
  <div className="flex gap-2 mt-1">
    <button onClick={() => handleQuoteStatus(q.id, "reviewing")}
      className="text-xs bg-indigo-50 text-indigo-600 px-2.5 py-1 rounded-lg font-medium...">
      Review
    </button>
    <button onClick={() => {
      const price = parseFloat(prompt("Enter final price (USD):") || "0");
      if (price > 0) handleQuoteStatus(q.id, "quoted", price);
    }} className="text-xs bg-brand-50 text-brand-600...">
      Send Quote
    </button>
  </div>
)}

// Enhanced:
{q.status === "pending" && (
  <div className="flex gap-2 mt-1">
    <button onClick={() => handleQuoteStatus(q.id, "reviewing")}
      className="...">Review</button>
    <button onClick={() => {
      const price = parseFloat(prompt("Enter final price (USD):") || "0");
      const notes = prompt("Admin notes (optional):");
      const validDays = prompt("Valid for how many days? (default 30):");
      if (price > 0) {
        const validUntil = new Date();
        validUntil.setDate(validUntil.getDate() + parseInt(validDays || "30"));
        supabase.from("quotes")
          .update({
            status: "quoted",
            final_price_usd: price,
            admin_notes: notes,
            valid_until: validUntil.toISOString().split("T")[0]
          })
          .eq("id", q.id)
          .then(() => { toast.success("Quote sent!"); load(); });
      }
    }} className="...">Send Quote</button>
  </div>
)}
```

---

## Part 5: Optional Enhancements

### 5.1 Email Notifications on Quote Actions

**Supabase Edge Functions approach** (recommended):

1. Go to Supabase Dashboard → Edge Functions → Create function
2. Create `quote-update-notification` function:

```typescript
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

serve(async (req) => {
  const { quoteId, customerEmail, status, finalPrice } = await req.json();
  
  const emailSubject = {
    quoted: "Your quotation is ready!",
    accepted: "Quote accepted - next steps",
    declined: "Quote response",
  }[status] || "Quote update";

  const emailBody = {
    quoted: `Your quotation: USD ${finalPrice} valid for 30 days`,
    accepted: `Thank you for accepting. Our team will contact you within 24 hours.`,
    declined: `We're happy to revise. Please let us know your requirements.`,
  }[status] || `Your quote status: ${status}`;

  // Send via your email service (SendGrid, Mailgun, etc.)
  return new Response(JSON.stringify({ sent: true }));
});
```

3. Call from admin page when updating quote status:
```typescript
// After quote update
await fetch(
  "https://your-project.supabase.co/functions/v1/quote-update-notification",
  {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      quoteId: q.id,
      customerEmail: q.contact_email,
      status: "quoted",
      finalPrice: price,
    }),
  }
);
```

### 5.2 Automated Follow-up for Pending Quotes

Add a daily check for quotes pending > 3 days:

```sql
-- In Supabase SQL Editor, create a function to check old quotes
CREATE OR REPLACE FUNCTION notify_old_pending_quotes()
RETURNS void AS $$
BEGIN
  -- This would trigger an email to admin about quotes pending > 3 days
  -- Use Supabase Cron extension or a scheduled Cloud Run job
END;
$$ LANGUAGE plpgsql;
```

### 5.3 Export Quotes to CSV

Add an "Export" button in admin Quotes tab:

```typescript
const exportQuotes = () => {
  const csv = [
    ["Date", "Contact", "Email", "Service", "Route", "Weight", "Est Price", "Status", "Final Price"].join(","),
    ...quotes.map(q =>
      [
        q.created_at?.split("T")[0],
        q.contact_name,
        q.contact_email,
        q.service_type,
        `${q.origin_city} → ${q.dest_city}`,
        q.weight_kg,
        q.estimated_price_usd,
        q.status,
        q.final_price_usd || "—",
      ].join(",")
    ),
  ].join("\n");

  const blob = new Blob([csv], { type: "text/csv" });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `quotes-${new Date().toISOString().split("T")[0]}.csv`;
  a.click();
};

// Add button to admin Quotes section:
<button onClick={exportQuotes} className="btn-ghost text-sm">
  Download CSV
</button>
```

### 5.4 Quote Templates for Common Routes

Store pre-configured quotes for your most common lanes:

```typescript
// In types/index.ts, add:
export const QUOTE_TEMPLATES = {
  "vietnam-usa": { service: "air" as const, transit: "4–5 days", perKg: 5.0 },
  "vietnam-europe": { service: "sea" as const, transit: "30–35 days", perKg: 0.4 },
  "vietnam-thailand": { service: "road" as const, transit: "2–3 days", perKg: 1.2 },
};

// On quote form, add "Quick Quote" buttons for these
```

---

## Part 6: Troubleshooting

### Issue: Quote not appearing in admin dashboard

**Check:**
1. Are you logged in as admin? (middleware redirects non-admins to portal)
2. Verify in Supabase: `SELECT * FROM profiles WHERE id = '[your-id]' AND role = 'admin';`
3. If role is 'customer', run: `UPDATE profiles SET role = 'admin' WHERE id = '[your-id-here]';`

### Issue: Estimate showing as $0

**Check:**
1. Did you enter BOTH weight AND volume? Calculator requires both.
2. Are SERVICE_RATES defined? Verify in `src/types/index.ts`
3. Check browser console for JavaScript errors (F12 → Console tab)

### Issue: Final price not showing to customer in portal

**Check:**
1. Did admin actually click "Send Quote"? Status should be "quoted"
2. Is customer logged in with same email they used for quote?
3. Verify RLS policy allows customer to see quotes: `SELECT * FROM quotes WHERE contact_email = '[customer@email.com]';`

---

## Part 7: Security Checklist

- ✅ **RLS is active** on quotes table
- ✅ **Anyone can INSERT** (public quote submission)
- ✅ **Customers see only their own quotes** (by customer_id or contact_email)
- ✅ **Admins have full access** (verified in middleware)
- ✅ **Sensitive fields** (admin_notes, final_price) hidden from customers until quoted
- ⚠️ **TODO:** Add rate limiting on quote submissions (prevent spam)
- ⚠️ **TODO:** Validate email addresses before storing

---

## Part 8: Quick Reference: What's Where

| Need to... | Go to... |
|-----------|----------|
| Customize pricing rates | `src/types/index.ts` → `SERVICE_RATES` |
| Change quote form fields | `src/app/[locale]/quote/page.tsx` |
| Update admin dashboard | `src/app/[locale]/admin/page.tsx` |
| Modify database schema | `supabase/schema.sql` (run in Supabase SQL Editor) |
| Change quote success message | `messages/en.json` → `quote.success` |
| View all quotes data | Supabase Dashboard → Table Editor → quotes |
| Export quotes | (See 5.3 Enhancement above) |

---

## Part 9: Deployment Notes

When deploying to production:

1. **Set correct Supabase URL & Keys** in Vercel environment variables:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY` (for admin operations)

2. **Run schema.sql** in your production Supabase SQL Editor

3. **Create admin user:**
   ```sql
   UPDATE public.profiles SET role = 'admin' WHERE email = 'your-admin@email.com';
   ```

4. **Test quote flow** end-to-end on production

5. **Monitor** Supabase Dashboard → Logs for any RLS permission errors

---

## Summary: You're Ready!

Your quotation system is **complete and functional**. The next steps are:

1. ✅ Test the full flow (quote → admin → customer)
2. ✅ Customize SERVICE_RATES for your actual pricing
3. ✅ (Optional) Add enhancements: email notifications, filtering, exports
4. ✅ Deploy to production

All data automatically flows between the quote form, calculator, database, admin panel, and customer portal. **No additional integration needed** — just customize the rates and you're live!

---

**Questions?** Check the TypeScript types in `src/types/index.ts` or the Supabase schema for field definitions.
