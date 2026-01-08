'use client'

import { useState, useEffect } from 'react'
import { Card } from "@/components/ui/card"
import { QuoteDetailsSheet } from '@/components/quote-details-sheet'
import { DeleteQuoteButton } from '@/components/delete-quote-button'
import { FileText } from "lucide-react"
import Link from 'next/link'
import { Button } from "@/components/ui/button"

export function DashboardQuotesList({ serverQuotes }: { serverQuotes: any[] }) {
    const [mergedQuotes, setMergedQuotes] = useState(serverQuotes)

    useEffect(() => {
        // Load local "Demo" quotes from browser storage
        const localQuotesRaw = localStorage.getItem('demo_quotes')
        if (localQuotesRaw) {
            try {
                const localQuotes = JSON.parse(localQuotesRaw)
                // Merge: Local first (newer), then Server
                // Deduplicate by ID just in case
                const combined = [...localQuotes, ...serverQuotes]
                // Simple unique by ID
                const unique = Array.from(new Map(combined.map(item => [item.id, item])).values())

                // Sort descending date
                unique.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

                setMergedQuotes(unique)
            } catch (e) {
                console.error("Failed to load local quotes", e)
            }
        }
    }, [serverQuotes])

    // Handler to remove deleted items from UI immediately
    const handleDelete = (id: string) => {
        // Update State
        const updated = mergedQuotes.filter(q => q.id !== id)
        setMergedQuotes(updated)

        // Update Local Storage
        const localQuotesRaw = localStorage.getItem('demo_quotes')
        if (localQuotesRaw) {
            const local = JSON.parse(localQuotesRaw)
            const newLocal = local.filter((q: any) => q.id !== id)
            localStorage.setItem('demo_quotes', JSON.stringify(newLocal))
        }
    }

    if (!isClient) return <div className="p-16 text-center text-[#CFDBD5] animate-pulse">Cargando cotizaciones...</div>

    if (mergedQuotes.length === 0) {
        return (
            <Card className="bg-[#1F1F1F] border-[#2D2D2D] rounded-[2rem] p-16 text-center space-y-6">
                <div className="w-20 h-20 bg-[#2D2D2D] rounded-full flex items-center justify-center mx-auto">
                    <FileText className="w-10 h-10 text-[#CFDBD5]/50" />
                </div>
                <div>
                    <h3 className="text-2xl font-bold text-[#E8EDDF] mb-2">Aún no has generado presupuestos</h3>
                    <p className="text-[#CFDBD5]">Comienza un nuevo proyecto para ver el historial aquí.</p>
                </div>
                <Link href="/quote/new">
                    <Button variant="outline" className="border-[#F5CB5C] text-[#F5CB5C] hover:bg-[#F5CB5C] hover:text-[#171717] rounded-xl h-12 px-8 font-bold mt-4">
                        Ir al Cotizador
                    </Button>
                </Link>
            </Card>
        )
    }

    return (
        <div className="space-y-4">
            {/* Table Header */}
            <div className="grid grid-cols-12 gap-4 px-6 text-xs font-bold text-[#CFDBD5] uppercase tracking-widest opacity-60 mb-2">
                <div className="col-span-4">Cliente / Proyecto</div>
                <div className="col-span-3">Fecha</div>
                <div className="col-span-3">Costo Estimado</div>
                <div className="col-span-2 text-right">Acciones</div>
            </div>

            {mergedQuotes.map((quote) => (
                <Card key={quote.id} className="bg-[#1F1F1F] border-[#2D2D2D] rounded-[1.5rem] p-6 hover:border-[#F5CB5C]/30 transition-all group">
                    <div className="grid grid-cols-12 gap-4 items-center">
                        <div className="col-span-4">
                            <h4 className="text-[#E8EDDF] font-bold text-lg truncate">{quote.clientName}</h4>
                            <p className="text-[#CFDBD5] text-sm truncate opacity-70">
                                {(() => {
                                    try {
                                        return (JSON.parse(quote.technicalParameters) as any).description?.substring(0, 40)
                                    } catch { return 'Sin descripción' }
                                })()}...
                            </p>
                        </div>
                        <div className="col-span-3 text-[#CFDBD5] font-medium">
                            {new Date(quote.createdAt).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })}
                        </div>
                        <div className="col-span-3">
                            <span className="text-[#F5CB5C] font-mono font-bold text-lg">
                                {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(quote.estimatedCost)}
                            </span>
                            <span className="text-[#CFDBD5] text-xs ml-1">/ mes</span>
                        </div>
                        <div className="col-span-2 flex justify-end gap-2">
                            <QuoteDetailsSheet quote={quote} />

                            {/* We override the delete button behavior by passing our own handler context if needed, 
                                but simpler is to let the button do its server action, 
                                AND we manually update our local state. 
                                ACTUALLY, DeleteQuoteButton is a server component wrapper usually. 
                                Let's wrap it or modify it. 
                                Ideally, we pass an onDelete callback here. */}
                            <div onClick={() => handleDelete(quote.id)}>
                                <DeleteQuoteButton quoteId={quote.id} quoteName={quote.clientName} />
                            </div>
                        </div>
                    </div>
                </Card>
            ))}
        </div>
    )
}
