
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function resetSequence() {
    try {
        // Reset the sequence for the 'Quote' table 'quoteNumber' column.
        // The sequence name usually follows the pattern "Quote_quoteNumber_seq" in Prisma/Postgres.
        await prisma.$executeRaw`ALTER SEQUENCE "Quote_quoteNumber_seq" RESTART WITH 1;`
        console.log('Successfully reset sequence "Quote_quoteNumber_seq" to 1.')
    } catch (error) {
        console.error('Error resetting sequence:', error)
    } finally {
        await prisma.$disconnect()
    }
}

resetSequence()
