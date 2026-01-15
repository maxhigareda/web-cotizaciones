'use client'

import { useState, useEffect, useMemo } from 'react'
import { Card } from "@/components/ui/card"
import { QuoteDetailsSheet } from '@/components/quote-details-sheet'
import { DeleteQuoteButton } from '@/components/delete-quote-button'
import { FileText, Layers, Briefcase, Activity, DollarSign, LayoutGrid } from "lucide-react"
import Link from 'next/link'
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"

const getStatusStyles = (status: string) => {
    switch ((status || '').toUpperCase()) {
        case 'ENVIADA': return "bg-blue-500/10 text-blue-400 border-blue-500/30 hover:bg-blue-500/20"
        case 'APROBADA': return "bg-emerald-500/10 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20"
        case 'RECHAZADA': return "bg-red-500/10 text-red-400 border-red-500/30 hover:bg-red-500/20"
        default: return "bg-slate-500/10 text-slate-400 border-slate-500/30 hover:bg-slate-500/20" // BORRADOR
    }
}

const getStatusTooltip = (status: string) => {
    switch ((status || '').toUpperCase()) {
        case 'ENVIADA': return "Enviada al cliente, esperando respuesta."
        case 'APROBADA': return "Cliente aceptó la propuesta. ¡Éxito!"
        case 'RECHAZADA': return "Esta cotización no fue aceptada por el cliente."
        default: return "Cotización en progreso, no visible para el cliente." // BORRADOR
    }
}

const getTypeBadgeStyles = (type: string) => {
    switch ((type || 'Proyecto')) {
        case 'Staffing': return "bg-blue-500/10 text-blue-400 border-blue-500/30"
        case 'Sustain': return "bg-orange-500/10 text-orange-400 border-orange-500/30"
        default: return "bg-emerald-500/10 text-emerald-400 border-emerald-500/30" // Proyecto
    }
}

export function DashboardQuotesList({ serverQuotes = [] }: { serverQuotes?: any[] }) {
    const [mergedQuotes, setMergedQuotes] = useState<any[]>(serverQuotes || [])
    const [isClient, setIsClient] = useState(false)
    const [activeTab, setActiveTab] = useState('All')

    useEffect(() => {
        setIsClient(true)
        const validQuotes = Array.isArray(serverQuotes) ? serverQuotes : []
        validQuotes.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        setMergedQuotes(validQuotes)
    }, [serverQuotes])

    const handleDelete = (id: string) => {
        const updated = mergedQuotes.filter(q => q.id !== id)
        setMergedQuotes(updated)
    }

    // Filter Logic
    const filteredQuotes = useMemo(() => {
        if (activeTab === 'All') return mergedQuotes
        return mergedQuotes.filter(q => (q.serviceType || 'Proyecto') === activeTab)
    }, [mergedQuotes, activeTab])

    // Metrics Logic
    const metrics = useMemo(() => {
        const total = filteredQuotes.reduce((acc, q) => acc + (Number(q.estimatedCost) || 0), 0)
        const count = filteredQuotes.length
        return { total, count }
    }, [filteredQuotes])

    if (!isClient) {
        return <div className="p-16 text-center text-[#CFDBD5] animate-pulse">Cargando cotizaciones...</div>
    }

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
        <div className="space-y-8">
            {/* Tabs & Metrics */}
            <div className="flex flex-col md:flex-row justify-between items-end gap-6">
                <Tabs defaultValue="All" className="w-full md:w-auto" onValueChange={setActiveTab}>
                    <TabsList className="bg-[#1F1F1F] border border-[#2D2D2D] p-1 h-auto rounded-xl">
                        <TabsTrigger value="All" className="data-[state=active]:bg-[#F5CB5C] data-[state=active]:text-[#171717] rounded-lg px-6 py-2">Todos</TabsTrigger>
                        <TabsTrigger value="Proyecto" className="data-[state=active]:bg-[#F5CB5C] data-[state=active]:text-[#171717] rounded-lg px-6 py-2">Proyectos</TabsTrigger>
                        <TabsTrigger value="Staffing" className="data-[state=active]:bg-[#F5CB5C] data-[state=active]:text-[#171717] rounded-lg px-6 py-2">Staffing</TabsTrigger>
                        <TabsTrigger value="Sustain" className="data-[state=active]:bg-[#F5CB5C] data-[state=active]:text-[#171717] rounded-lg px-6 py-2">Sustain</TabsTrigger>
                    </TabsList>
                </Tabs>

                {/* Summary Widget */}
                <Card className="bg-[#1F1F1F] border-[#2D2D2D] px-6 py-3 flex items-center gap-6 rounded-2xl">
                    <div className="flex items-center gap-3 border-r border-[#2D2D2D] pr-6">
                        <div className="p-2 bg-[#2D2D2D] rounded-lg">
                            <LayoutGrid className="w-5 h-5 text-[#CFDBD5]" />
                        </div>
                        <div>
                            <p className="text-[10px] text-[#CFDBD5] uppercase font-bold tracking-widest">Cotizaciones</p>
                            <p className="text-xl font-bold text-[#E8EDDF]">{metrics.count}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-[#F5CB5C]/10 rounded-lg">
                            <DollarSign className="w-5 h-5 text-[#F5CB5C]" />
                        </div>
                        <div>
                            <p className="text-[10px] text-[#CFDBD5] uppercase font-bold tracking-widest">Valor Estimado</p>
                            <p className="text-xl font-bold text-[#F5CB5C]">
                                {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(metrics.total)}
                            </p>
                        </div>
                    </div>
                </Card>
            </div>

            {/* Dynamic Grid */}
            <div className="space-y-4">
                {/* Header */}
                <div className={`grid gap-4 px-6 text-xs font-bold text-[#CFDBD5] uppercase tracking-widest opacity-60 mb-2 items-center ${activeTab === 'All' ? 'grid-cols-12' : 'grid-cols-12'}`}>
                    <div className="col-span-3">Cliente / Proyecto</div>
                    <div className="col-span-2">Tipo</div>
                    <div className="col-span-3">
                        {activeTab === 'Staffing' ? 'Perfiles' :
                            activeTab === 'Sustain' ? 'Nivel SLA' :
                                activeTab === 'Proyecto' ? 'Complejidad' : 'Detalle'}
                    </div>
                    <div className="col-span-2">Fecha</div>
                    <div className="col-span-2 text-right">Inversión Estimada</div>
                </div>

                {filteredQuotes.map((quote) => {
                    // Parse params safely
                    let params: any = {}
                    try { params = quote.technicalParameters ? JSON.parse(quote.technicalParameters) : (quote.params || {}) } catch { }

                    return (
                        <Card key={quote.id || Math.random()} className="bg-[#1F1F1F] border-[#2D2D2D] rounded-[1.5rem] p-4 hover:border-[#F5CB5C]/50 hover:shadow-[0_0_20px_rgba(245,203,92,0.1)] transition-all duration-300 group cursor-default">
                            <div className="grid grid-cols-12 gap-4 items-center">
                                {/* 1. Client & Name */}
                                <div className="col-span-3">
                                    <div className="flex items-center gap-3">
                                        <h4 className="text-[#E8EDDF] font-bold text-base truncate max-w-[180px]" title={quote.clientName}>{quote.clientName || 'Sin Nombre'}</h4>
                                    </div>
                                    <div className="text-[#CFDBD5] text-xs opacity-70 mt-1 truncate max-w-[180px]" title={quote.projectType}>
                                        {quote.projectType}
                                    </div>
                                </div>

                                {/* 2. Type & Status */}
                                <div className="col-span-2 flex flex-col items-start gap-2">
                                    <Badge variant="outline" className={`${getTypeBadgeStyles(quote.serviceType)}`}>
                                        {quote.serviceType || 'Proyecto'}
                                    </Badge>
                                    <Badge variant="outline" className={`${getStatusStyles(quote.status)} text-[10px] px-2 h-5`}>
                                        {(quote.status || 'BORRADOR')}
                                    </Badge>
                                </div>

                                {/* 3. Dynamic Column */}
                                <div className="col-span-3 text-[#CFDBD5] text-sm">
                                    {(() => {
                                        if (quote.serviceType === 'Staffing' || activeTab === 'Staffing') {
                                            const profiles = params.staffingDetails?.profiles || []
                                            if (profiles.length === 0) return <span className="opacity-50">-</span>
                                            return maxProfiles(profiles)
                                        }
                                        if (quote.serviceType === 'Sustain' || activeTab === 'Sustain') {
                                            return (
                                                <div className="flex flex-col">
                                                    <span className="font-bold text-[#E8EDDF]">{params.criticitness?.level || 'Standard'}</span>
                                                    <span className="text-xs opacity-60">{params.sustainDetails?.operationHours || 'Business'}</span>
                                                </div>
                                            )
                                        }
                                        // Default / Project
                                        return (
                                            <div className="flex flex-col">
                                                <span className="font-bold text-[#E8EDDF] capitalize">{params.complexity?.toLowerCase() || 'N/A'}</span>
                                                {params.techStack?.length > 0 && <span className="text-xs opacity-60">{params.techStack.length} Tecnologías</span>}
                                            </div>
                                        )
                                    })()}
                                </div>

                                {/* 4. Date */}
                                <div className="col-span-2 text-[#CFDBD5] text-sm font-mono">
                                    {quote.createdAt ? new Date(quote.createdAt).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' }) : '-'}
                                </div>

                                {/* 5. Cost & Actions */}
                                <div className="col-span-2 flex items-center justify-end gap-3">
                                    <span className="text-[#F5CB5C] font-mono font-bold text-base">
                                        {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(Number(quote.estimatedCost) || 0)}
                                    </span>

                                    <div className="flex gap-1">
                                        {quote && (
                                            <QuoteDetailsSheet
                                                quote={{
                                                    ...quote,
                                                    estimatedCost: Number(quote.estimatedCost) || 0,
                                                    status: quote.status || 'BORRADOR'
                                                }}
                                                onQuoteUpdated={(updated) => {
                                                    const newQuotes = mergedQuotes.map(q => q.id === updated.id ? { ...q, status: updated.status } : q)
                                                    setMergedQuotes(newQuotes)
                                                }}
                                            />
                                        )}
                                        <DeleteQuoteButton
                                            quoteId={quote.id}
                                            quoteName={quote.clientName}
                                            onSuccess={() => handleDelete(quote.id)}
                                        />
                                    </div>
                                </div>
                            </div>
                        </Card>
                    )
                })}
            </div>
        </div>
    )
}

function maxProfiles(profiles: any[]) {
    if (!profiles.length) return null
    const first = profiles[0]
    const more = profiles.length - 1
    return (
        <div className="flex items-center gap-2">
            <span className="font-medium text-[#E8EDDF]">{first.count}x {first.role}</span>
            {more > 0 && <Badge variant="secondary" className="bg-[#333533] text-[10px] h-5 px-1.5">+{more}</Badge>}
        </div>
    )
}
