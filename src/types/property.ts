export interface Property {
  id: string;
  name: string;
  slug: string;
  latitude: number;
  longitude: number;
  address?: string;
  description?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface AccessLog {
  id: string;
  propertyId: string;
  propertyName: string;
  accessedAt: Date;
  deviceType: 'mobile' | 'tablet' | 'desktop';
  userAgent: string;
  ipAddress?: string;
}

export interface AdminUser {
  id: string;
  email: string;
  name: string;
}

// Initial properties data
export const initialProperties: Property[] = [
  {
    id: '1',
    name: 'Santa Clara',
    slug: 'santa-clara',
    latitude: 4.7110,
    longitude: -74.0721,
    address: 'Sector Santa Clara, Colombia',
    description: 'Propiedad residencial en el exclusivo sector de Santa Clara',
    isActive: true,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  },
  {
    id: '2',
    name: 'Carmelita',
    slug: 'carmelita',
    latitude: 4.7150,
    longitude: -74.0680,
    address: 'Sector Carmelita, Colombia',
    description: 'Hermosa propiedad en el corazón de Carmelita',
    isActive: true,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  },
  {
    id: '3',
    name: 'La Alquería',
    slug: 'la-alqueria',
    latitude: 4.7080,
    longitude: -74.0750,
    address: 'Sector La Alquería, Colombia',
    description: 'Propiedad campestre con amplios espacios verdes',
    isActive: true,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  },
  {
    id: '4',
    name: 'Villa Luisa',
    slug: 'villa-luisa',
    latitude: 4.7200,
    longitude: -74.0650,
    address: 'Sector Villa Luisa, Colombia',
    description: 'Elegante villa con vista panorámica',
    isActive: true,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  },
  {
    id: '5',
    name: 'El Carmelo',
    slug: 'el-carmelo',
    latitude: 4.7050,
    longitude: -74.0800,
    address: 'Sector El Carmelo, Colombia',
    description: 'Tranquila propiedad en el sector El Carmelo',
    isActive: true,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  },
];
