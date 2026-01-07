import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
    // 1. Seed Roles/Rates
    const rates = [
        { role: 'Data Analyst', monthlyRate: 2500, baseHours: 160 },
        { role: 'Data Science', monthlyRate: 5100, baseHours: 160 },
        { role: 'BI', monthlyRate: 4128, baseHours: 160 },
        { role: 'Data Engineer', monthlyRate: 4950, baseHours: 160 },
    ]

    for (const rate of rates) {
        await prisma.roleRate.upsert({
            where: { role: rate.role },
            update: {
                monthlyRate: rate.monthlyRate,
                baseHours: rate.baseHours,
                hourlyRate: rate.monthlyRate / rate.baseHours
            },
            create: {
                role: rate.role,
                monthlyRate: rate.monthlyRate,
                baseHours: rate.baseHours,
                hourlyRate: rate.monthlyRate / rate.baseHours
            },
        })
    }
    console.log('Rates seeded successfully.')

    // 2. Seed Users
    const hashedPasswordAdmin = await bcrypt.hash('admin2026', 10)
    const admin = await prisma.user.upsert({
        where: { email: 'admin@antigravity.com' },
        update: {
            password: hashedPasswordAdmin,
            role: 'ADMIN' // Ensure role is correct even if updated
        },
        create: {
            name: 'Administrador',
            email: 'admin@antigravity.com',
            password: hashedPasswordAdmin,
            role: 'ADMIN'
        }
    })

    const hashedPasswordUser = await bcrypt.hash('user2026', 10)
    const user = await prisma.user.upsert({
        where: { email: 'tomasmarzullo04@gmail.com' },
        update: {
            password: hashedPasswordUser,
            role: 'USER'
        },
        create: {
            name: 'Consultor Tomas',
            email: 'tomasmarzullo04@gmail.com',
            password: hashedPasswordUser,
            role: 'USER'
        }
    })

    // Create Max User
    const hashedPasswordMax = await bcrypt.hash('max2026', 10)
    const max = await prisma.user.upsert({
        where: { email: 'maxhigareda@thestoreintelligence.com' },
        update: { password: hashedPasswordMax, role: 'USER' },
        create: {
            name: 'Max Higareda',
            email: 'maxhigareda@thestoreintelligence.com',
            password: hashedPasswordMax,
            role: 'USER'
        }
    })

    console.log('Users seeded successfully:', { admin: admin.email, user: user.email, max: max.email })
}

main()
    .then(async () => {
        await prisma.$disconnect()
    })
    .catch(async (e) => {
        console.error(e)
        await prisma.$disconnect()
        process.exit(1)
    })
