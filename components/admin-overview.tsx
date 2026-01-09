'use client'

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Users, DollarSign, Activity, FileCheck } from "lucide-react"
import { useState, useEffect } from "react"

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

export function AdminOverview({ stats: initialStats }: AdminOverviewProps) {
    const [stats, setStats] = useState(initialStats)

    useEffect(() => {
        // Load demo quotes from local storage
        const saved = localStorage.getItem('demo_quotes')
        if (saved) {
            try {
                const quotes: any[] = JSON.parse(saved)

                // 1. Monthly Quotes (Approximation: All quotes in demo mode or filter by date if available)
                const currentMonth = new Date().getMonth()
                const monthlyQuotes = quotes.filter(q => {
                    const d = new Date(q.createdAt || Date.now()) // Fallback to now if no date
                    return d.getMonth() === currentMonth
                })

                // 2. Pipeline Value (Total Monthly * Duration)
                const pipelineVal = quotes.reduce((acc, q) => {
                    const monthly = q.costBreakdown?.totalWithRisk || 0
                    const duration = q.durationMonths || 6
                    return acc + (monthly * duration)
                }, 0)

                // 3. Active Users (Unique Clients)
                const uniqueClients = new Set(quotes.map(q => q.clientName)).size

                // 4. Conversion Rate (Proxy: % of High Complexity Quotes)
                const highComplexity = quotes.filter(q => q.complexity === 'high').length
                const conversion = quotes.length > 0 ? Math.round((highComplexity / quotes.length) * 100) : 0

                setStats({
                    monthlyQuotesCount: monthlyQuotes.length,
                    pipelineValue: pipelineVal,
                    activeUsersCount: uniqueClients,
                    conversionRate: conversion
                })
            } catch (e) {
                console.error("Error calculating admin stats", e)
            }
        }
    }, [])

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
                    <Card key={i} className="bg-[#171717] border-[#2D2D2D] rounded-[2rem] hover:border-[#F5CB5C]/30 transition-all shadow-sm group cursor-default">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 p-8 pb-4">
                            <CardTitle className="text-sm font-bold text-[#CFDBD5] uppercase tracking-wider group-hover:text-[#F5CB5C] transition-colors">
                                {config.title}
                            </CardTitle>
                            <div className={`p-3 rounded-xl transition-all group-hover:scale-110 ${config.bg}`}>
                                <config.icon className={`h-5 w-5 ${config.color}`} />
                            </div>
                        </CardHeader>
                        <CardContent className="p-8 pt-0">
                            <div className="text-4xl font-black text-[#E8EDDF]">{displayValue}</div>
                            <p className="text-sm text-[#CFDBD5] mt-2 opacity-60 font-medium flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                                Actualizado en tiempo real
                            </p>
                        </CardContent>
                    </Card>
                )
            })}
        </div>
    )
}
