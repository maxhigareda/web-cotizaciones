"use client"

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Mail, ArrowLeft, CheckCircle2 } from 'lucide-react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { Suspense } from 'react'

function VerifyContent() {
    const searchParams = useSearchParams()
    const email = searchParams.get('email')

    return (
        <Card className="w-full max-w-lg bg-[#171717] border border-[#2D2D2D] shadow-2xl rounded-[2.5rem] relative z-10 overflow-hidden">
            <CardHeader className="text-center pt-10 pb-2 border-b border-[#2D2D2D]/50">
                <div className="w-20 h-20 bg-[#1F1F1F] rounded-[1.5rem] mx-auto mb-6 flex items-center justify-center border border-[#2D2D2D] shadow-[0_4px_20px_rgba(0,0,0,0.5)]">
                    <Mail className="w-8 h-8 text-[#F5CB5C]" />
                </div>
                <CardTitle className="text-3xl font-black text-[#E8EDDF] tracking-tight mb-2">
                    Verifica tu Correo
                </CardTitle>
                <CardDescription className="text-[#CFDBD5] text-base px-6">
                    Hemos enviado un enlace de confirmación a tu bandeja de entrada.
                </CardDescription>
            </CardHeader>

            <CardContent className="p-10 space-y-8 flex flex-col items-center">

                {email && (
                    <div className="bg-[#242423] border border-[#333] px-6 py-3 rounded-xl text-[#F5CB5C] font-mono text-sm tracking-wide">
                        {email}
                    </div>
                )}

                <div className="space-y-4 text-center">
                    <div className="flex items-center gap-3 text-[#CFDBD5] bg-[#1F1F1F]/50 p-4 rounded-2xl border border-[#2D2D2D]">
                        <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0" />
                        <span className="text-left text-sm leading-relaxed">
                            Por favor, haz clic en el enlace del correo para activar tu cuenta de <strong>Consultor</strong>.
                        </span>
                    </div>

                    <p className="text-xs text-[#CFDBD5]/50 px-4">
                        Si no lo encuentras, revisa tu carpeta de Spam.
                    </p>
                </div>

                <Link href="/login" className="w-full">
                    <Button
                        className="w-full h-16 rounded-[1.5rem] font-bold text-xl transition-all hover:scale-[1.02] bg-[#2D2D2D] hover:bg-[#3D3D3D] text-[#E8EDDF] border border-[#3D3D3D] flex items-center justify-center gap-3"
                    >
                        <ArrowLeft className="w-6 h-6" /> Volver al Inicio
                    </Button>
                </Link>

                <div className="pt-2 border-t border-[#2D2D2D]/50 text-center w-full">
                    <p className="text-xs text-[#CFDBD5]/30 uppercase tracking-widest font-medium pt-4">
                        Cotizador Solutions &copy; 2026
                    </p>
                </div>
            </CardContent>
        </Card>
    )
}

export default function VerifyPage() {
    return (
        <main className="min-h-screen w-full bg-[#171717] flex items-center justify-center p-6 relative overflow-hidden">
            {/* Ambient Background Effects */}
            <div className="absolute top-0 right-1/4 w-[500px] h-[500px] bg-[#F5CB5C] rounded-full blur-[120px] opacity-[0.03] pointer-events-none" />
            <div className="absolute bottom-0 left-1/4 w-[400px] h-[400px] bg-[#CFDBD5] rounded-full blur-[100px] opacity-[0.02] pointer-events-none" />

            <Suspense fallback={<div className="text-[#CFDBD5]">Cargando...</div>}>
                <VerifyContent />
            </Suspense>
        </main>
    )
}
