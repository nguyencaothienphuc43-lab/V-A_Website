# Debugging: "Something went wrong" on Quote Submission

Your dev server is starting. Follow these steps to find the exact error:

## Step 1: Open the Quote Page
1. Wait for dev server to start (takes ~30 seconds)
2. Go to **http://localhost:3000/en/quote**

## Step 2: Open Browser Console
1. Press **F12** (or Cmd+Option+I on Mac)
2. Go to **Console** tab
3. Keep it open while testing

## Step 3: Fill & Submit Quote Form
Fill in the form with test data:
- **Name:** John Doe
- **Email:** john@example.com
- **Phone:** 0912345678
- **Company:** Test Corp
- **Service Type:** Air Freight
- **Origin City:** Ho Chi Minh City
- **Destination City:** Los Angeles
- **Weight (kg):** 100
- **Volume (CBM):** 0.5

Click **Submit Quote Request**

## Step 4: Read the Error Message
Look at the browser console. You should see one of these errors:

### ❌ Error 1: "new row violates row-level security policy"
**Cause:** RLS policy is blocking INSERT
**Solution:** Check Supabase RLS policies (see section below)

### ❌ Error 2: "permission denied for relation quotes"
**Cause:** Supabase auth issue
**Solution:** Check NEXT_PUBLIC_SUPABASE_ANON_KEY is correct

### ❌ Error 3: "undefined columns" or "missing required field"
**Cause:** Form is missing required data
**Solution:** Check origin_country and dest_country are being set

### ❌ Error 4: "could not serialize access due to concurrent update"
**Cause:** Database lock
**Solution:** Retry the submission

---

## Quick Check: RLS Policy

Your RLS policy for quote INSERT should be:

```sql
CREATE POLICY "Anyone can submit a quote"
  ON public.quotes FOR INSERT WITH CHECK (true);
```

**To verify:**

1. Go to Supabase Dashboard → https://supabase.com/dashboard
2. Select your project
3. Go to **SQL Editor**
4. Run this query:

```sql
SELECT polname, qual FROM pg_policies 
WHERE tablename = 'quotes' AND polname LIKE '%submit%';
```

**Should return:**
```
polname                   | qual
--------------------------|------
Anyone can submit a quote  | true
```

If no results, the policy is missing. Run this to fix:

```sql
CREATE POLICY "Anyone can submit a quote"
  ON public.quotes FOR INSERT WITH CHECK (true);
```

---

## Check: Origin/Destination Country

The form might not be setting `origin_country` and `dest_country`. 

**Look at line 112 in quote page:**

```typescript
<input placeholder="City, Country" className="input-field" value={form.origin_city}
  onChange={e => set("origin_city", e.target.value)} />
```

**Problem:** Only setting `origin_city`, not splitting into city + country.

**Fix (if this is the issue):**

```typescript
// Near top of component, add these states:
const [originCountry, setOriginCountry] = useState("Vietnam");
const [destCountry, setDestCountry] = useState("");

// In form submission, add:
const { error } = await supabase.from("quotes").insert({
  ...form,
  origin_country: originCountry,  // ← Add this
  dest_country: destCountry,      // ← Add this
  // ... rest of fields
});

// In the form, change origin input:
<div>
  <label className="block text-sm font-medium text-gray-700 mb-1.5">Origin Country</label>
  <input className="input-field" value={originCountry} 
    onChange={e => setOriginCountry(e.target.value)} placeholder="e.g. Vietnam" />
</div>
<div>
  <label className="block text-sm font-medium text-gray-700 mb-1.5">Origin City</label>
  <input className="input-field" value={form.origin_city}
    onChange={e => set("origin_city", e.target.value)} placeholder="e.g. Ho Chi Minh City" />
</div>

// Same for destination
<div>
  <label className="block text-sm font-medium text-gray-700 mb-1.5">Destination Country</label>
  <input className="input-field" value={destCountry} 
    onChange={e => setDestCountry(e.target.value)} placeholder="e.g. United States" />
</div>
<div>
  <label className="block text-sm font-medium text-gray-700 mb-1.5">Destination City</label>
  <input className="input-field" value={form.dest_city}
    onChange={e => set("dest_city", e.target.value)} placeholder="e.g. Los Angeles" />
</div>
```

---

## Checklist: Most Common Issues

- [ ] **RLS policy exists?** Run the SQL query above in Supabase
- [ ] **Environment variables set?** Check `.env.local` has NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY
- [ ] **Origin/dest country filled?** Form should send both city AND country
- [ ] **Weight and volume both filled?** Calculator needs both to show estimate
- [ ] **Email format valid?** Check it's a real email format
- [ ] **Supabase project active?** Log into Supabase dashboard and verify project exists

---

## Nuclear Option: Manual Test in Supabase

Insert a quote directly in Supabase to verify table is working:

1. Go to Supabase Dashboard → SQL Editor
2. Run:

```sql
INSERT INTO public.quotes (
  contact_name, contact_email, contact_phone, company,
  service_type, origin_country, origin_city, dest_country, dest_city,
  cargo_type, weight_kg, volume_cbm, pieces, incoterm,
  estimated_price_usd, status
) VALUES (
  'Test User', 'test@example.com', '0912345678', 'Test Corp',
  'air', 'Vietnam', 'Ho Chi Minh City', 'United States', 'Los Angeles',
  'Electronics', 100, 0.5, 1, 'FOB',
  645, 'pending'
);
```

If this works, the table is fine. If it fails, you'll see the actual error.

---

## After Getting the Error

**Reply with the exact error message from the browser console**, and I'll help you fix it specifically!

Common patterns:
- `"INSERT into ..." — permission denied` → RLS issue
- `"new row violates row-level security"` → RLS policy missing
- `"unknown column"` → Field name typo
- `"undefined is not an object"` → Environment variable missing
