import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createClient } from '@supabase/supabase-js'
import { prisma } from '@/lib/prisma'

export async function GET(request: Request) {
    const requestUrl = new URL(request.url)
    const code = requestUrl.searchParams.get('code')
    const origin = requestUrl.origin

    // 1. Validate Code
    if (!code) {
        return NextResponse.redirect(`${origin}/login?error=Google login validation failed (No code)`)
    }

    const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    // 2. Exchange credentials
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)

    if (error || !data.session?.user?.email) {
        console.error("Supabase Auth Code Exchange Error:", error)
        return NextResponse.redirect(`${origin}/login?error=Google Auth Failed`)
    }

    const email = data.session.user.email
    const fullName = data.session.user.user_metadata?.full_name || email.split('@')[0]

    let user = null

    try {
        // 3. User Sync (Upsert Strategy)
        // Use upsert to handle both "Login" and "Sign Up" atomically
        // This prevents race conditions and ensures user always exists after this step
        user = await prisma.user.upsert({
            where: { email: email },
            update: {
                // Optional: Update name if changed in Google? 
                // data: { name: fullName } 
                // For now, we leave existing users untouched
            },
            create: {
                name: fullName,
                email: email,
                password: '', // OAuth users have empty password
                role: 'USER', // Default role
            }
        })

        console.log(`[Auth] User synced successfully: ${email} (${user.id})`)

    } catch (dbError: any) {
        console.error("[Auth] Database Sync Error:", dbError)
        return NextResponse.redirect(`${origin}/login?error=Database Error: ${encodeURIComponent(dbError.message || 'Unknown')}`)
    }

    // 4. Session Cookies
    if (user) {
        const cookieStore = await cookies()
        // Secure cookies for production
        const cookieOptions = {
            path: '/',
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax' as const // Recommended for OAuth redirects
        }

        cookieStore.set('session_role', user.role, cookieOptions)
        cookieStore.set('session_user', user.name || user.email, cookieOptions)
        cookieStore.set('session_user_id', user.id, cookieOptions)

        // 5. Final Redirect to Project Builder
        return NextResponse.redirect(`${origin}/quote/new`)
    }

    return NextResponse.redirect(`${origin}/login?error=Unexpected Auth State`)
}
