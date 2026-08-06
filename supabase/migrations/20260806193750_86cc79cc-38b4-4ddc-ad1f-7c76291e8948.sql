ALTER TABLE public.user_property_access
  ADD COLUMN IF NOT EXISTS can_manage boolean NOT NULL DEFAULT false;

CREATE OR REPLACE FUNCTION public.can_manage_property(_user_id uuid, _property_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_property_access upa
    JOIN public.profiles p ON p.id = upa.profile_id
    WHERE p.user_id = _user_id
      AND p.is_active = true
      AND upa.property_id = _property_id
      AND upa.can_manage = true
  )
$$;

-- properties
CREATE POLICY "Managers can view assigned properties"
ON public.properties FOR SELECT TO authenticated
USING (public.can_manage_property(auth.uid(), id));

CREATE POLICY "Managers can update assigned properties"
ON public.properties FOR UPDATE TO authenticated
USING (public.can_manage_property(auth.uid(), id))
WITH CHECK (public.can_manage_property(auth.uid(), id));

-- property_lotes
CREATE POLICY "Managers can view lotes of assigned properties"
ON public.property_lotes FOR SELECT TO authenticated
USING (public.can_manage_property(auth.uid(), property_id));

CREATE POLICY "Managers can insert lotes in assigned properties"
ON public.property_lotes FOR INSERT TO authenticated
WITH CHECK (public.can_manage_property(auth.uid(), property_id));

CREATE POLICY "Managers can update lotes of assigned properties"
ON public.property_lotes FOR UPDATE TO authenticated
USING (public.can_manage_property(auth.uid(), property_id))
WITH CHECK (public.can_manage_property(auth.uid(), property_id));

CREATE POLICY "Managers can delete lotes of assigned properties"
ON public.property_lotes FOR DELETE TO authenticated
USING (public.can_manage_property(auth.uid(), property_id));

-- lote_checkpoints
CREATE POLICY "Managers can view checkpoints of assigned properties"
ON public.lote_checkpoints FOR SELECT TO authenticated
USING (EXISTS (SELECT 1 FROM public.property_lotes pl WHERE pl.id = lote_checkpoints.lote_id AND public.can_manage_property(auth.uid(), pl.property_id)));

CREATE POLICY "Managers can insert checkpoints of assigned properties"
ON public.lote_checkpoints FOR INSERT TO authenticated
WITH CHECK (EXISTS (SELECT 1 FROM public.property_lotes pl WHERE pl.id = lote_checkpoints.lote_id AND public.can_manage_property(auth.uid(), pl.property_id)));

CREATE POLICY "Managers can update checkpoints of assigned properties"
ON public.lote_checkpoints FOR UPDATE TO authenticated
USING (EXISTS (SELECT 1 FROM public.property_lotes pl WHERE pl.id = lote_checkpoints.lote_id AND public.can_manage_property(auth.uid(), pl.property_id)))
WITH CHECK (EXISTS (SELECT 1 FROM public.property_lotes pl WHERE pl.id = lote_checkpoints.lote_id AND public.can_manage_property(auth.uid(), pl.property_id)));

CREATE POLICY "Managers can delete checkpoints of assigned properties"
ON public.lote_checkpoints FOR DELETE TO authenticated
USING (EXISTS (SELECT 1 FROM public.property_lotes pl WHERE pl.id = lote_checkpoints.lote_id AND public.can_manage_property(auth.uid(), pl.property_id)));

INSERT INTO public.properties (name, slug, latitude, longitude, address, description, is_active)
SELECT 'CINTURON VERDE', 'cinturon-verde', 6.094195, -75.497114, NULL, 'Unidad CINTURON VERDE', true
WHERE NOT EXISTS (SELECT 1 FROM public.properties WHERE slug = 'cinturon-verde');
