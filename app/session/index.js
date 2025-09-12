// app/session.js
import { auth } from '@/auth'

export async function getSession() {
    const s = await auth()
    return s || null
}

export async function getSessionUserLite() {
    const s = await auth()
    if (!s?.user) return null
    const u = s.user
    console.log(s);

    return {
        id: u.id,
        email: u.email,
        username: u.username ?? null,
        role: u.role ?? 'user',
        status: u.status ?? 'active',
        name: u.name ?? null,
        image: u.image ?? null,
        dob: u.dob ?? null,
        // bổ sung thông tin an toàn
        phone: u.phone ?? null,
        nationalIdMasked: u.nationalIdMasked ?? '',
    }
}
