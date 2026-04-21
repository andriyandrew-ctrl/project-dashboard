// lib/data/clients.ts

export type ClientStatus = "prospect" | "active" | "on_hold" | "completed" | "archived"

export interface Client {
  id: string;
  name: string;
  status: ClientStatus;
  [key: string]: any; // Mencegah error jika ada data tambahan
}

export const clients: Client[] = [
  { id: "c1", name: "PT Krakatau Steel (Internal)", status: "active" },
  { id: "c2", name: "ITS Surabaya", status: "active" },
  { id: "c3", name: "Kementerian Perindustrian", status: "active" }
]

export function getClientById(id: string) {
  return clients.find((c) => c.id === id) || null;
}

export function getClientByName(name: string) {
  if (!name) return null;
  return clients.find((c) => c.name.toLowerCase() === name.toLowerCase()) || null;
}

// --- PLACEHOLDER AGAR VERCEL TIDAK ERROR ---
export function getProjectCountForClient(clientId: string) {
  return 0;
}

export function upsertClient(client: any) {
  return client;
}