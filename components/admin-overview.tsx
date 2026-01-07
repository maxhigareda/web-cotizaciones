'use client'

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Users, DollarSign, Activity, FileCheck } from "lucide-react"

const statsConfig = [
    {
        title: "Cotizaciones Mes",
        id: "monthlyQuotesCount",
        icon: FileCheck,
        color: "text-[#F5CB5C]",
        bg: "bg-[#F5CB5C]/10"
    },
    {
        title: "Valor Pipeline",
        id: "pipelineValue",
        icon: DollarSign,
        color: "text-[#E8EDDF]",
        bg: "bg-[#E8EDDF]/10",
        isCurrency: true
    },
    {
        title: "Usuarios Activos",
        id: "activeUsersCount",
        icon: Users,
        color: "text-[#CFDBD5]",
        bg: "bg-[#CFDBD5]/10"
    },
    {
        title: "Tasa Conversión",
        id: "conversionRate",
        icon: Activity,
        color: "text-emerald-400",
        bg: "bg-emerald-400/10",
        isPercent: true
    }
]

interface AdminOverviewProps {
    stats: {
        monthlyQuotesCount: number
        pipelineValue: number
        activeUsersCount: number
        conversionRate: number
    }
}

export function AdminOverview({ stats }: AdminOverviewProps) {
    return (
        <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-4">
            {statsConfig.map((config, i) => {
                const value = stats[config.id as keyof typeof stats]
                let displayValue = value.toString()

                if (config.isCurrency) {
                    displayValue = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(value)
                } else if (config.isPercent) {
                    displayValue = `${value}%`
                }

                return (
                    <Card key={i} className="bg-[#171717] border-[#2D2D2D] rounded-[2rem] hover:border-[#F5CB5C]/30 transition-all shadow-sm">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 p-8 pb-4">
                            <CardTitle className="text-sm font-bold text-[#CFDBD5] uppercase tracking-wider">
                                {config.title}
                            </CardTitle>
                            <div className={`p-3 rounded-xl ${config.bg}`}>
                                <config.icon className={`h-5 w-5 ${config.color}`} />
                            </div>
                        </CardHeader>
                        <CardContent className="p-8 pt-0">
                            <div className="text-4xl font-black text-[#E8EDDF]">{displayValue}</div>
                            {/* Static change for now as we don't calculate prev month yet */}
                            <p className="text-sm text-[#CFDBD5] mt-2 opacity-60 font-medium">
                                Actualizado recientemente
                            </p>
                        </CardContent>
                    </Card>
                )
            })}
        </div>
    )
}
