import { PrismaClient } from "@prisma/client"
import { Pool, neonConfig } from "@neondatabase/serverless"
import { PrismaNeon } from "@prisma/adapter-neon"
import ws from "ws"

// Mengajari mesin cara menggunakan WebSocket
neonConfig.webSocketConstructor = ws

const prismaClientSingleton = () => {
  // TAUTAN DIBERSIHKAN: Saya membuang '?sslmode=require&channel_binding=require' 
  // karena parameter itu yang membuat mesin pembaca URL Prisma 'tersedak' dan error.
  const pool = new Pool({
    connectionString: "postgresql://neondb_owner:npg_bRuhdMFg9Y5t@ep-sweet-forest-a1l7megd-pooler.ap-southeast-1.aws.neon.tech/neondb"
  })
  
  const adapter = new PrismaNeon(pool as any)
  
  // Sekarang Prisma mendapatkan Adapter yang ia minta, dengan opsi yang valid.
  return new PrismaClient({ adapter })
}

declare global {
  var prismaGlobal: undefined | ReturnType<typeof prismaClientSingleton>
}

const prisma = globalThis.prismaGlobal ?? prismaClientSingleton()
export default prisma

if (process.env.NODE_ENV !== "production") globalThis.prismaGlobal = prisma