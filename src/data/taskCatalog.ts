export interface TaskSeed {
  name: string;
  basePoints: number;
  expectedPeriodHours: number;
  cooldownHours: number;
  isInvisibleLabor: boolean;
}

const MUTFAK: TaskSeed[] = [
  { name: 'Bulaşık yıkama', basePoints: 20, expectedPeriodHours: 8, cooldownHours: 4, isInvisibleLabor: false },
  { name: 'Tezgah ve ocak silme', basePoints: 10, expectedPeriodHours: 24, cooldownHours: 6, isInvisibleLabor: false },
  { name: 'Çöp çıkarma', basePoints: 15, expectedPeriodHours: 24, cooldownHours: 12, isInvisibleLabor: false },
];

const SALON: TaskSeed[] = [
  { name: 'Toplama / düzenleme', basePoints: 20, expectedPeriodHours: 24, cooldownHours: 8, isInvisibleLabor: false },
  { name: 'Süpürme', basePoints: 25, expectedPeriodHours: 72, cooldownHours: 24, isInvisibleLabor: false },
];

const BANYO: TaskSeed[] = [
  { name: 'Banyo temizliği', basePoints: 70, expectedPeriodHours: 168, cooldownHours: 72, isInvisibleLabor: false },
  { name: 'Havlu / paspas değişimi', basePoints: 10, expectedPeriodHours: 168, cooldownHours: 72, isInvisibleLabor: false },
];

const YATAK_ODASI: TaskSeed[] = [
  { name: 'Toplama', basePoints: 15, expectedPeriodHours: 48, cooldownHours: 24, isInvisibleLabor: false },
  { name: 'Çarşaf değiştirme', basePoints: 40, expectedPeriodHours: 336, cooldownHours: 240, isInvisibleLabor: false },
];

const BAHCE: TaskSeed[] = [
  { name: 'Bahçe düzenleme', basePoints: 50, expectedPeriodHours: 168, cooldownHours: 72, isInvisibleLabor: false },
];

const GARAJ: TaskSeed[] = [
  { name: 'Garaj toplama', basePoints: 30, expectedPeriodHours: 336, cooldownHours: 168, isInvisibleLabor: false },
];

const GENEL: TaskSeed[] = [
  { name: 'Genel toplama', basePoints: 15, expectedPeriodHours: 48, cooldownHours: 12, isInvisibleLabor: false },
];

export function getDefaultTasksForRoom(roomName: string): TaskSeed[] {
  const n = roomName.toLocaleLowerCase('tr-TR');
  if (n.includes('mutfak')) return MUTFAK;
  if (n.includes('banyo')) return BANYO;
  if (n.includes('salon')) return SALON;
  if (n.includes('yatak') || n.includes('oda')) return YATAK_ODASI;
  if (n.includes('bahçe') || n.includes('bahce')) return BAHCE;
  if (n.includes('garaj')) return GARAJ;
  return GENEL;
}
