import { TemplateKey } from '../types';

export interface RoomSeed {
  name: string;
  icon: string;
}

export const TEMPLATE_LABELS: Record<TemplateKey, string> = {
  '1+1': '1+1',
  '2+1': '2+1',
  '3+1': '3+1',
  'ogrenci-evi': 'Öğrenci Evi',
  mustakil: 'Müstakil Ev',
};

export const ROOM_TEMPLATES: Record<TemplateKey, RoomSeed[]> = {
  '1+1': [
    { name: 'Salon', icon: '🛋️' },
    { name: 'Mutfak', icon: '🍽️' },
    { name: 'Banyo', icon: '🚿' },
    { name: 'Yatak Odası', icon: '🛏️' },
  ],
  '2+1': [
    { name: 'Salon', icon: '🛋️' },
    { name: 'Mutfak', icon: '🍽️' },
    { name: 'Banyo', icon: '🚿' },
    { name: 'Yatak Odası 1', icon: '🛏️' },
    { name: 'Yatak Odası 2', icon: '🛏️' },
  ],
  '3+1': [
    { name: 'Salon', icon: '🛋️' },
    { name: 'Mutfak', icon: '🍽️' },
    { name: 'Banyo', icon: '🚿' },
    { name: 'Yatak Odası 1', icon: '🛏️' },
    { name: 'Yatak Odası 2', icon: '🛏️' },
    { name: 'Yatak Odası 3', icon: '🛏️' },
  ],
  'ogrenci-evi': [
    { name: 'Salon', icon: '🛋️' },
    { name: 'Mutfak', icon: '🍽️' },
    { name: 'Banyo', icon: '🚿' },
    { name: 'Oda 1', icon: '🛏️' },
    { name: 'Oda 2', icon: '🛏️' },
    { name: 'Oda 3', icon: '🛏️' },
  ],
  mustakil: [
    { name: 'Salon', icon: '🛋️' },
    { name: 'Mutfak', icon: '🍽️' },
    { name: 'Banyo', icon: '🚿' },
    { name: 'Yatak Odası', icon: '🛏️' },
    { name: 'Bahçe', icon: '🌿' },
    { name: 'Garaj', icon: '🚗' },
  ],
};
