import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function diagnoseAndRepairAdmin() {
    try {
        console.log('🔍 DIAGNÓSTICO DE ERROR DE MIGRACIÓN\n')

        // Step 1: Check all users in the database
        console.log('📋 Paso 1: Verificando todos los usuarios en la base de datos...')
        const allUsers = await prisma.user.findMany({
            select: {
                id: true,
                email: true,
                name: true,
                role: true,
                createdAt: true
            },
            orderBy: { createdAt: 'asc' }
        })

        console.log(`✅ Total de usuarios encontrados: ${allUsers.length}\n`)
        allUsers.forEach((user, idx) => {
            console.log(`${idx + 1}. ${user.name} (${user.email})`)
            console.log(`   - ID: ${user.id}`)
            console.log(`   - Rol: ${user.role}`)
            console.log(`   - Creado: ${user.createdAt}`)
            console.log('')
        })

        // Step 2: Check for duplicates with the target email
        console.log('📋 Paso 2: Buscando duplicados con email objetivo...')
        const targetEmail = 'maxhigareda@thestoreintelligence.com'
        const duplicates = await prisma.user.findMany({
            where: { email: targetEmail }
        })

        if (duplicates.length > 1) {
            console.log(`⚠️  PROBLEMA: Se encontraron ${duplicates.length} registros con el email ${targetEmail}`)
            duplicates.forEach((dup, idx) => {
                console.log(`   ${idx + 1}. ID: ${dup.id}, Rol: ${dup.role}, Nombre: ${dup.name}`)
            })
            console.log('')
        } else if (duplicates.length === 1) {
            console.log(`✅ Solo hay 1 registro con el email ${targetEmail}`)
            console.log(`   - ID: ${duplicates[0].id}`)
            console.log(`   - Rol: ${duplicates[0].role}`)
            console.log(`   - Nombre: ${duplicates[0].name}\n`)
        } else {
            console.log(`ℹ️  No se encontró ningún registro con el email ${targetEmail}\n`)
        }

        // Step 3: Find admin user
        console.log('📋 Paso 3: Buscando cuenta de administrador...')
        const adminUsers = await prisma.user.findMany({
            where: { role: 'ADMIN' }
        })

        if (adminUsers.length === 0) {
            console.error('❌ ERROR CRÍTICO: No se encontró ninguna cuenta de administrador')
            process.exit(1)
        } else if (adminUsers.length > 1) {
            console.log(`⚠️  ADVERTENCIA: Se encontraron ${adminUsers.length} cuentas de administrador:`)
            adminUsers.forEach((admin, idx) => {
                console.log(`   ${idx + 1}. ${admin.name} (${admin.email}) - ID: ${admin.id}`)
            })
            console.log('')
        } else {
            console.log(`✅ Se encontró 1 cuenta de administrador:`)
            console.log(`   - ${adminUsers[0].name} (${adminUsers[0].email})`)
            console.log(`   - ID: ${adminUsers[0].id}\n`)
        }

        // Step 4: Cleanup strategy
        console.log('📋 Paso 4: Estrategia de limpieza...\n')

        // If there are multiple admins, keep only the first one
        if (adminUsers.length > 1) {
            console.log('🔧 Eliminando administradores duplicados...')
            const primaryAdmin = adminUsers[0]
            const duplicateAdmins = adminUsers.slice(1)

            for (const dupAdmin of duplicateAdmins) {
                // Reassign quotes if any
                const quotesCount = await prisma.quote.count({
                    where: { userId: dupAdmin.id }
                })

                if (quotesCount > 0) {
                    await prisma.quote.updateMany({
                        where: { userId: dupAdmin.id },
                        data: { userId: primaryAdmin.id }
                    })
                    console.log(`   ✅ ${quotesCount} cotizaciones reasignadas de ${dupAdmin.email} a ${primaryAdmin.email}`)
                }

                await prisma.user.delete({
                    where: { id: dupAdmin.id }
                })
                console.log(`   ✅ Administrador duplicado eliminado: ${dupAdmin.email}`)
            }
            console.log('')
        }

        // Step 5: Ensure single admin with correct credentials
        console.log('📋 Paso 5: Actualizando credenciales del administrador único...')

        const finalAdmin = await prisma.user.findFirst({
            where: { role: 'ADMIN' }
        })

        if (!finalAdmin) {
            console.error('❌ ERROR: No se pudo encontrar el administrador después de la limpieza')
            process.exit(1)
        }

        // Generate new password hash
        const newPassword = 'admin2026'
        const hashedPassword = await bcrypt.hash(newPassword, 10)

        // Update admin
        const updatedAdmin = await prisma.user.update({
            where: { id: finalAdmin.id },
            data: {
                email: 'maxhigareda@thestoreintelligence.com',
                password: hashedPassword,
                role: 'ADMIN'
            }
        })

        console.log('✅ Administrador actualizado exitosamente\n')

        // Step 6: Final verification
        console.log('📋 Paso 6: Verificación final...')
        const finalUsers = await prisma.user.findMany({
            select: {
                id: true,
                email: true,
                name: true,
                role: true
            }
        })

        console.log(`\n📊 Estado final de usuarios (Total: ${finalUsers.length}):`)
        finalUsers.forEach((user, idx) => {
            const marker = user.role === 'ADMIN' ? '👑' : '👤'
            console.log(`${marker} ${idx + 1}. ${user.name} (${user.email}) - ${user.role}`)
        })

        console.log('\n✅ REPARACIÓN COMPLETADA')
        console.log('\n🔐 Credenciales de administrador:')
        console.log(`   - Email: maxhigareda@thestoreintelligence.com`)
        console.log(`   - Contraseña: admin2026`)
        console.log(`   - Rol: ADMIN`)

    } catch (error) {
        console.error('❌ ERROR durante la reparación:', error)
        process.exit(1)
    } finally {
        await prisma.$disconnect()
    }
}

// Execute repair
diagnoseAndRepairAdmin()
