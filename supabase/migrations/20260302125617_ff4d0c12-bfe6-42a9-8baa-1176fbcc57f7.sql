
-- Drivers table (no auth, public access)
CREATE TABLE public.drivers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  display_name text NOT NULL,
  vehicle_name text DEFAULT 'My Vehicle',
  vehicle_plate text DEFAULT 'XX-00-XX-0000',
  vehicle_type text DEFAULT 'truck',
  password text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.drivers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read drivers" ON public.drivers FOR SELECT USING (true);
CREATE POLICY "Public insert drivers" ON public.drivers FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update drivers" ON public.drivers FOR UPDATE USING (true);
CREATE POLICY "Public delete drivers" ON public.drivers FOR DELETE USING (true);

-- Driver messages table
CREATE TABLE public.driver_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  driver_id uuid NOT NULL REFERENCES public.drivers(id) ON DELETE CASCADE,
  message text NOT NULL,
  read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.driver_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read driver_messages" ON public.driver_messages FOR SELECT USING (true);
CREATE POLICY "Public insert driver_messages" ON public.driver_messages FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update driver_messages" ON public.driver_messages FOR UPDATE USING (true);
CREATE POLICY "Public delete driver_messages" ON public.driver_messages FOR DELETE USING (true);
