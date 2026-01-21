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
  mapImageUrl?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface LoteCheckpoint {
  id: string;
  loteId: string;
  latitude: number;
  longitude: number;
  orden: number;
  createdAt: Date;
}

export interface PropertyLote {
  id: string;
  propertyId: string;
  numero: string;
  tipo: 'lote' | 'casa';
  latitude: number;
  longitude: number;
  imageUrl?: string | null;
  customRouteUrl?: string | null;
  checkpointLatitude?: number | null;
  checkpointLongitude?: number | null;
  checkpoints?: LoteCheckpoint[];
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
  mapImageUrl: row.map_image_url,
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

// Transform checkpoint row
const transformCheckpoint = (row: any): LoteCheckpoint => ({
  id: row.id,
  loteId: row.lote_id,
  latitude: row.latitude,
  longitude: row.longitude,
  orden: row.orden,
  createdAt: new Date(row.created_at),
});

// Transform Supabase row to PropertyLote
const transformPropertyLote = (row: any, checkpoints?: LoteCheckpoint[]): PropertyLote => ({
  id: row.id,
  propertyId: row.property_id,
  numero: row.numero,
  tipo: row.tipo as 'lote' | 'casa',
  latitude: row.latitude,
  longitude: row.longitude,
  imageUrl: row.image_url,
  customRouteUrl: row.custom_route_url,
  checkpointLatitude: row.checkpoint_latitude,
  checkpointLongitude: row.checkpoint_longitude,
  checkpoints: checkpoints || [],
  createdAt: new Date(row.created_at),
  updatedAt: new Date(row.updated_at),
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
    map_image_url: property.mapImageUrl ?? null,
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

// ============ LOTE CHECKPOINTS ============

// Get checkpoints by lote ID
export const getCheckpointsByLoteId = async (loteId: string): Promise<LoteCheckpoint[]> => {
  const { data, error } = await supabase
    .from('lote_checkpoints')
    .select('*')
    .eq('lote_id', loteId)
    .order('orden', { ascending: true });

  if (error) {
    console.error('Error fetching checkpoints:', error);
    return [];
  }

  return (data || []).map(transformCheckpoint);
};

// Save checkpoints for a lote (replaces all existing)
export const saveCheckpointsForLote = async (
  loteId: string,
  checkpoints: Array<{ latitude: number; longitude: number; orden: number }>
): Promise<boolean> => {
  // Delete existing checkpoints
  const { error: deleteError } = await supabase
    .from('lote_checkpoints')
    .delete()
    .eq('lote_id', loteId);

  if (deleteError) {
    console.error('Error deleting old checkpoints:', deleteError);
    return false;
  }

  // Insert new ones if any
  if (checkpoints.length > 0) {
    const { error: insertError } = await supabase
      .from('lote_checkpoints')
      .insert(
        checkpoints.map((cp) => ({
          lote_id: loteId,
          latitude: cp.latitude,
          longitude: cp.longitude,
          orden: cp.orden,
        }))
      );

    if (insertError) {
      console.error('Error inserting checkpoints:', insertError);
      return false;
    }
  }

  return true;
};

// Generate custom route URL with multiple waypoints
export const generateCustomRouteUrl = (
  origin: { latitude: number; longitude: number },
  destination: { latitude: number; longitude: number },
  waypoints: Array<{ latitude: number; longitude: number }>
): string => {
  const waypointsStr = waypoints
    .map((wp) => `${wp.latitude},${wp.longitude}`)
    .join('|');

  return `https://www.google.com/maps/dir/?api=1&origin=${origin.latitude},${origin.longitude}&destination=${destination.latitude},${destination.longitude}&waypoints=${waypointsStr}&travelmode=driving`;
};

// ============ PROPERTY LOTES ============

// Get lotes by property ID (includes checkpoints)
export const getLotesByPropertyId = async (propertyId: string): Promise<PropertyLote[]> => {
  const { data, error } = await supabase
    .from('property_lotes')
    .select('*')
    .eq('property_id', propertyId)
    .order('numero', { ascending: true });

  if (error) {
    console.error('Error fetching lotes:', error);
    return [];
  }

  // Fetch checkpoints for all lotes
  const loteIds = (data || []).map((l) => l.id);
  let checkpointsMap: Record<string, LoteCheckpoint[]> = {};

  if (loteIds.length > 0) {
    const { data: checkpointsData } = await supabase
      .from('lote_checkpoints')
      .select('*')
      .in('lote_id', loteIds)
      .order('orden', { ascending: true });

    if (checkpointsData) {
      checkpointsData.forEach((cp) => {
        const checkpoint = transformCheckpoint(cp);
        if (!checkpointsMap[cp.lote_id]) {
          checkpointsMap[cp.lote_id] = [];
        }
        checkpointsMap[cp.lote_id].push(checkpoint);
      });
    }
  }

  return (data || []).map((row) => transformPropertyLote(row, checkpointsMap[row.id] || []));
};

// Get single lote with checkpoints
export const getLoteById = async (loteId: string): Promise<PropertyLote | null> => {
  const { data, error } = await supabase
    .from('property_lotes')
    .select('*')
    .eq('id', loteId)
    .maybeSingle();

  if (error || !data) {
    console.error('Error fetching lote:', error);
    return null;
  }

  const checkpoints = await getCheckpointsByLoteId(loteId);
  return transformPropertyLote(data, checkpoints);
};

// Save lote (insert or update) with checkpoints
export const saveLote = async (
  lote: Partial<PropertyLote> & {
    propertyId: string;
    numero: string;
    tipo: 'lote' | 'casa';
    latitude: number;
    longitude: number;
  },
  checkpoints?: Array<{ latitude: number; longitude: number; orden: number }>
): Promise<PropertyLote | null> => {
  // Get property coordinates for route URL generation
  const { data: propData } = await supabase
    .from('properties')
    .select('latitude, longitude')
    .eq('id', lote.propertyId)
    .single();

  // Calculate custom route URL with all checkpoints (both legacy single + new multiple)
  let customRouteUrl: string | null = null;
  const allWaypoints: Array<{ latitude: number; longitude: number }> = [];

  // Add legacy single checkpoint if provided
  if (lote.checkpointLatitude && lote.checkpointLongitude) {
    allWaypoints.push({
      latitude: lote.checkpointLatitude,
      longitude: lote.checkpointLongitude,
    });
  }

  // Add multiple checkpoints if provided
  if (checkpoints && checkpoints.length > 0) {
    checkpoints
      .sort((a, b) => a.orden - b.orden)
      .forEach((cp) => {
        allWaypoints.push({ latitude: cp.latitude, longitude: cp.longitude });
      });
  }

  if (propData && allWaypoints.length > 0) {
    customRouteUrl = generateCustomRouteUrl(
      { latitude: propData.latitude, longitude: propData.longitude },
      { latitude: lote.latitude, longitude: lote.longitude },
      allWaypoints
    );
  }

  if (lote.id) {
    // Update
    const { data, error } = await supabase
      .from('property_lotes')
      .update({
        property_id: lote.propertyId,
        numero: lote.numero,
        tipo: lote.tipo,
        latitude: lote.latitude,
        longitude: lote.longitude,
        image_url: lote.imageUrl ?? null,
        checkpoint_latitude: lote.checkpointLatitude ?? null,
        checkpoint_longitude: lote.checkpointLongitude ?? null,
        custom_route_url: customRouteUrl,
      })
      .eq('id', lote.id)
      .select()
      .single();

    if (error) {
      console.error('Error updating lote:', error);
      return null;
    }

    // Save checkpoints
    if (checkpoints) {
      await saveCheckpointsForLote(lote.id, checkpoints);
    }

    const savedCheckpoints = await getCheckpointsByLoteId(lote.id);
    return transformPropertyLote(data, savedCheckpoints);
  } else {
    // Insert
    const { data, error } = await supabase
      .from('property_lotes')
      .insert({
        property_id: lote.propertyId,
        numero: lote.numero,
        tipo: lote.tipo,
        latitude: lote.latitude,
        longitude: lote.longitude,
        image_url: lote.imageUrl ?? null,
        checkpoint_latitude: lote.checkpointLatitude ?? null,
        checkpoint_longitude: lote.checkpointLongitude ?? null,
        custom_route_url: customRouteUrl,
      })
      .select()
      .single();

    if (error) {
      console.error('Error inserting lote:', error);
      return null;
    }

    // Save checkpoints for new lote
    if (checkpoints && checkpoints.length > 0) {
      await saveCheckpointsForLote(data.id, checkpoints);
    }

    const savedCheckpoints = await getCheckpointsByLoteId(data.id);
    return transformPropertyLote(data, savedCheckpoints);
  }
};

// Delete lote (checkpoints are auto-deleted via CASCADE)
export const deleteLote = async (id: string): Promise<boolean> => {
  const { error } = await supabase
    .from('property_lotes')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting lote:', error);
    return false;
  }

  return true;
};

export const uploadLoteImage = async (args: {
  propertyId: string;
  file: File;
  loteId?: string;
}): Promise<string | null> => {
  try {
    const extRaw = args.file.name.split('.').pop()?.toLowerCase();
    const ext = extRaw && /^[a-z0-9]+$/.test(extRaw) ? extRaw : 'jpg';
    const objectName = `${args.propertyId}/${args.loteId ?? crypto.randomUUID()}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from('lote-images')
      .upload(objectName, args.file, {
        upsert: true,
        contentType: args.file.type || undefined,
      });

    if (uploadError) {
      console.error('Error uploading lote image:', uploadError);
      return null;
    }

    const { data } = supabase.storage.from('lote-images').getPublicUrl(objectName);
    return data.publicUrl;
  } catch (e) {
    console.error('Error uploading lote image:', e);
    return null;
  }
};

// Upload property map image
export const uploadPropertyMapImage = async (args: {
  propertyId: string;
  file: File;
}): Promise<string | null> => {
  try {
    const extRaw = args.file.name.split('.').pop()?.toLowerCase();
    const ext = extRaw && /^[a-z0-9]+$/.test(extRaw) ? extRaw : 'jpg';
    const objectName = `maps/${args.propertyId}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from('lote-images')
      .upload(objectName, args.file, {
        upsert: true,
        contentType: args.file.type || undefined,
      });

    if (uploadError) {
      console.error('Error uploading property map image:', uploadError);
      return null;
    }

    const { data } = supabase.storage.from('lote-images').getPublicUrl(objectName);
    return data.publicUrl;
  } catch (e) {
    console.error('Error uploading property map image:', e);
    return null;
  }
};
