import { Property, AccessLog, initialProperties } from '@/types/property';

const PROPERTIES_KEY = 'qr_nav_properties';
const ACCESS_LOGS_KEY = 'qr_nav_access_logs';

// Initialize with default properties if none exist
export const getProperties = (): Property[] => {
  const stored = localStorage.getItem(PROPERTIES_KEY);
  if (!stored) {
    localStorage.setItem(PROPERTIES_KEY, JSON.stringify(initialProperties));
    return initialProperties;
  }
  return JSON.parse(stored).map((p: Property) => ({
    ...p,
    createdAt: new Date(p.createdAt),
    updatedAt: new Date(p.updatedAt),
  }));
};

export const getPropertyBySlug = (slug: string): Property | undefined => {
  const properties = getProperties();
  return properties.find(p => p.slug === slug && p.isActive);
};

export const getPropertyById = (id: string): Property | undefined => {
  const properties = getProperties();
  return properties.find(p => p.id === id);
};

export const saveProperty = (property: Property): void => {
  const properties = getProperties();
  const index = properties.findIndex(p => p.id === property.id);
  
  if (index >= 0) {
    properties[index] = { ...property, updatedAt: new Date() };
  } else {
    properties.push({ ...property, createdAt: new Date(), updatedAt: new Date() });
  }
  
  localStorage.setItem(PROPERTIES_KEY, JSON.stringify(properties));
};

export const deleteProperty = (id: string): void => {
  const properties = getProperties().filter(p => p.id !== id);
  localStorage.setItem(PROPERTIES_KEY, JSON.stringify(properties));
};

export const togglePropertyActive = (id: string): void => {
  const properties = getProperties();
  const index = properties.findIndex(p => p.id === id);
  if (index >= 0) {
    properties[index].isActive = !properties[index].isActive;
    properties[index].updatedAt = new Date();
    localStorage.setItem(PROPERTIES_KEY, JSON.stringify(properties));
  }
};

// Access logs
export const getAccessLogs = (): AccessLog[] => {
  const stored = localStorage.getItem(ACCESS_LOGS_KEY);
  if (!stored) return [];
  return JSON.parse(stored).map((log: AccessLog) => ({
    ...log,
    accessedAt: new Date(log.accessedAt),
  }));
};

export const logAccess = (propertyId: string, propertyName: string): void => {
  const logs = getAccessLogs();
  const deviceType = detectDeviceType();
  
  const newLog: AccessLog = {
    id: crypto.randomUUID(),
    propertyId,
    propertyName,
    accessedAt: new Date(),
    deviceType,
    userAgent: navigator.userAgent,
  };
  
  logs.unshift(newLog);
  // Keep only last 1000 logs
  const trimmedLogs = logs.slice(0, 1000);
  localStorage.setItem(ACCESS_LOGS_KEY, JSON.stringify(trimmedLogs));
};

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

export const clearAccessLogs = (): void => {
  localStorage.setItem(ACCESS_LOGS_KEY, JSON.stringify([]));
};
