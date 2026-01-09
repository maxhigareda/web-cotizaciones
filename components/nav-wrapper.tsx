import Navbar from './navbar'
import { getSessionRole, getSessionUser } from '@/lib/auth'

export async function NavWrapper() {
    const role = await getSessionRole()
    const user = await getSessionUser()
    return <Navbar userRole={role} userName={user} />
}
