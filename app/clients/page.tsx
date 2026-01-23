
import { searchClients } from '@/lib/actions'
import { ClientFormModal } from '@/components/clients/client-form-modal'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Search, Briefcase, User, Mail, Building } from 'lucide-react'
import { redirect } from 'next/navigation'
import { getSessionUser } from '@/lib/auth'

export default async function ClientsPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
    // 1. Verify Session
    const user = await getSessionUser()
    if (!user) redirect('/login')

    const params = await searchParams
    const query = params.q || ""

    // 2. Fetch Clients (Server-Side)
    // Note: searchClients("") returns ALL clients for the user
    // We can also implement client-side filtering if preferred, but this follows the "Search" pattern
    const clients = await searchClients(query)

    return (
        <div className="min-h-screen bg-[#242423] pt-24 pb-12 px-6">
            <div className="max-w-6xl mx-auto space-y-8">

                {/* HEADLINE */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#333533] pb-6">
                    <div>
                        <h1 className="text-3xl font-bold text-[#E8EDDF] flex items-center gap-3">
                            <Briefcase className="w-8 h-8 text-[#F5CB5C]" />
                            Cartera de Clientes
                        </h1>
                        <p className="text-[#CFDBD5] mt-2">
                            Gestiona tu agenda de contactos y empresas para cotizaciones rápidas.
                        </p>
                    </div>
                    <ClientFormModal />
                </div>

                {/* SEARCH & FILTER */}
                <div className="relative max-w-md">
                    <Search className="absolute left-3 top-3 w-4 h-4 text-[#CFDBD5]" />
                    <form>
                        <Input
                            name="q"
                            defaultValue={query}
                            placeholder="Buscar empresa, contacto o email..."
                            className="bg-[#333533] border-transparent focus:border-[#F5CB5C] pl-10 text-[#E8EDDF] h-10 w-full rounded-xl"
                        />
                    </form>
                </div>

                {/* CLIENTS TABLE */}
                <Card className="bg-[#333533]/50 border-[#333533] shadow-xl backdrop-blur-sm">
                    <CardHeader>
                        <CardTitle className="text-[#F5CB5C]">Listado Global</CardTitle>
                        <CardDescription className="text-[#CFDBD5]">
                            Tus clientes están disponibles en todos los módulos de cotización.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {clients.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-12 text-[#CFDBD5] opacity-60">
                                <Briefcase className="w-12 h-12 mb-4" />
                                <p>No se encontraron clientes.</p>
                                {query && <p className="text-sm">Prueba con otro término de búsqueda.</p>}
                            </div>
                        ) : (
                            <Table>
                                <TableHeader className="hover:bg-transparent">
                                    <TableRow className="border-[#333533] hover:bg-transparent">
                                        <TableHead className="text-[#F5CB5C] font-bold">Empresa</TableHead>
                                        <TableHead className="text-[#F5CB5C] font-bold">Contacto</TableHead>
                                        <TableHead className="text-[#F5CB5C] font-bold">Email</TableHead>
                                        <TableHead className="text-[#F5CB5C] font-bold text-right">Estatus</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {clients.map((client) => (
                                        <TableRow key={client.id} className="border-[#333533] hover:bg-[#333533]">
                                            <TableCell className="font-medium text-[#E8EDDF] flex items-center gap-2">
                                                <Building className="w-4 h-4 text-[#CFDBD5]" />
                                                {client.companyName}
                                            </TableCell>
                                            <TableCell className="text-[#CFDBD5]">
                                                <div className="flex items-center gap-2">
                                                    <User className="w-3 h-3 opacity-70" />
                                                    {client.contactName || '-'}
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-[#CFDBD5]">
                                                <div className="flex items-center gap-2">
                                                    <Mail className="w-3 h-3 opacity-70" />
                                                    {client.email || '-'}
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <Badge className={`
                                                    ${client.status === 'CLIENTE' ? 'bg-[#F5CB5C] text-[#242423]' : 'bg-[#CFDBD5] text-[#242423]'}
                                                    hover:opacity-80
                                                `}>
                                                    {client.status}
                                                </Badge>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
