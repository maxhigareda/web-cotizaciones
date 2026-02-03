
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    console.log('Seeding Rates...')

    const rates = [
        // BI Visualization
        { service: 'BI Visualization', complexity: 'Jr', basePrice: 2831.11 },
        { service: 'BI Visualization', complexity: 'Ssr', basePrice: 4128.70 }, // Map Med -> Ssr
        { service: 'BI Visualization', complexity: 'Sr', basePrice: 5308.33 },
        { service: 'BI Visualization', complexity: 'Expert', basePrice: 5780.19 },

        // Azure Developer
        { service: 'Azure Developer', complexity: 'Jr', basePrice: 2949.07 },
        { service: 'Azure Developer', complexity: 'Ssr', basePrice: 4128.70 },
        { service: 'Azure Developer', complexity: 'Sr', basePrice: 5898.15 },
        // No Expert for Azure Dev

        // Solution Architect
        { service: 'Solution Architect', complexity: 'Jr', basePrice: 4128.70 },
        { service: 'Solution Architect', complexity: 'Ssr', basePrice: 5308.33 },
        { service: 'Solution Architect', complexity: 'Sr', basePrice: 6370.00 },
        { service: 'Solution Architect', complexity: 'Expert', basePrice: 7962.50 },

        // BI Data Architect (Assuming 'Data Architect' key in FE)
        { service: 'Data Architect', complexity: 'Jr', basePrice: 4128.70 },
        { service: 'Data Architect', complexity: 'Ssr', basePrice: 5308.33 },
        { service: 'Data Architect', complexity: 'Sr', basePrice: 6370.00 },
        { service: 'Data Architect', complexity: 'Expert', basePrice: 7325.50 },

        // Data Engineer
        { service: 'Data Engineer', complexity: 'Jr', basePrice: 4128.70 },
        { service: 'Data Engineer', complexity: 'Ssr', basePrice: 4954.44 },
        { service: 'Data Engineer', complexity: 'Sr', basePrice: 7077.78 },
        { service: 'Data Engineer', complexity: 'Expert', basePrice: 7431.67 },

        // Data Scientist (Mapped to 'Data Science' key)
        // No Jr
        { service: 'Data Science', complexity: 'Ssr', basePrice: 5190.37 },
        { service: 'Data Science', complexity: 'Sr', basePrice: 6252.04 },
        { service: 'Data Science', complexity: 'Expert', basePrice: 7502.44 },

        // Operations Analyst
        { service: 'Operations Analyst', complexity: 'Jr', basePrice: 2831.11 },
        { service: 'Operations Analyst', complexity: 'Ssr', basePrice: 3538.89 },
        { service: 'Operations Analyst', complexity: 'Sr', basePrice: 4718.52 },
        { service: 'Operations Analyst', complexity: 'Expert', basePrice: 5426.30 },

        // Low Code Dev (Mapped to 'Power Apps' key or new key)
        // Let's assume we map 'Power Apps' to this, or create new.
        // I will use 'Low Code Dev' service name. I'll update FE to use this key.
        { service: 'Low Code Dev', complexity: 'Jr', basePrice: 1500.00 },
        { service: 'Low Code Dev', complexity: 'Ssr', basePrice: 3538.00 },
        { service: 'Low Code Dev', complexity: 'Sr', basePrice: 4128.00 },
        { service: 'Low Code Dev', complexity: 'Expert', basePrice: 5308.00 },
    ]

    for (const r of rates) {
        // Check if exists
        const existing = await prisma.serviceRate.findFirst({
            where: {
                service: r.service,
                complexity: r.complexity,
                frequency: 'Mensual'
            }
        })

        if (existing) {
            console.log(`Updating ${r.service} ${r.complexity}...`)
            await prisma.serviceRate.update({
                where: { id: existing.id },
                data: { basePrice: r.basePrice }
            })
        } else {
            console.log(`Creating ${r.service} ${r.complexity}...`)
            await prisma.serviceRate.create({
                data: {
                    service: r.service,
                    complexity: r.complexity,
                    frequency: 'Mensual',
                    basePrice: r.basePrice,
                    multiplier: 1.0
                }
            })
        }
    }

    console.log('Done.')
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
