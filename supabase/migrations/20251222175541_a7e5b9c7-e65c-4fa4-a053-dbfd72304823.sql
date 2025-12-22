-- Add map_image_url column to properties table for custom map images
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS map_image_url TEXT;