'use server'

import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'
import { createServerClient, type CookieOptions } from '@supabase/ssr'

export async function loginAction(formData: FormData) {
    const email = formData.get('email') as string
    const password = formData.get('password') as string

    if (!email || !password) {
        return { error: "Credenciales incompletas" }
    }

    const cookieStore = await cookies()

    // 1. Supabase Auth Login
    // We use createServerClient to handle the auth session on the server
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

    const supabase = createServerClient(supabaseUrl, supabaseKey, {
        cookies: {
            get(name: string) { return cookieStore.get(name)?.value },
            set(name: string, value: string, options: CookieOptions) { cookieStore.set({ name, value, ...options }) },
            remove(name: string, options: CookieOptions) { cookieStore.delete({ name, ...options }) },
        },
    })

    const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
    })

    if (error) {
        console.error("[Login] Supabase Auth Error:", error.message)

        // DUAL CHECK: If Supabase fails, check if user exists in Prisma (Legacy/Manual without Auth)
        try {
            const legacyUser = await prisma.user.findUnique({ where: { email } })
            if (legacyUser) {
                console.warn("[Login] Legacy user found in DB but not in Auth:", email)
                return { error: "Cuenta antigua detectada. Por favor contacta soporte para migrarte." }
            }
        } catch (e) {
            console.error("[Login] Legacy check failed", e)
        }

        // Standard Error
        return { error: "Credenciales inválidas o correo no verificado." }
    }

    // 2. Sync with Prisma (Upsert)
    // Now that we verified credentials, we ensure our DB has the user
    // This handles cases where a user might exist in Auth but not in our DB (rare but possible)
    let user = null
    try {
        const fullName = email.split('@')[0]
        user = await prisma.user.upsert({
            where: { email },
            update: {},
            create: {
                name: fullName,
                email,
                password: '', // Managed by Supabase
                role: 'USER',
            }
        })
    } catch (dbError) {
        console.error("[Login] DB Sync Error:", dbError)
        return { error: "Error de sincronización con la base de datos." }
    }

    // 3. Set App Session Cookies
    // We keep our own cookies for the app's logic (Multitenancy)
    const cookieOptions = { path: '/', httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax' as const }
    cookieStore.set('session_role', user.role, cookieOptions)
    cookieStore.set('session_user', user.name, cookieOptions)
    cookieStore.set('session_user_id', user.id, cookieOptions)

    console.log(`[AUTH] Login Exitoso: ${email}`)

    if (user.role === 'ADMIN') {
        redirect('/admin')
    } else {
        redirect('/quote/new')
    }
}

export async function registerAction(formData: FormData) {
    const email = formData.get('email') as string
    const password = formData.get('password') as string

    if (!email || !password) {
        return { error: "Credenciales incompletas" }
    }

    // 1. Duplicate Check (Prisma)
    // We check our DB first to give a fast, clear error
    const existingUser = await prisma.user.findUnique({ where: { email } })
    if (existingUser) {
        return { error: "Cuenta existente. Por favor, inicia sesión." }
    }

    // 2. Supabase Sign Up
    const cookieStore = await cookies()
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

    const supabase = createServerClient(supabaseUrl, supabaseKey, {
        cookies: {
            get(name: string) { return cookieStore.get(name)?.value },
            set(name: string, value: string, options: CookieOptions) { cookieStore.set({ name, value, ...options }) },
            remove(name: string, options: CookieOptions) { cookieStore.delete({ name, ...options }) },
        },
    })

    const callbackUrl = process.env.NODE_ENV === 'production'
        ? 'https://web-cotizaciones.vercel.app/auth/v1/callback'
        : 'http://localhost:3000/auth/v1/callback'

    const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
            emailRedirectTo: callbackUrl
        }
    })

    if (error) {
        console.error("[Register] Supabase Error:", error)
        return { error: error.message }
    }

    // 3. Success -> Verification Required
    // We do NOT create the user in Prisma yet. 
    // The user will be created by the Callback Route when they click the email link.
    if (data.user && !data.session) {
        return { success: true, message: "Registro iniciado. Revisa tu correo para verificar tu cuenta." }
    }

    // Edge case: If email auto-confirmed (dev settings), log them in? 
    // For now, let's treat it as success message flow usually.
    return { success: true, message: "Registro exitoso. Iniciando..." }
}

export async function logoutAction() {
    const cookieStore = await cookies()
    cookieStore.delete('session_role')
    cookieStore.delete('session_user')
    cookieStore.delete('session_user_id')
    redirect('/')
}

export async function getSessionRole() {
    return (await cookies()).get('session_role')?.value || null
}

export async function getSessionUser() {
    const val = (await cookies()).get('session_user')?.value || null
    if (val === 'Consultor Demo' || val === 'Consultor Tomas') return 'Tomas Marzullo'
    return val
}

export async function getSessionUserId() {
    return (await cookies()).get('session_user_id')?.value || null
}


