'use client'

import { Button } from "@/components/ui/button"
import { logoutAction } from "@/lib/auth"

export function LogoutButton() {
    return (
        <Button
            variant="ghost"
            size="sm"
            onClick={async () => {
                // 1. Client-Side Global Cleanup
                try {
                    const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
                    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
                    if (url && key) {
                        const { createBrowserClient } = await import('@supabase/ssr')
                        const supabase = createBrowserClient(url, key)
                        await supabase.auth.signOut({ scope: 'global' }) // CRITICAL: Kill generic sessions
                    }
                } catch (e) { console.error("Client cleanup failed", e) }

                // 2. Server-Side Cleanup (Cookies)
                await logoutAction()
            }}
            className="text-[#E8EDDF] hover:bg-[#333533] hover:text-[#F5CB5C] border border-transparent hover:border-[#CFDBD5]/20"
        >
            Logout
        </Button>
    )
}
