import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { revalidatePath, revalidateTag } from 'next/cache'

export async function POST(request: Request) {
    try {
        const body = await request.json()
        const { id, status } = body

        // Validate basic input
        if (!id || !status) {
            return NextResponse.json(
                { success: false, error: 'Missing required fields: id, status' },
                { status: 400 }
            )
        }

        console.log(`[Monday Sync] Received update for quote ${id} -> ${status}`)

        // Update the quote in the database
        const updatedQuote = await prisma.quote.update({
            where: { id: id },
            data: {
                status: status,
                // We might want to track when it was last updated from external source
                updatedAt: new Date()
            },
        })

        // Revalidate cache to update UI lists immediately
        // Refreshes the home dashboard and any list views
        revalidatePath('/')

        // Also revalidate the specific quote detail view if cached
        revalidatePath(`/quote/${id}`)

        return NextResponse.json({
            success: true,
            message: 'Status updated successfully',
            quoteId: updatedQuote.id,
            newStatus: updatedQuote.status
        })

    } catch (error) {
        console.error('[Monday Sync Error]:', error)
        return NextResponse.json(
            { success: false, error: 'Internal Server Error or Quote Not Found' },
            { status: 500 }
        )
    }
}
