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
      AND (
        upa.can_manage = true
        OR EXISTS (
          SELECT 1 FROM public.user_roles ur
          WHERE ur.user_id = _user_id AND ur.role = 'portero'::public.app_role
        )
      )
  )
$$;
