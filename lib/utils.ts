import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

// Fungsi bawaan template untuk menggabungkan class Tailwind
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// FUNGSI BARU: Merapikan format teks Role dari Database
export function formatRoleName(role: string) {
  if (!role) return "Unknown"
  
  // 1. Ganti underscore (_) dengan spasi
  const spacedRole = role.replace(/_/g, " ")
  
  // 2. Ubah setiap awal kata menjadi kapital, sisanya huruf kecil
  return spacedRole
    .toLowerCase()
    .split(" ")
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ")
}