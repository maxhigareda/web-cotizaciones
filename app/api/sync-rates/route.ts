import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'

const ALLOWED_PROFILES = [
    "BI Visualization Developer",
    "Azure Developer",
    "Solution Architect",
    "BI Data Architect",
    "Data Engineer",
    "Data Scientist",
    "Data / Operations Analyst",
    "Project / Product Manager",
    "Business Analyst",
    "Low Code Developer",
    "Power App / Streamlit Developer"
]

export async function GET() {
    return NextResponse.json({
        status: "Online",
        message: "Endpoint de sincronización activo. Use POST para actualizar tarifas."
    })
}

export async function POST(req: NextRequest) {
    try {
        // 1. Security Check
        const apiKey = req.headers.get('x-api-key')
        const serverKey = process.env.SYNC_API_KEY

        if (!serverKey || apiKey !== serverKey) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        // 2. Parse Body
        const body = await req.json()
        const { profileName } = body

        // 3. Identification & Validation
        if (!profileName || !ALLOWED_PROFILES.includes(profileName)) {
            return NextResponse.json({
                error: `Perfil "${profileName}" no reconocido. Debe ser uno de los 11 oficiales.`
            }, { status: 400 })
        }

        // 4. Partial Update Mapping
        // We only process fields that are present in the body and are not null/undefined
        const seniorities = {
            'jr': 'Jr',
            'med': 'Med',
            'sr': 'Sr',
            'expert': 'Expert'
        }

        const entriesToUpdate = Object.entries(seniorities)
            .filter(([jsonKey]) => body[jsonKey] !== undefined && body[jsonKey] !== null && body[jsonKey] !== '')
            .map(([jsonKey, dbLevel]) => ({
                level: dbLevel,
                price: parseFloat(body[jsonKey])
            }))

        if (entriesToUpdate.length === 0) {
            return NextResponse.json({ message: "No se proporcionaron campos para actualizar" }, { status: 200 })
        }

        // Validate resulting numbers
        for (const entry of entriesToUpdate) {
            if (isNaN(entry.price)) {
                return NextResponse.json({ error: `Valor numérico inválido para el nivel ${entry.level}` }, { status: 400 })
            }
        }

        // 5. Atomic Partial Updates
        const updates = entriesToUpdate.map(entry => {
            return prisma.serviceRate.updateMany({
                where: {
                    service: profileName,
                    complexity: entry.level,
                    frequency: 'Mensual'
                },
                data: {
                    basePrice: entry.price,
                    multiplier: 1.0
                }
            })
        })

        await prisma.$transaction(updates)

        // 6. Visual Feedback
        revalidatePath('/admin')

        return NextResponse.json({
            success: true,
            message: `Actualización parcial exitosa para ${profileName}. Niveles actualizados: ${entriesToUpdate.map(e => e.level).join(', ')}`
        })

    } catch (e: any) {
        console.error("Rate Sync Error:", e)
        return NextResponse.json({ error: "Error interno del servidor", details: e.message }, { status: 500 })
    }
}
