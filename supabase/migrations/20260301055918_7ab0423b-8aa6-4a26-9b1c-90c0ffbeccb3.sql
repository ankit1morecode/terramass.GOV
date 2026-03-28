
-- Create vehicle telemetry table for real-time MQTT data
CREATE TABLE public.vehicle_telemetry (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_id text NOT NULL,
  vehicle_name text,
  vehicle_plate text,
  driver text,
  vehicle_type text DEFAULT 'truck',
  speed real NOT NULL DEFAULT 0,
  safe_speed real NOT NULL DEFAULT 0,
  slope real NOT NULL DEFAULT 0,
  grip_coefficient real NOT NULL DEFAULT 0.5,
  load real NOT NULL DEFAULT 0,
  throttle real NOT NULL DEFAULT 0,
  deceleration real NOT NULL DEFAULT 0,
  braking_distance real NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'safe',
  latitude real,
  longitude real,
  location text,
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(vehicle_id)
);

-- Enable RLS
ALTER TABLE public.vehicle_telemetry ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read telemetry (it's operational data)
CREATE POLICY "Authenticated users can read telemetry"
  ON public.vehicle_telemetry FOR SELECT
  TO authenticated
  USING (true);

-- Allow edge function (service role) to insert/update via webhook
-- No INSERT/UPDATE policy needed for anon since webhook uses service role

-- Enable Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.vehicle_telemetry;
