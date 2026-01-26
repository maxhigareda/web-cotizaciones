import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { prisma } from '@/lib/prisma'

export async function GET(request: Request) {
    const requestUrl = new URL(request.url)
    const code = requestUrl.searchParams.get('code')
    const origin = requestUrl.origin
    const allParams = Object.fromEntries(requestUrl.searchParams.entries())

    console.log(`[Auth Callback] Params received:`, allParams)

    if (!code) {
        // Fallback for error descriptions
        const errorDescription = requestUrl.searchParams.get('error_description') || requestUrl.searchParams.get('error')
        const msg = errorDescription ? `Provider Error: ${errorDescription}` : "Validation failed: No code received. Check your Redirect URL config."

        // Return to login with specific error
        return NextResponse.redirect(`${origin}/login?error=${encodeURIComponent(msg)}`)
    }

    const cookieStore = await cookies()

    // Create a Supabase client configured to use cookies
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://gcajouecfyhcpbazxjhy.supabase.co"
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "sb_publishable_NDFtz_7ldXuNu3yP3ZsVfA_te2fF1_S"

    const supabase = createServerClient(
        supabaseUrl,
        supabaseKey,
        {
            cookies: {
                get(name: string) {
                    return cookieStore.get(name)?.value
                },
                set(name: string, value: string, options: CookieOptions) {
                    cookieStore.set({ name, value, ...options })
                },
                remove(name: string, options: CookieOptions) {
                    cookieStore.delete({ name, ...options })
                },
            },
        }
    )

    // Exchange the code for a session
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)

    if (error) {
        console.error("[Auth] Code Exchange Error:", error)
        return NextResponse.redirect(`${origin}/login?error=Exchange Failed: ${encodeURIComponent(error.message)}`)
    }

    if (!data.session?.user?.email) {
        console.error("[Auth] No email in session")
        return NextResponse.redirect(`${origin}/login?error=No Email provided by Google`)
    }

    const email = data.session.user.email
    const fullName = data.session.user.user_metadata?.full_name || email.split('@')[0]

    let user = null

    // 3. User Sync (Upsert Strategy) - STRICT SYNC
    // We use the Supabase User ID as the Prisma Primary Key
    try {
        console.log(`[AUTH] Sincronizando usuario verificado: ${email}`)

        user = await prisma.user.upsert({
            where: { email: email },
            update: {}, // No updates, just ensure existence
            create: {
                id: data.session.user.id, // CRITICAL: Use Supabase ID
                name: fullName,
                email: email,
                password: '', // Managed by Supabase
                role: 'CONSULTOR',
            }
        })

        console.log(`[DB] Éxito: Usuario persistido ID=${user.id}`)

    } catch (dbError: any) {
        console.error("[Auth] Database Sync Error:", dbError)
        return NextResponse.redirect(`${origin}/login?error=Error BD: ${encodeURIComponent(dbError.message)}`)
    }

    // Set App-Specific Session Cookies
    if (user) {
        const cookieOptions = {
            path: '/',
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax' as const
        }

        cookieStore.set('session_role', user.role, cookieOptions)
        cookieStore.set('session_user', user.name || user.email, cookieOptions)
        cookieStore.set('session_user_id', user.id, cookieOptions)

        return new NextResponse(`
            <html>
                <head>
                    <title>Email Verificado</title>
                    <meta charset="utf-8">
                    <style>
                        body { background: #171717; color: #E8EDDF; font-family: sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; text-align: center; }
                        h1 { color: #F5CB5C; margin-bottom: 20px; }
                        p { font-size: 1.1rem; opacity: 0.8; }
                        .card { background: #2D2D2D; padding: 40px; border-radius: 20px; box-shadow: 0 10px 30px rgba(0,0,0,0.5); border: 1px solid #4ade80; }
                    </style>
                </head>
                <body>
                    <div class="card">
                        <h1>¡Email Verificado! ✅</h1>
                        <p>Ya puedes cerrar esta pestaña.</p>
                        <p>Tu sesión se iniciará automáticamente en la pestaña anterior.</p>
                        <script>
                            setTimeout(() => {
                                window.close();
                            }, 2500);
                        </script>
                    </div>
                </body>
            </html>
        `, {
            headers: { 'Content-Type': 'text/html' },
        })
    }

    return NextResponse.redirect(`${origin}/login?error=Unknown Auth State`)
}
