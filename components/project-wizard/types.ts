export type ProjectMode = 'quick' | 'guided';
export type ProjectIntent = 'delivery' | 'experiment' | 'internal';
export type SuccessType = 'deliverable' | 'kpi' | 'undefined';
export type StructureType = 'linear' | 'milestone' | 'multistream';

export interface ProjectData {
  mode?: ProjectMode;
  name?: string;
  
  // Data Baru
  province?: string; // Menyimpan Provinsi
  city?: string;     // Menyimpan Kota
  inScope?: string;  // Tambahan untuk Scope of Work
  outOfScope?: string; // Tambahan untuk Scope of Work

  intent?: ProjectIntent;
  description?: string; 
  successType?: SuccessType;
  targetDeadline?: string;
  targetProduksi?: string;
  targetRevenue?: string;
  pic?: string;
  partner?: string;
  client?: string;
  structure?: StructureType;

  deliverables?: any[];
  metrics?: any[];
  deadlineType?: string;
  contributorIds?: string[];
  stakeholderIds?: string[];
  addStarterTasks?: boolean;
  ownerId?: string;
}