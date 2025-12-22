import { supabase } from '@/integrations/supabase/client';

// Types matching the Supabase schema
export interface Property {
  id: string;
  name: string;
  slug: string;
  latitude: number;
  longitude: number;
  address?: string | null;
  description?: string | null;
  etapa?: string | null;
  isActive: boolean;
  hasCustomMap?: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface AccessLog {
  id: string;
  propertyId: string;
  propertyName: string;
  accessedAt: Date;
  deviceType: 'mobile' | 'tablet' | 'desktop';
  userAgent: string | null;
}

// Transform Supabase row to Property
const transformProperty = (row: any): Property => ({
  id: row.id,
  name: row.name,
  slug: row.slug,
  latitude: row.latitude,
  longitude: row.longitude,
  address: row.address,
  description: row.description,
  etapa: row.etapa,
  isActive: row.is_active,
  hasCustomMap: row.has_custom_map,
  createdAt: new Date(row.created_at),
  updatedAt: new Date(row.updated_at),
});

// Transform Supabase row to AccessLog
const transformAccessLog = (row: any): AccessLog => ({
  id: row.id,
  propertyId: row.property_id,
  propertyName: row.property_name,
  accessedAt: new Date(row.accessed_at),
  deviceType: row.device_type as 'mobile' | 'tablet' | 'desktop',
  userAgent: row.user_agent,
});

// ============ PROPERTIES ============

// Get all properties
export const getProperties = async (): Promise<Property[]> => {
  const { data, error } = await supabase
    .from('properties')
    .select('*')
    .order('name', { ascending: true });

  if (error) {
    console.error('Error fetching properties:', error);
    return [];
  }

  return (data || []).map(transformProperty);
};

// Get property by slug (for public pages - only active ones)
export const getPropertyBySlug = async (slug: string): Promise<Property | null> => {
  const { data, error } = await supabase
    .from('properties')
    .select('*')
    .eq('slug', slug)
    .eq('is_active', true)
    .maybeSingle();

  if (error) {
    console.error('Error fetching property by slug:', error);
    return null;
  }

  return data ? transformProperty(data) : null;
};

// Get property by ID
export const getPropertyById = async (id: string): Promise<Property | null> => {
  const { data, error } = await supabase
    .from('properties')
    .select('*')
    .eq('id', id)
    .maybeSingle();

  if (error) {
    console.error('Error fetching property by id:', error);
    return null;
  }

  return data ? transformProperty(data) : null;
};

// Save property (insert or update)
export const saveProperty = async (property: Partial<Property> & { name: string; slug: string; latitude: number; longitude: number }): Promise<Property | null> => {
  const payload = {
    name: property.name,
    slug: property.slug,
    latitude: property.latitude,
    longitude: property.longitude,
    address: property.address || null,
    description: property.description || null,
    etapa: property.etapa || null,
    is_active: property.isActive ?? true,
    has_custom_map: property.hasCustomMap ?? false,
  };

  if (property.id) {
    // Update
    const { data, error } = await supabase
      .from('properties')
      .update(payload)
      .eq('id', property.id)
      .select()
      .single();

    if (error) {
      console.error('Error updating property:', error);
      return null;
    }

    return transformProperty(data);
  } else {
    // Insert
    const { data, error } = await supabase
      .from('properties')
      .insert(payload)
      .select()
      .single();

    if (error) {
      console.error('Error inserting property:', error);
      return null;
    }

    return transformProperty(data);
  }
};

// Delete property
export const deleteProperty = async (id: string): Promise<boolean> => {
  const { error } = await supabase
    .from('properties')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting property:', error);
    return false;
  }

  return true;
};

// Toggle property active status
export const togglePropertyActive = async (id: string): Promise<boolean> => {
  // First get current status
  const { data: current, error: fetchError } = await supabase
    .from('properties')
    .select('is_active')
    .eq('id', id)
    .single();

  if (fetchError || !current) {
    console.error('Error fetching property status:', fetchError);
    return false;
  }

  // Update to opposite
  const { error } = await supabase
    .from('properties')
    .update({ is_active: !current.is_active })
    .eq('id', id);

  if (error) {
    console.error('Error toggling property active:', error);
    return false;
  }

  return true;
};

// ============ ACCESS LOGS ============

// Get all access logs
export const getAccessLogs = async (): Promise<AccessLog[]> => {
  const { data, error } = await supabase
    .from('access_logs')
    .select('*')
    .order('accessed_at', { ascending: false })
    .limit(1000);

  if (error) {
    console.error('Error fetching access logs:', error);
    return [];
  }

  return (data || []).map(transformAccessLog);
};

// Log access (public - anyone can insert)
export const logAccess = async (propertyId: string, propertyName: string): Promise<void> => {
  const deviceType = detectDeviceType();

  const { error } = await supabase
    .from('access_logs')
    .insert({
      property_id: propertyId,
      property_name: propertyName,
      device_type: deviceType,
      user_agent: navigator.userAgent,
    });

  if (error) {
    console.error('Error logging access:', error);
  }
};

// Detect device type
export const detectDeviceType = (): 'mobile' | 'tablet' | 'desktop' => {
  const ua = navigator.userAgent.toLowerCase();
  if (/(tablet|ipad|playbook|silk)|(android(?!.*mobi))/i.test(ua)) {
    return 'tablet';
  }
  if (/mobile|android|iphone|ipod|blackberry|opera mini|iemobile/i.test(ua)) {
    return 'mobile';
  }
  return 'desktop';
};

// Clear access logs (admin only)
export const clearAccessLogs = async (): Promise<boolean> => {
  // This will fail if user is not admin due to RLS
  const { error } = await supabase
    .from('access_logs')
    .delete()
    .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all (workaround)

  if (error) {
    console.error('Error clearing access logs:', error);
    return false;
  }

  return true;
};
