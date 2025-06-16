// src/lib/db.ts
import { PrismaClient } from '@prisma/client'

const prismaClientSingleton = () => {
  return new PrismaClient()
}

type PrismaClientSingleton = ReturnType<typeof prismaClientSingleton>

const globalForPrisma = global as unknown as { 
  prisma: PrismaClientSingleton | undefined 
}

export const db = 
  globalForPrisma.prisma ?? 
  prismaClientSingleton()

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = db
}