import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  // Seed some initial forex data
  const forexPairs = [
    { symbol: 'GBPUSD', price: 1.2500, timestamp: new Date() },
    { symbol: 'EURUSD', price: 1.0800, timestamp: new Date() },
    { symbol: 'AUDUSD', price: 0.6700, timestamp: new Date() }
  ]

  for (const pair of forexPairs) {
    await prisma.forexData.create({
      data: pair
    })
  }

  console.log('Forex data seeded successfully')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })