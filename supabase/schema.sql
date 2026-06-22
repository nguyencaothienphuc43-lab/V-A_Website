-- ═══════════════════════════════════════════════════════════
-- V&A Express — Supabase Schema
-- Run this in your Supabase SQL Editor
-- ═══════════════════════════════════════════════════════════

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ─────────────────────────────────────────────────────────
-- PROFILES (extends Supabase Auth users)
-- ─────────────────────────────────────────────────────────
CREATE TABLE public.profiles (
  id          UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  full_name   TEXT,
  company     TEXT,
  phone       TEXT,
  role        TEXT NOT NULL DEFAULT 'customer' CHECK (role IN ('customer', 'admin')),
  preferred_locale TEXT DEFAULT 'en',
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Helper function to check if user is admin (avoids infinite recursion)
CREATE OR REPLACE FUNCTION public.is_admin(user_id UUID)
RETURNS boolean AS $$
DECLARE
  user_role TEXT;
BEGIN
  SELECT role INTO user_role FROM public.profiles WHERE id = user_id LIMIT 1;
  RETURN user_role = 'admin';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Admins can view all profiles"
  ON public.profiles FOR SELECT
  USING (public.is_admin(auth.uid()));

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name)
  VALUES (NEW.id, NEW.raw_user_meta_data->>'full_name');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ─────────────────────────────────────────────────────────
-- SHIPMENTS
-- ─────────────────────────────────────────────────────────
CREATE TABLE public.shipments (
  id                  UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  tracking_number     TEXT UNIQUE NOT NULL,
  customer_id         UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  customer_name       TEXT,
  customer_email      TEXT,
  service_type        TEXT NOT NULL CHECK (service_type IN ('air', 'sea', 'road')),

  -- Route
  origin_country      TEXT NOT NULL,
  origin_city         TEXT NOT NULL,
  dest_country        TEXT NOT NULL,
  dest_city           TEXT NOT NULL,

  -- Cargo
  description         TEXT,
  weight_kg           DECIMAL(10,2),
  volume_cbm          DECIMAL(10,3),
  pieces              INT DEFAULT 1,

  -- Status
  status              TEXT NOT NULL DEFAULT 'pending'
                        CHECK (status IN ('pending','picked_up','in_transit','customs','out_for_delivery','delivered','exception','cancelled')),
  estimated_delivery  DATE,
  actual_delivery     DATE,

  -- Internal
  notes               TEXT,
  created_at          TIMESTAMPTZ DEFAULT NOW(),
  updated_at          TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.shipments ENABLE ROW LEVEL SECURITY;

-- Public can read shipments only by tracking number (via API route)
CREATE POLICY "Customers see their own shipments"
  ON public.shipments FOR SELECT
  USING (customer_id = auth.uid());

CREATE POLICY "Admins have full access to shipments"
  ON public.shipments FOR ALL
  USING (public.is_admin(auth.uid()));

-- ─────────────────────────────────────────────────────────
-- TRACKING EVENTS
-- ─────────────────────────────────────────────────────────
CREATE TABLE public.tracking_events (
  id            UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  shipment_id   UUID REFERENCES public.shipments(id) ON DELETE CASCADE NOT NULL,
  location      TEXT NOT NULL,
  status        TEXT NOT NULL,
  description   TEXT,
  description_vi TEXT,
  event_time    TIMESTAMPTZ DEFAULT NOW(),
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.tracking_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tracking events are publicly readable" -- via service role in API
  ON public.tracking_events FOR SELECT USING (true);

CREATE POLICY "Admins can manage tracking events"
  ON public.tracking_events FOR ALL
  USING (public.is_admin(auth.uid()));

-- ─────────────────────────────────────────────────────────
-- QUOTES
-- ─────────────────────────────────────────────────────────
CREATE TABLE public.quotes (
  id                UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  customer_id       UUID REFERENCES public.profiles(id) ON DELETE SET NULL,

  -- Contact (for guest submissions)
  contact_name      TEXT NOT NULL,
  contact_email     TEXT NOT NULL,
  contact_phone     TEXT,
  company           TEXT,

  -- Shipment details
  service_type      TEXT CHECK (service_type IN ('air', 'sea', 'road')),
  origin_country    TEXT,
  origin_city       TEXT,
  dest_country      TEXT,
  dest_city         TEXT,
  cargo_type        TEXT,
  weight_kg         DECIMAL(10,2),
  volume_cbm        DECIMAL(10,3),
  pieces            INT,
  incoterm          TEXT,
  special_requirements TEXT,

  -- Quote calculator result (from frontend)
  estimated_price_usd DECIMAL(10,2),

  -- Admin
  status            TEXT NOT NULL DEFAULT 'pending'
                      CHECK (status IN ('pending','reviewing','quoted','accepted','declined')),
  admin_notes       TEXT,
  final_price_usd   DECIMAL(10,2),
  valid_until       DATE,

  created_at        TIMESTAMPTZ DEFAULT NOW(),
  updated_at        TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.quotes ENABLE ROW LEVEL SECURITY;

-- Anyone can INSERT a quote (guest or logged in)
CREATE POLICY "Anyone can submit a quote"
  ON public.quotes FOR INSERT WITH CHECK (true);

CREATE POLICY "Customers can view their own quotes"
  ON public.quotes FOR SELECT
  USING (customer_id = auth.uid() OR contact_email = (
    SELECT email FROM auth.users WHERE id = auth.uid()
  ));

CREATE POLICY "Admins have full access to quotes"
  ON public.quotes FOR ALL
  USING (public.is_admin(auth.uid()));

-- ─────────────────────────────────────────────────────────
-- CONTACT MESSAGES (from the public Contact page)
-- ─────────────────────────────────────────────────────────
CREATE TABLE public.contact_messages (
  id          UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name        TEXT,
  email       TEXT NOT NULL,
  phone       TEXT,
  message     TEXT NOT NULL,
  status      TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new','read','replied','archived')),
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.contact_messages ENABLE ROW LEVEL SECURITY;

-- Anyone (guest) can submit a contact message
CREATE POLICY "Anyone can submit a contact message"
  ON public.contact_messages FOR INSERT WITH CHECK (true);

-- Only admins can read / manage them
CREATE POLICY "Admins can manage contact messages"
  ON public.contact_messages FOR ALL
  USING (public.is_admin(auth.uid()));

-- ─────────────────────────────────────────────────────────
-- INDEXES
-- ─────────────────────────────────────────────────────────
CREATE INDEX idx_shipments_tracking       ON public.shipments(tracking_number);
CREATE INDEX idx_shipments_customer       ON public.shipments(customer_id);
CREATE INDEX idx_shipments_status         ON public.shipments(status);
CREATE INDEX idx_tracking_events_shipment ON public.tracking_events(shipment_id);
CREATE INDEX idx_quotes_customer          ON public.quotes(customer_id);
CREATE INDEX idx_quotes_status            ON public.quotes(status);
CREATE INDEX idx_contact_messages_status  ON public.contact_messages(status);

-- ─────────────────────────────────────────────────────────
-- SAMPLE DATA (optional, for testing)
-- ─────────────────────────────────────────────────────────
INSERT INTO public.shipments (tracking_number, service_type, origin_country, origin_city, dest_country, dest_city, description, weight_kg, status, estimated_delivery)
VALUES
  ('VAX-20240001', 'air', 'Vietnam', 'Ho Chi Minh City', 'United States', 'Los Angeles', 'Electronics components', 125.5, 'in_transit', CURRENT_DATE + 3),
  ('VAX-20240002', 'sea', 'Vietnam', 'Hai Phong', 'Germany', 'Hamburg', 'Furniture', 2400.0, 'customs', CURRENT_DATE + 14),
  ('VAX-20240003', 'air', 'Vietnam', 'Hanoi', 'Japan', 'Tokyo', 'Garments', 85.0, 'out_for_delivery', CURRENT_DATE + 1);

-- Tracking events for first shipment
WITH s AS (SELECT id FROM public.shipments WHERE tracking_number = 'VAX-20240001')
INSERT INTO public.tracking_events (shipment_id, location, status, description, description_vi, event_time) VALUES
  ((SELECT id FROM s), 'Ho Chi Minh City, VN',   'Shipment picked up',       'Package collected from sender',              'Hàng đã được lấy từ người gửi',        NOW() - INTERVAL '3 days'),
  ((SELECT id FROM s), 'Tan Son Nhat Airport, VN','Departed origin airport',  'Shipment departed from Tan Son Nhat Airport','Hàng đã rời sân bay Tân Sơn Nhất',      NOW() - INTERVAL '2 days'),
  ((SELECT id FROM s), 'Incheon Airport, KR',     'Transit hub',             'Arrived at transit hub in Seoul',            'Đến trung chuyển Seoul',               NOW() - INTERVAL '1 day'),
  ((SELECT id FROM s), 'Los Angeles Airport, US', 'Arrived destination',     'Arrived at LAX, awaiting customs clearance', 'Đến LAX, chờ thông quan',              NOW() - INTERVAL '4 hours');
