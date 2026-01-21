-- Add custom_route_url column to property_lotes table
ALTER TABLE public.property_lotes 
ADD COLUMN custom_route_url text DEFAULT NULL;

-- Set the custom route URL for lote 13 etapa 2 (COLINAS DE JUANITO LAGUNA)
UPDATE public.property_lotes 
SET custom_route_url = 'https://maps.app.goo.gl/s7msn8YYuUJX2M378'
WHERE numero = '13' 
AND property_id = (
  SELECT id FROM public.properties 
  WHERE slug = 'colinas-de-juanito-laguna-etapa-2'
);