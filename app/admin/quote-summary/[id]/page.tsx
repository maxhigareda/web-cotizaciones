import { redirect } from "next/navigation"
import { cookies } from "next/headers"
import { prisma } from "@/lib/prisma"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { ArrowLeft, Download, ShieldCheck, Mail, Calendar, User, Building2, Briefcase, ChevronRight } from "lucide-react"

async function getQuote(id: string) {
    return prisma.quote.findUnique({
        where: { id },
    })
}

export default async function AdminQuoteSummaryPage({ params }: { params: { id: string } }) {
    // 1. Admin Verification
    const cookieStore = await cookies()
    const role = cookieStore.get('session_role')?.value

    if (role !== 'admin') {
        redirect('/')
    }

    const quote = await getQuote(params.id)

    if (!quote) {
        return (
            <div className="flex h-screen items-center justify-center bg-[#1a1a1a] text-[#E8EDDF]">
                <div className="text-center space-y-4">
                    <h1 className="text-2xl font-bold">Cotización no encontrada</h1>
                    <Button variant="outline" asChild>
                        <a href="/admin">Volver al Panel</a>
                    </Button>
                </div>
            </div>
        )
    }

    // Parse JSON details
    let details: any = {}
    try {
        details = JSON.parse(quote.technicalParameters)
        // Merge Staffing Details if stored separately in schema (v2) or inside params (v1)
        // Schema has logic to put everything in technicalParameters usually, 
        // but let's check staffingRequirements
        if (quote.staffingRequirements) {
            const extra = JSON.parse(quote.staffingRequirements)
            details = { ...details, staffingDetails: extra }
        }
    } catch (e) {
        console.error("Error parsing details", e)
    }

    // Determine Profiles Source
    const profiles = details.staffingDetails?.profiles || []

    // Calculate Totals (Reconstruct from snapshot prices)
    // Note: details object should have the stored totals: finalTotal, grossTotal etc.
    // If not, we might need to recalculate, but the request says "read only snapshot".
    // We will trust the stored totals in JSON.

    const totals = {
        gross: details.grossTotal || 0,
        retention: details.retentionAmount || 0,
        net: details.finalTotal || quote.estimatedCost || 0,
        discount: details.discountAmount || 0
    }

    return (
        <div className="min-h-screen bg-[#1a1a1a] text-[#E8EDDF] font-sans selection:bg-[#F5CB5C]/30">
            {/* Header / Nav */}
            <div className="sticky top-0 z-50 bg-[#1a1a1a]/80 backdrop-blur-md border-b border-[#333533]">
                <div className="container mx-auto max-w-5xl px-6 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Button variant="ghost" size="sm" asChild className="text-[#CFDBD5] hover:text-[#F5CB5C]">
                            <a href="/admin">
                                <ArrowLeft className="w-4 h-4 mr-2" />
                                Trazabilidad
                            </a>
                        </Button>
                        <div className="h-4 w-[1px] bg-[#333533]" />
                        <span className="text-sm font-mono text-[#CFDBD5] opacity-50">REF: {quote.id.substring(0, 8)}</span>
                    </div>
                    <Badge variant="outline" className="bg-[#F5CB5C]/10 text-[#F5CB5C] border-[#F5CB5C]/20 uppercase tracking-widest text-[10px]">
                        Vista Ejecutiva
                    </Badge>
                </div>
            </div>

            <main className="container mx-auto max-w-4xl px-6 py-12">

                {/* PROJECT HEADER CARD */}
                <div className="mb-8 p-8 rounded-[2rem] bg-gradient-to-br from-[#242423] to-[#1D1D1C] border border-[#333533] shadow-2xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-[#F5CB5C]/5 blur-[80px] rounded-full pointer-events-none" />

                    <div className="relative z-10 flex flex-col md:flex-row md:items-start justify-between gap-6">
                        <div className="space-y-4">
                            <div>
                                <h4 className="text-[#F5CB5C] text-xs font-bold uppercase tracking-widest mb-1">PROYECTO</h4>
                                <h1 className="text-3xl md:text-4xl font-bold text-white tracking-tight">{quote.projectType || 'Sin Título'}</h1>
                            </div>

                            <div className="flex flex-wrap items-center gap-6 text-sm text-[#CFDBD5]">
                                <div className="flex items-center gap-2">
                                    <Building2 className="w-4 h-4 text-[#F5CB5C]" />
                                    <span className="font-medium">{quote.clientName || 'Cliente Confidencial'}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Calendar className="w-4 h-4 text-[#F5CB5C]" />
                                    <span>{format(new Date(quote.createdAt), "d MMM, yyyy", { locale: es })}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Briefcase className="w-4 h-4 text-[#F5CB5C]" />
                                    <span>{quote.serviceType}</span>
                                </div>
                            </div>
                        </div>

                        <div className="flex flex-col items-end gap-2">
                            <span className="text-xs text-[#CFDBD5] uppercase tracking-wider">Estado Actual</span>
                            <Badge
                                className={`px-4 py-1.5 text-sm font-bold border rounded-full capitalize ${quote.status === 'APROBADA' ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' :
                                    quote.status === 'RECHAZADA' ? 'bg-red-500/20 text-red-400 border-red-500/30' :
                                        quote.status === 'ENVIADA' ? 'bg-blue-500/20 text-blue-400 border-blue-500/30' :
                                            'bg-zinc-500/20 text-zinc-400 border-zinc-500/30'
                                    }`}
                            >
                                {quote.status.toLowerCase()}
                            </Badge>
                        </div>
                    </div>
                </div>

                {/* TEAM BREAKDOWN */}
                <div className="space-y-6 mb-12">
                    <div className="flex items-center justify-between">
                        <h3 className="text-xl font-bold flex items-center gap-3">
                            <span className="w-8 h-8 rounded-full bg-[#333533] flex items-center justify-center text-[#F5CB5C] text-sm font-black">01</span>
                            Equipo y Perfiles
                        </h3>
                        <div className="h-[1px] flex-1 bg-[#333533] ml-6" />
                    </div>

                    <Card className="bg-[#242423] border-[#333533] overflow-hidden">
                        <div className="grid grid-cols-12 gap-4 p-4 bg-[#333533]/50 text-xs font-bold text-[#CFDBD5] uppercase tracking-wider border-b border-[#333533]">
                            <div className="col-span-5 pl-2">Perfil</div>
                            <div className="col-span-2 text-center">Seniority</div>
                            <div className="col-span-2 text-center">Cant.</div>
                            <div className="col-span-3 text-right pr-2">Subtotal</div>
                        </div>

                        <div className="divide-y divide-[#333533]">
                            {profiles.length > 0 ? (
                                profiles.map((p: any, idx: number) => {
                                    const cost = p.price || 0
                                    const total = cost * (p.count || 1)

                                    return (
                                        <div key={idx} className="grid grid-cols-12 gap-4 p-4 text-sm hover:bg-[#333533]/30 transition-colors items-center">
                                            <div className="col-span-5 font-medium text-white pl-2">
                                                {p.role}
                                                {p.skills && <div className="text-xs text-[#CFDBD5] mt-0.5 font-normal">{p.skills}</div>}
                                            </div>
                                            <div className="col-span-2 flex justify-center">
                                                <Badge variant="outline" className={`
                                                    border-0 font-mono text-xs px-2 py-0.5
                                                    ${p.seniority === 'Expert' ? 'bg-amber-500/10 text-amber-500' :
                                                        p.seniority === 'Sr' ? 'bg-purple-500/10 text-purple-500' :
                                                            p.seniority === 'Ssr' ? 'bg-blue-500/10 text-blue-500' : 'bg-emerald-500/10 text-emerald-500'}
                                                `}>
                                                    {p.seniority}
                                                </Badge>
                                            </div>
                                            <div className="col-span-2 text-center text-[#CFDBD5] font-mono">
                                                {p.count}
                                            </div>
                                            <div className="col-span-3 text-right pr-2 font-mono text-[#F5CB5C]">
                                                ${total.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                            </div>
                                        </div>
                                    )
                                })
                            ) : (
                                <div className="p-8 text-center text-[#CFDBD5] opacity-50 italic">
                                    Sin desglose de perfiles disponible (Cotización Legacy)
                                </div>
                            )}
                        </div>
                    </Card>
                </div>

                {/* FINANCIAL SUMMARY */}
                <div className="space-y-6">
                    <div className="flex items-center justify-between">
                        <h3 className="text-xl font-bold flex items-center gap-3">
                            <span className="w-8 h-8 rounded-full bg-[#333533] flex items-center justify-center text-[#F5CB5C] text-sm font-black">02</span>
                            Resumen Financiero
                        </h3>
                        <div className="h-[1px] flex-1 bg-[#333533] ml-6" />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {/* NOTES */}
                        <div className="p-6 rounded-2xl bg-[#242423] border border-[#333533]">
                            <h4 className="text-sm font-bold text-[#CFDBD5] mb-4 uppercase flex items-center gap-2">
                                <ShieldCheck className="w-4 h-4" /> Notas de Aprobación
                            </h4>
                            <p className="text-sm text-[#CFDBD5]/70 leading-relaxed">
                                Esta cotización utiliza precios dinámicos basados en la fecha de creación.
                                Los valores mostrados son finales para el cliente.
                                <br /><br />
                                Al aprobar, se notificará automáticamente al consultor responsable.
                            </p>
                        </div>

                        {/* TOTALS */}
                        <Card className="bg-[#1D1D1C] border-[#333533]">
                            <CardContent className="p-6 space-y-3">
                                <div className="flex justify-between text-sm text-[#CFDBD5]">
                                    <span>Total Bruto</span>
                                    <span className="font-mono">${totals.gross.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                                </div>
                                {totals.discount > 0 && (
                                    <div className="flex justify-between text-sm text-green-400">
                                        <span>Descuento Comercial</span>
                                        <span className="font-mono">-${totals.discount.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                                    </div>
                                )}
                                {totals.retention > 0 && (
                                    <div className="flex justify-between text-sm text-red-300 opacity-70">
                                        <span>Retención Aplicada</span>
                                        <span className="font-mono">-${totals.retention.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                                    </div>
                                )}
                                <Separator className="bg-[#333533] my-2" />
                                <div className="flex justify-between items-end">
                                    <span className="text-[#F5CB5C] font-bold uppercase text-sm tracking-wider">Inversión Neta Mensual</span>
                                    <span className="text-2xl font-bold text-[#F5CB5C] font-mono">
                                        ${totals.net.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                    </span>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>

                <div className="mt-12 flex justify-center">
                    <Button size="lg" className="bg-[#F5CB5C] text-[#242423] hover:bg-[#F5CB5C]/90 font-bold px-8 rounded-full shadow-[0_0_20px_rgba(245,203,92,0.2)]" asChild>
                        <a href="/admin">
                            Volver a Trazabilidad para Decidir
                        </a>
                    </Button>
                </div>

            </main>
        </div>
    )
}
