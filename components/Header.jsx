// components/Header.js
import { getSessionUserLite } from '@/app/session'
import HeaderClient from './HeaderClient'

export const dynamic = 'force-dynamic' 

export default async function Header() {
    const user = await getSessionUserLite()
    console.log(user);
    
    return <HeaderClient user={user} />
}
