
import { createClient } from '@supabase/supabase-js'
import { PrismaClient } from '@prisma/client'

// Initialize clients
// We need to read env vars directly as we are running in NODE context via tsx
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const prisma = new PrismaClient()

if (!supabaseUrl || !supabaseServiceKey) {
    console.error("Missing Supabase Env Vars")
    process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
})

const ADMIN_EMAIL = 'admin@antigravity.com'
const ADMIN_PASSWORD = 'admin2026'

async function main() {
    console.log(`Starting Admin Creation for: ${ADMIN_EMAIL}`)

    let userId = ''

    // 1. Check/Create Supabase Auth User
    const { data: { users }, error: listError } = await supabase.auth.admin.listUsers()

    // We can't filter by email easily in listUsers without pagination, 
    // but for this small app, we iterate or rely on createUser error.
    // Better: use createUser with upsert-like logic implicitly? No.
    // Let's try to get user by email is not available in admin api directly in early versions?
    // Actually listUsers isn't great for specific lookup.
    // We can try to CREATE. If it fails with "already registered", we try to update.

    let user = users.find(u => u.email === ADMIN_EMAIL)

    if (user) {
        console.log("User exists in Supabase. Updating password...")
        const { data, error } = await supabase.auth.admin.updateUserById(
            user.id,
            { password: ADMIN_PASSWORD, email_confirm: true, user_metadata: { full_name: 'Super Admin' } }
        )
        if (error) {
            console.error("Failed to update password:", error)
            process.exit(1)
        }
        userId = user.id
        console.log("Supabase Auth Updated.")
    } else {
        console.log("Creating new Supabase User...")
        const { data, error } = await supabase.auth.admin.createUser({
            email: ADMIN_EMAIL,
            password: ADMIN_PASSWORD,
            email_confirm: true,
            user_metadata: { full_name: 'Super Admin' }
        })
        if (error) {
            console.error("Failed to create user:", error)
            process.exit(1)
        }
        if (!data.user) {
            console.error("No user data returned")
            process.exit(1)
        }
        userId = data.user.id
        console.log("Supabase User Created.")
    }

    // 2. Upsert Prisma User
    console.log(`Upserting Prisma User with ID: ${userId}`)
    try {
        const dbUser = await prisma.user.upsert({
            where: { email: ADMIN_EMAIL },
            update: {
                id: userId, // Ensure ID matches Supabase
                password: '', // Managed by Supabase
                role: 'ADMIN',
                name: 'Super Admin'
            },
            create: {
                id: userId,
                email: ADMIN_EMAIL,
                name: 'Super Admin',
                password: '',
                role: 'ADMIN'
            }
        })
        console.log("Prisma User Upserted:", dbUser)
    } catch (e) {
        console.error("Prisma Error:", e)
        process.exit(1)
    }

    console.log("SUCCESS: Admin user ready.")
}

main()
    .catch((e) => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
