-- Add checkpoint coordinates columns to property_lotes
ALTER TABLE public.property_lotes 
ADD COLUMN checkpoint_latitude double precision DEFAULT NULL,
ADD COLUMN checkpoint_longitude double precision DEFAULT NULL;

-- Add comment for clarity
COMMENT ON COLUMN public.property_lotes.checkpoint_latitude IS 'Latitude of mandatory waypoint before reaching destination';
COMMENT ON COLUMN public.property_lotes.checkpoint_longitude IS 'Longitude of mandatory waypoint before reaching destination';