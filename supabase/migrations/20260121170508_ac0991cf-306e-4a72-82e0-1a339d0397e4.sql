-- Create table for multiple checkpoints per lote
CREATE TABLE public.lote_checkpoints (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  lote_id UUID NOT NULL REFERENCES public.property_lotes(id) ON DELETE CASCADE,
  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,
  orden INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.lote_checkpoints ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Anyone can view checkpoints of active properties"
ON public.lote_checkpoints
FOR SELECT
USING (EXISTS (
  SELECT 1 FROM property_lotes pl
  JOIN properties p ON p.id = pl.property_id
  WHERE pl.id = lote_checkpoints.lote_id AND p.is_active = true
));

CREATE POLICY "Admins can view all checkpoints"
ON public.lote_checkpoints
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can insert checkpoints"
ON public.lote_checkpoints
FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update checkpoints"
ON public.lote_checkpoints
FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete checkpoints"
ON public.lote_checkpoints
FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create index for faster lookups
CREATE INDEX idx_lote_checkpoints_lote_id ON public.lote_checkpoints(lote_id);
CREATE INDEX idx_lote_checkpoints_orden ON public.lote_checkpoints(lote_id, orden);