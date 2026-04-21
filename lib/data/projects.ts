// lib/data/projects.ts

export type Project = {
  id: string;
  name: string;
  [key: string]: any; // Mencegah error tipe data
};

export type FilterCounts = {
  [key: string]: number;
};

// Array kosong sebagai penenang Vercel
export const projects: Project[] = [];