import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function migrateAdminAccount() {
    try {
        console.log('🔄 Iniciando migración de cuenta de administrador...\n')

        // Step 1: Find current admin account FIRST (needed for reassignment)
        console.log('📋 Paso 1: Buscando cuenta de administrador principal...')
        const adminUser = await prisma.user.findFirst({
            where: { role: 'ADMIN' }
        })

        if (!adminUser) {
            console.error('❌ ERROR: No se encontró ninguna cuenta de administrador')
            process.exit(1)
        }

        console.log(`✅ Admin encontrado: ${adminUser.name} (${adminUser.email})\n`)

        // Step 2: Find and handle duplicate user (Consultor role)
        console.log('📋 Paso 2: Buscando usuario duplicado...')
        const duplicateUser = await prisma.user.findFirst({
            where: {
                email: 'maxhigareda@thestoreintelligence.com',
                role: 'CONSULTOR'
            }
        })

        if (duplicateUser) {
            console.log(`✅ Usuario duplicado encontrado: ${duplicateUser.name} (${duplicateUser.email})`)

            // Reassign quotes from duplicate user to admin
            console.log('🔄 Reasignando cotizaciones del usuario duplicado al administrador...')
            const quotesCount = await prisma.quote.count({
                where: { userId: duplicateUser.id }
            })

            if (quotesCount > 0) {
                await prisma.quote.updateMany({
                    where: { userId: duplicateUser.id },
                    data: { userId: adminUser.id }
                })
                console.log(`✅ ${quotesCount} cotizaciones reasignadas exitosamente`)
            } else {
                console.log('ℹ️  No se encontraron cotizaciones para reasignar')
            }

            // Now safe to delete duplicate user
            console.log('🗑️  Eliminando usuario duplicado...')
            await prisma.user.delete({
                where: { id: duplicateUser.id }
            })

            console.log('✅ Usuario duplicado eliminado exitosamente\n')
        } else {
            console.log('ℹ️  No se encontró usuario duplicado\n')
        }

        // Step 3: Generate new password hash
        console.log('📋 Paso 3: Generando hash de nueva contraseña...')
        const newPassword = 'admin2026'
        const hashedPassword = await bcrypt.hash(newPassword, 10)
        console.log('✅ Hash generado exitosamente\n')

        // Step 4: Update admin credentials
        console.log('📋 Paso 4: Actualizando credenciales del administrador...')
        const updatedAdmin = await prisma.user.update({
            where: { id: adminUser.id },
            data: {
                email: 'maxhigareda@thestoreintelligence.com',
                password: hashedPassword
            }
        })

        console.log('✅ Credenciales actualizadas exitosamente\n')

        // Step 5: Verify the update
        console.log('📋 Paso 5: Verificando actualización...')
        const verifiedAdmin = await prisma.user.findUnique({
            where: { email: 'maxhigareda@thestoreintelligence.com' }
        })

        if (verifiedAdmin && verifiedAdmin.role === 'ADMIN') {
            console.log('✅ VERIFICACIÓN EXITOSA')
            console.log('\n📊 Detalles de la cuenta actualizada:')
            console.log(`   - ID: ${verifiedAdmin.id}`)
            console.log(`   - Nombre: ${verifiedAdmin.name}`)
            console.log(`   - Email: ${verifiedAdmin.email}`)
            console.log(`   - Rol: ${verifiedAdmin.role}`)
            console.log('\n🔐 Nuevas credenciales:')
            console.log(`   - Email: maxhigareda@thestoreintelligence.com`)
            console.log(`   - Contraseña: admin2026`)
            console.log('\n✅ Migración completada exitosamente!')
        } else {
            console.error('❌ ERROR: La verificación falló')
            process.exit(1)
        }

    } catch (error) {
        console.error('❌ ERROR durante la migración:', error)
        process.exit(1)
    } finally {
        await prisma.$disconnect()
    }
}

// Execute migration
migrateAdminAccount()
