import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'

export async function POST(request: Request) {
    let quoteIdForError = 'unknown'

    try {
        const body = await request.json()
        const { id, updates } = body

        if (id) quoteIdForError = id

        // Validate basic input structure
        if (!id || !updates || typeof updates !== 'object') {
            return NextResponse.json(
                { success: false, error: 'Invalid payload format. Expected { id, updates: { ... } }' },
                { status: 400 }
            )
        }

        console.log(`[Monday Sync] Received dynamic update for quote ${id}`, updates)

        // Build dynamic update object
        const dataToUpdate: any = {}

        if (updates.status) {
            dataToUpdate.status = updates.status
        }

        if (updates.budget) {
            // Monday usually sends strings, we assume it's a number or convertible string
            const cost = Number(updates.budget)
            if (!isNaN(cost)) {
                dataToUpdate.estimatedCost = cost // Map 'budget' to correct DB field 'estimatedCost'
            }
        }

        if (updates.serviceType) {
            dataToUpdate.serviceType = updates.serviceType
        }

        // Check if there is anything to update
        if (Object.keys(dataToUpdate).length === 0) {
            return NextResponse.json({
                success: true,
                message: 'No valid fields to update were found',
                updated: false
            })
        }

        // Update the quote in the database
        const updatedQuote = await prisma.quote.update({
            where: { id: id },
            data: dataToUpdate,
        })

        // Revalidate cache to update UI lists immediately
        revalidatePath('/')
        revalidatePath(`/quote/${id}`)

        return NextResponse.json({
            success: true,
            message: 'Quote updated successfully',
            quoteId: updatedQuote.id,
            updatedFields: Object.keys(dataToUpdate)
        })

    } catch (error: any) {
        console.error('[Monday Sync Error]:', error)

        // Check for Prisma "Record Not Found" error
        if (error.code === 'P2025') {
            console.warn(`[Monday Sync] Quote not found: ${quoteIdForError}`)
            return NextResponse.json(
                { success: false, error: 'Quote ID not found in database', requestedId: quoteIdForError },
                { status: 404 }
            )
        }

        return NextResponse.json(
            { success: false, error: error.message || 'Internal Server Error' },
            { status: 500 }
        )
    }
}
