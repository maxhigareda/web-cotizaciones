-- 1. Enable RLS on all tables
ALTER TABLE "User" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Quote" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Client" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ServiceRate" ENABLE ROW LEVEL SECURITY;

-- 2. Create "Service Role" Policy (Bypass for Prisma/Server Actions)
-- This ensures that server-side operations using the correct connection string still work.
CREATE POLICY "Enable all for service_role" ON "User" FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Enable all for service_role" ON "Quote" FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Enable all for service_role" ON "Client" FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Enable all for service_role" ON "ServiceRate" FOR ALL TO service_role USING (true) WITH CHECK (true);

-- 3. User Policies (Strict Ownership)

-- --- User Table ---
-- Users can read their own profile.
CREATE POLICY "Users can read own profile" ON "User" FOR SELECT TO authenticated USING (auth.uid()::text = id);
-- Users can update their own profile.
CREATE POLICY "Users can update own profile" ON "User" FOR UPDATE TO authenticated USING (auth.uid()::text = id);
-- Admin Override: Admins can read all users
CREATE POLICY "Admins can read all users" ON "User" FOR SELECT TO authenticated USING (
  (SELECT role FROM "User" WHERE id = auth.uid()::text) = 'ADMIN'
);

-- --- Quote Table ---
-- Users can read their own quotes.
CREATE POLICY "Users can read own quotes" ON "Quote" FOR SELECT TO authenticated USING (auth.uid()::text = "userId");
-- Users can insert quotes (check userId matches their auth uid).
CREATE POLICY "Users can insert own quotes" ON "Quote" FOR INSERT TO authenticated WITH CHECK (auth.uid()::text = "userId");
-- Users can update/delete their own quotes.
CREATE POLICY "Users can update own quotes" ON "Quote" FOR UPDATE TO authenticated USING (auth.uid()::text = "userId");
CREATE POLICY "Users can delete own quotes" ON "Quote" FOR DELETE TO authenticated USING (auth.uid()::text = "userId");
-- Admin Override: Admins can do everything with quotes
CREATE POLICY "Admins can Manage All quotes" ON "Quote" FOR ALL TO authenticated USING (
  (SELECT role FROM "User" WHERE id = auth.uid()::text) = 'ADMIN'
);

-- --- Client Table ---
-- Similar ownership logic.
CREATE POLICY "Users can read own clients" ON "Client" FOR SELECT TO authenticated USING (auth.uid()::text = "userId");
CREATE POLICY "Users can insert own clients" ON "Client" FOR INSERT TO authenticated WITH CHECK (auth.uid()::text = "userId");
CREATE POLICY "Users can update own clients" ON "Client" FOR UPDATE TO authenticated USING (auth.uid()::text = "userId");
-- Admin Override
CREATE POLICY "Admins can Manage All clients" ON "Client" FOR ALL TO authenticated USING (
  (SELECT role FROM "User" WHERE id = auth.uid()::text) = 'ADMIN'
);

-- --- ServiceRate Table ---
-- Everyone (authenticated) can read rates.
CREATE POLICY "Authenticated can read rates" ON "ServiceRate" FOR SELECT TO authenticated USING (true);
-- Only Admins can modify.
CREATE POLICY "Admins can Manage rates" ON "ServiceRate" FOR ALL TO authenticated USING (
  (SELECT role FROM "User" WHERE id = auth.uid()::text) = 'ADMIN'
);
