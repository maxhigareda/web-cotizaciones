
import { prisma } from '../lib/prisma'

async function main() {
    console.log("Enabling Row Level Security (RLS) on critical tables...")

    try {
        // 1. Enable RLS
        await prisma.$executeRawUnsafe(`ALTER TABLE "User" ENABLE ROW LEVEL SECURITY;`)
        await prisma.$executeRawUnsafe(`ALTER TABLE "Client" ENABLE ROW LEVEL SECURITY;`)
        await prisma.$executeRawUnsafe(`ALTER TABLE "Quote" ENABLE ROW LEVEL SECURITY;`)
        console.log("RLS Enabled on User, Client, Quote.")

        // 2. Service Role Policies (Allow Backend/Prisma Full Access)
        // Note: Prisma usually connects as a role that might bypass RLS (e.g. postgres or service_role in supabase).
        // But if using pooling (pgbouncer), RLS applies. Explicit policies for the service_role are safest.

        // Quote
        await prisma.$executeRawUnsafe(`DROP POLICY IF EXISTS "Enable all for service role" ON "Quote";`)
        await prisma.$executeRawUnsafe(`CREATE POLICY "Enable all for service role" ON "Quote" TO service_role USING (true) WITH CHECK (true);`)

        // User
        await prisma.$executeRawUnsafe(`DROP POLICY IF EXISTS "Enable all for service role" ON "User";`)
        await prisma.$executeRawUnsafe(`CREATE POLICY "Enable all for service role" ON "User" TO service_role USING (true) WITH CHECK (true);`)

        // Client
        await prisma.$executeRawUnsafe(`DROP POLICY IF EXISTS "Enable all for service role" ON "Client";`)
        await prisma.$executeRawUnsafe(`CREATE POLICY "Enable all for service role" ON "Client" TO service_role USING (true) WITH CHECK (true);`)

        console.log("Service Role policies applied.")

        // 3. Authenticated User Policies (Strict: Only Own Data)
        // These apply if a client connects with a valid Supabase Auth JWT (authenticated role)

        // Quote: View Own
        await prisma.$executeRawUnsafe(`DROP POLICY IF EXISTS "Users can see own quotes" ON "Quote";`)
        await prisma.$executeRawUnsafe(`CREATE POLICY "Users can see own quotes" ON "Quote" FOR SELECT TO authenticated USING (auth.uid()::text = "userId");`)

        // User: View Self
        await prisma.$executeRawUnsafe(`DROP POLICY IF EXISTS "Users can see self" ON "User";`)
        await prisma.$executeRawUnsafe(`CREATE POLICY "Users can see self" ON "User" FOR SELECT TO authenticated USING (auth.uid()::text = id);`)

        // Client: View Linked? (Assuming implicit permission if they created logic for PROSPECTO)
        // For now, restrictive (only service role sees clients) to avoid leak. 
        // Or if linkedClientId is in Quote, maybe join? Too complex for basic RLS.
        // Let's assume users don't query Clients directly via Realtime for now.

        console.log("Authenticated User policies applied.")

        // 4. Anon Policies (Public) -> NONE (Default Deny)
        // This effectively BLOCKS public access, securing the DB.

        console.log("RLS Configuration Complete. Public access is now RESTRICTED.")

    } catch (e) {
        console.error("Failed to enable RLS:", e)
    } finally {
        await prisma.$disconnect()
    }
}

main()
