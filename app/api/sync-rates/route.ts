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
        const { profileName, jr, med, sr, expert } = body

        // 3. Identification & Validation
        if (!profileName || !ALLOWED_PROFILES.includes(profileName)) {
            return NextResponse.json({
                error: `Invalid profile name: ${profileName}. Profile must be one of the 11 official ones.`
            }, { status: 403 })
        }

        // 4. Data Conversion (Explicit Float)
        const prices = {
            'Jr': parseFloat(jr),
            'Med': parseFloat(med), // Mapping 'med' from JSON to 'Med' in DB
            'Sr': parseFloat(sr),
            'Expert': parseFloat(expert)
        }

        // Check for NaN
        for (const [level, price] of Object.entries(prices)) {
            if (isNaN(price)) {
                return NextResponse.json({ error: `Invalid numeric value for level ${level}` }, { status: 400 })
            }
        }

        // 5. Atomic Update
        // We update the basePrice for each seniority level of the specified profile
        const updates = Object.entries(prices).map(([level, price]) => {
            return prisma.serviceRate.updateMany({
                where: {
                    service: profileName,
                    complexity: level,
                    frequency: 'Mensual'
                },
                data: {
                    basePrice: price,
                    multiplier: 1.0 // Ensuring multiplier is 1 as specified in the matrix logic
                }
            })
        })

        await prisma.$transaction(updates)

        // 6. Visual Feedback (Revalidate Admin View)
        revalidatePath('/admin')

        return NextResponse.json({
            success: true,
            message: `Rates updated successfully for ${profileName}`
        })

    } catch (e: any) {
        console.error("Rate Sync Error:", e)
        return NextResponse.json({ error: "Internal Server Error", details: e.message }, { status: 500 })
    }
}
