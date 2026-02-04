import { createClient } from '@supabase/supabase-js'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// Create admin client for Supabase Auth management
const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
        auth: {
            autoRefreshToken: false,
            persistSession: false
        }
    }
)

async function syncSupabaseAuth() {
    try {
        console.log('🔄 SINCRONIZACIÓN DE SUPABASE AUTH\n')

        const targetEmail = 'maxhigareda@thestoreintelligence.com'
        const newPassword = 'admin2026'

        // Step 1: Check if user exists in Supabase Auth
        console.log('📋 Paso 1: Verificando usuario en Supabase Auth...')
        const { data: authUsers, error: listError } = await supabaseAdmin.auth.admin.listUsers()

        if (listError) {
            console.error('❌ Error listando usuarios de Supabase Auth:', listError.message)
            process.exit(1)
        }

        const existingAuthUser = authUsers.users.find(u => u.email === targetEmail)

        if (existingAuthUser) {
            console.log(`✅ Usuario encontrado en Supabase Auth: ${existingAuthUser.email}`)
            console.log(`   - ID: ${existingAuthUser.id}`)
            console.log(`   - Creado: ${existingAuthUser.created_at}`)
            console.log(`   - Email confirmado: ${existingAuthUser.email_confirmed_at ? 'Sí' : 'No'}\n`)

            // Step 2: Update password in Supabase Auth
            console.log('📋 Paso 2: Actualizando contraseña en Supabase Auth...')
            const { data: updateData, error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
                existingAuthUser.id,
                {
                    password: newPassword,
                    email_confirm: true
                }
            )

            if (updateError) {
                console.error('❌ Error actualizando contraseña:', updateError.message)
                process.exit(1)
            }

            console.log('✅ Contraseña actualizada en Supabase Auth\n')

        } else {
            console.log(`ℹ️  Usuario NO encontrado en Supabase Auth`)
            console.log('📋 Paso 2: Creando usuario en Supabase Auth...\n')

            // Get user from Prisma
            const prismaUser = await prisma.user.findUnique({
                where: { email: targetEmail }
            })

            if (!prismaUser) {
                console.error('❌ ERROR: Usuario no encontrado en Prisma')
                process.exit(1)
            }

            // Create user in Supabase Auth
            const { data: createData, error: createError } = await supabaseAdmin.auth.admin.createUser({
                email: targetEmail,
                password: newPassword,
                email_confirm: true,
                user_metadata: {
                    full_name: prismaUser.name,
                    role: prismaUser.role
                }
            })

            if (createError) {
                console.error('❌ Error creando usuario en Supabase Auth:', createError.message)
                process.exit(1)
            }

            console.log('✅ Usuario creado en Supabase Auth')
            console.log(`   - ID: ${createData.user.id}`)
            console.log(`   - Email: ${createData.user.email}\n`)
        }

        // Step 3: Verify Prisma database
        console.log('📋 Paso 3: Verificando usuario en Prisma...')
        const prismaUser = await prisma.user.findUnique({
            where: { email: targetEmail }
        })

        if (!prismaUser) {
            console.error('❌ ERROR: Usuario no encontrado en Prisma')
            process.exit(1)
        }

        console.log(`✅ Usuario encontrado en Prisma:`)
        console.log(`   - ID: ${prismaUser.id}`)
        console.log(`   - Nombre: ${prismaUser.name}`)
        console.log(`   - Email: ${prismaUser.email}`)
        console.log(`   - Rol: ${prismaUser.role}\n`)

        // Step 4: Final verification
        console.log('📋 Paso 4: Verificación final de sincronización...')

        // List all auth users for verification
        const { data: finalAuthUsers } = await supabaseAdmin.auth.admin.listUsers()
        const finalAuthUser = finalAuthUsers?.users.find(u => u.email === targetEmail)

        if (finalAuthUser && prismaUser) {
            console.log('✅ SINCRONIZACIÓN EXITOSA\n')
            console.log('📊 Estado final:')
            console.log(`   Supabase Auth: ${finalAuthUser.email} (ID: ${finalAuthUser.id})`)
            console.log(`   Prisma DB: ${prismaUser.email} (ID: ${prismaUser.id})`)
            console.log(`   Rol: ${prismaUser.role}`)
            console.log('\n🔐 Credenciales actualizadas:')
            console.log(`   - Email: ${targetEmail}`)
            console.log(`   - Contraseña: ${newPassword}`)
            console.log(`   - Email confirmado: Sí`)
            console.log('\n✅ El login debería funcionar correctamente ahora')
        } else {
            console.error('❌ ERROR: La sincronización falló')
            process.exit(1)
        }

    } catch (error) {
        console.error('❌ ERROR durante la sincronización:', error)
        process.exit(1)
    } finally {
        await prisma.$disconnect()
    }
}

// Execute sync
syncSupabaseAuth()
