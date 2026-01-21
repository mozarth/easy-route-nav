-- Drop and recreate policies for properties table as PERMISSIVE
DROP POLICY IF EXISTS "Anyone can view active properties" ON public.properties;
DROP POLICY IF EXISTS "Admins can view all properties" ON public.properties;
DROP POLICY IF EXISTS "Admins can insert properties" ON public.properties;
DROP POLICY IF EXISTS "Admins can update properties" ON public.properties;
DROP POLICY IF EXISTS "Admins can delete properties" ON public.properties;

CREATE POLICY "Anyone can view active properties" 
ON public.properties 
FOR SELECT 
TO public
USING (is_active = true);

CREATE POLICY "Admins can view all properties" 
ON public.properties 
FOR SELECT 
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can insert properties" 
ON public.properties 
FOR INSERT 
TO authenticated
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update properties" 
ON public.properties 
FOR UPDATE 
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete properties" 
ON public.properties 
FOR DELETE 
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- Drop and recreate policies for property_lotes table as PERMISSIVE
DROP POLICY IF EXISTS "Anyone can view lotes of active properties" ON public.property_lotes;
DROP POLICY IF EXISTS "Admins can view all lotes" ON public.property_lotes;
DROP POLICY IF EXISTS "Admins can insert lotes" ON public.property_lotes;
DROP POLICY IF EXISTS "Admins can update lotes" ON public.property_lotes;
DROP POLICY IF EXISTS "Admins can delete lotes" ON public.property_lotes;

CREATE POLICY "Anyone can view lotes of active properties" 
ON public.property_lotes 
FOR SELECT 
TO public
USING (EXISTS (
  SELECT 1 FROM properties 
  WHERE properties.id = property_lotes.property_id 
  AND properties.is_active = true
));

CREATE POLICY "Admins can view all lotes" 
ON public.property_lotes 
FOR SELECT 
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can insert lotes" 
ON public.property_lotes 
FOR INSERT 
TO authenticated
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update lotes" 
ON public.property_lotes 
FOR UPDATE 
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete lotes" 
ON public.property_lotes 
FOR DELETE 
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- Drop and recreate policies for lote_checkpoints table as PERMISSIVE
DROP POLICY IF EXISTS "Anyone can view checkpoints of active properties" ON public.lote_checkpoints;
DROP POLICY IF EXISTS "Admins can view all checkpoints" ON public.lote_checkpoints;
DROP POLICY IF EXISTS "Admins can insert checkpoints" ON public.lote_checkpoints;
DROP POLICY IF EXISTS "Admins can update checkpoints" ON public.lote_checkpoints;
DROP POLICY IF EXISTS "Admins can delete checkpoints" ON public.lote_checkpoints;

CREATE POLICY "Anyone can view checkpoints of active properties" 
ON public.lote_checkpoints 
FOR SELECT 
TO public
USING (EXISTS (
  SELECT 1 FROM property_lotes pl
  JOIN properties p ON p.id = pl.property_id
  WHERE pl.id = lote_checkpoints.lote_id AND p.is_active = true
));

CREATE POLICY "Admins can view all checkpoints" 
ON public.lote_checkpoints 
FOR SELECT 
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can insert checkpoints" 
ON public.lote_checkpoints 
FOR INSERT 
TO authenticated
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update checkpoints" 
ON public.lote_checkpoints 
FOR UPDATE 
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete checkpoints" 
ON public.lote_checkpoints 
FOR DELETE 
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));