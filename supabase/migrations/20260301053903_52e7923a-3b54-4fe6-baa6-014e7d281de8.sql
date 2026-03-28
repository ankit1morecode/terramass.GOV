
-- Add vehicle columns to profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS vehicle_name text,
  ADD COLUMN IF NOT EXISTS vehicle_plate text,
  ADD COLUMN IF NOT EXISTS vehicle_type text;

-- Update the handle_new_user trigger to also copy vehicle info
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, display_name, vehicle_name, vehicle_plate, vehicle_type)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data ->> 'display_name',
    NEW.raw_user_meta_data ->> 'vehicle_name',
    NEW.raw_user_meta_data ->> 'vehicle_plate',
    NEW.raw_user_meta_data ->> 'vehicle_type'
  );
  RETURN NEW;
END;
$$;
