-- ═══════════════════════════════════════════════════════════
-- FIX: Infinite Recursion in RLS Policies
-- Run this in Supabase SQL Editor to fix the quote submission error
-- ═══════════════════════════════════════════════════════════

-- Step 1: Drop problematic policies
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins have full access to shipments" ON public.shipments;
DROP POLICY IF EXISTS "Admins can manage tracking events" ON public.tracking_events;
DROP POLICY IF EXISTS "Admins have full access to quotes" ON public.quotes;

-- Step 2: Create helper function (SECURITY DEFINER avoids infinite recursion)
CREATE OR REPLACE FUNCTION public.is_admin(user_id UUID)
RETURNS boolean AS $$
DECLARE
  user_role TEXT;
BEGIN
  SELECT role INTO user_role FROM public.profiles WHERE id = user_id LIMIT 1;
  RETURN user_role = 'admin';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 3: Recreate policies using the helper function
CREATE POLICY "Admins can view all profiles"
  ON public.profiles FOR SELECT
  USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins have full access to shipments"
  ON public.shipments FOR ALL
  USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins can manage tracking events"
  ON public.tracking_events FOR ALL
  USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins have full access to quotes"
  ON public.quotes FOR ALL
  USING (public.is_admin(auth.uid()));

-- Done! Now try submitting a quote again
