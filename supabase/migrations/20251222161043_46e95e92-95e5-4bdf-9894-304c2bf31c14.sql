-- Create table for lots/houses per property
CREATE TABLE public.property_lotes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  property_id UUID NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  numero TEXT NOT NULL,
  tipo TEXT NOT NULL DEFAULT 'lote' CHECK (tipo IN ('lote', 'casa')),
  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(property_id, numero, tipo)
);

-- Enable RLS
ALTER TABLE public.property_lotes ENABLE ROW LEVEL SECURITY;

-- Anyone can view lotes of active properties
CREATE POLICY "Anyone can view lotes of active properties"
ON public.property_lotes
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.properties 
    WHERE id = property_id AND is_active = true
  )
);

-- Admins can view all lotes
CREATE POLICY "Admins can view all lotes"
ON public.property_lotes
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- Admins can insert lotes
CREATE POLICY "Admins can insert lotes"
ON public.property_lotes
FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Admins can update lotes
CREATE POLICY "Admins can update lotes"
ON public.property_lotes
FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Admins can delete lotes
CREATE POLICY "Admins can delete lotes"
ON public.property_lotes
FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create trigger for updated_at
CREATE TRIGGER update_property_lotes_updated_at
BEFORE UPDATE ON public.property_lotes
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();