
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    const rates = [
        { service: "BI Visualization Developer", basePrice: 4128.70 },
        { service: "Azure Developer", basePrice: 4128.70 },
        { service: "Data Architect", basePrice: 5308.33 },
        { service: "Data Engineer", basePrice: 4954.44 },
        { service: "BI Data Scientist", basePrice: 5190.37 },
        { service: "Operations Analyst", basePrice: 3538.89 },
        { service: "Project Manager & Product MGR", basePrice: 5308.33 },
        { service: "React Dev", basePrice: 4500.00 },
        { service: "Power Apps / Power Automate", basePrice: 4000.00 },
        { service: "Data Analyst", basePrice: 2500.00 },
    ]

    console.log("Seeding Admin Rates...")

    for (const r of rates) {
        const existing = await prisma.serviceRate.findFirst({
            where: {
                service: r.service,
                complexity: 'Ssr'
            }
        })

        if (existing) {
            console.log(`Updating ${r.service}...`)
            await prisma.serviceRate.update({
                where: { id: existing.id },
                data: {
                    basePrice: r.basePrice,
                    frequency: 'Mensual', // Enforce Monthly as per request
                    multiplier: 1.0
                }
            })
        } else {
            console.log(`Creating ${r.service}...`)
            await prisma.serviceRate.create({
                data: {
                    service: r.service,
                    frequency: 'Mensual',
                    complexity: 'Ssr',
                    basePrice: r.basePrice,
                    multiplier: 1.0
                }
            })
        }
    }
    console.log("Done!")
}

main()
    .catch(e => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
